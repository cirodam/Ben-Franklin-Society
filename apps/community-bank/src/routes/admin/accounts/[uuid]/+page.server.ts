import { fail, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getAccountByUuid, freezeAccount, unfreezeAccount } from '$lib/server/domain/accounts.js';
import { getTransactionsForAccount } from '$lib/server/core/ledger.js';
import { logAdminAction, getAdminActionsForTarget } from '$lib/server/admin.js';
import { db } from '$lib/server/core/db.js';

const PAGE_SIZE = 50;

export const load: PageServerLoad = async ({ params, url }) => {
	const account = getAccountByUuid(params.uuid);
	if (!account) error(404, 'Account not found.');

	const page   = Math.max(0, Number(url.searchParams.get('page') ?? 0));
	const offset = page * PAGE_SIZE;
	const transactions = getTransactionsForAccount(account.uuid, { limit: PAGE_SIZE, offset });
	const auditLog = getAdminActionsForTarget(account.uuid);

	return { account, transactions, auditLog, page, pageSize: PAGE_SIZE };
};

export const actions: Actions = {
	freeze: async ({ params, locals }) => {
		const account = getAccountByUuid(params.uuid);
		if (!account) return fail(404, { error: 'Account not found.' });
		if (account.is_frozen === 1) return fail(400, { error: 'Account is already frozen.' });

		freezeAccount(account.uuid);
		logAdminAction({
			action: 'freeze',
			target_uuid: account.uuid,
			target_type: 'account',
			actor_uuid: locals.session!.acting_as_uuid,
			memo: 'Account frozen by admin.',
		});
		return { success: true };
	},

	unfreeze: async ({ params, locals }) => {
		const account = getAccountByUuid(params.uuid);
		if (!account) return fail(404, { error: 'Account not found.' });
		if (account.is_frozen === 0) return fail(400, { error: 'Account is already active.' });

		unfreezeAccount(account.uuid);
		logAdminAction({
			action: 'unfreeze',
			target_uuid: account.uuid,
			target_type: 'account',
			actor_uuid: locals.session!.acting_as_uuid,
			memo: 'Account unfrozen by admin.',
		});
		return { success: true };
	},

	correct: async ({ params, locals, request }) => {
		const data = await request.formData();
		const currency   = String(data.get('currency')  ?? '').trim();
		const direction  = String(data.get('direction') ?? '').trim();  // 'credit' | 'debit'
		const amount_str = String(data.get('amount')    ?? '').trim();
		const memo       = String(data.get('memo')      ?? '').trim();

		if (!currency || !direction || !amount_str || !memo)
			return fail(400, { error: 'Currency, direction, amount, and memo are all required for a correction.' });

		if (!['franks', 'florens'].includes(currency))
			return fail(400, { error: 'Invalid currency type.' });

		const amount = parseInt(amount_str, 10);
		if (isNaN(amount) || amount <= 0)
			return fail(400, { error: 'Amount must be a positive whole number.' });

		if (memo.length < 10)
			return fail(400, { error: 'Memo must be at least 10 characters for audit purposes.' });

		const account = getAccountByUuid(params.uuid);
		if (!account) return fail(404, { error: 'Account not found.' });

		// Credit = increase balance, Debit = decrease balance
		const adjustment = direction === 'credit' ? amount : -amount;
		const balanceColumn = currency === 'franks' ? 'franks_balance' : 'florens_balance';
		
		db.prepare(`UPDATE account SET ${balanceColumn} = ${balanceColumn} + ? WHERE uuid = ?`).run(adjustment, account.uuid);

		logAdminAction({
			action: `correction:${direction}`,
			target_uuid: account.uuid,
			target_type: 'account',
			actor_uuid: locals.session!.acting_as_uuid,
			memo: `${direction === 'credit' ? 'Credit' : 'Debit'} correction of ${amount} ${currency}. ${memo}`,
		});

		return { success: true };
	},
};
