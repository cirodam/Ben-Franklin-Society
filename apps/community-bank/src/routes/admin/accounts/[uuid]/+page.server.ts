import { fail, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getAccountByUuid, freezeAccount, unfreezeAccount } from '$lib/server/accounts.js';
import { getTransactionsForAccount, postTransaction } from '$lib/server/ledger.js';
import { logAdminAction, getAdminActionsForTarget } from '$lib/server/admin.js';
import { db } from '$lib/server/db.js';

const PAGE_SIZE = 50;

function getCentralBankUuid(): string | null {
	const row = db.prepare(`SELECT uuid FROM account WHERE name = 'Central Bank' LIMIT 1`).get() as { uuid: string } | undefined;
	return row?.uuid ?? null;
}

export const load: PageServerLoad = async ({ params, url }) => {
	const account = getAccountByUuid(params.uuid);
	if (!account) error(404, 'Account not found.');

	const page   = Math.max(0, Number(url.searchParams.get('page') ?? 0));
	const offset = page * PAGE_SIZE;
	const transactions = getTransactionsForAccount(account.uuid, { limit: PAGE_SIZE, offset });
	const auditLog = getAdminActionsForTarget(account.uuid);

	// Use handle_cache as principal label (bank doesn't query governance for names)
	const principalLabel = account.handle_cache 
		? `@${account.handle_cache}`
		: `Principal: ${account.principal_uuid.slice(0, 8)}…`;

	return { account, transactions, auditLog, principalLabel, page, pageSize: PAGE_SIZE };
};

export const actions: Actions = {
	freeze: async ({ params, locals }) => {
		const account = getAccountByUuid(params.uuid);
		if (!account) return fail(404, { error: 'Account not found.' });
		if (account.status === 'frozen') return fail(400, { error: 'Account is already frozen.' });

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
		if (account.status === 'active') return fail(400, { error: 'Account is already active.' });

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
		const direction  = String(data.get('direction') ?? '').trim();  // 'credit' | 'debit'
		const amount_str = String(data.get('amount')    ?? '').trim();
		const memo       = String(data.get('memo')      ?? '').trim();

		if (!direction || !amount_str || !memo)
			return fail(400, { error: 'Direction, amount, and memo are all required for a correction.' });

		const amount = parseInt(amount_str, 10);
		if (isNaN(amount) || amount <= 0)
			return fail(400, { error: 'Amount must be a positive whole number.' });

		if (memo.length < 10)
			return fail(400, { error: 'Memo must be at least 10 characters for audit purposes.' });

		const account = getAccountByUuid(params.uuid);
		if (!account) return fail(404, { error: 'Account not found.' });

		const cbUuid = getCentralBankUuid();
		if (!cbUuid) return fail(500, { error: 'Central Bank account not found. Run seed.' });

		// Credit = funds flow from CB to account (increasing balance).
		// Debit  = funds flow from account to CB (decreasing balance).
		const from_uuid = direction === 'credit' ? cbUuid : account.uuid;
		const to_uuid   = direction === 'credit' ? account.uuid : cbUuid;

		postTransaction({
			from_uuid,
			to_uuid,
			amount,
			type: 'correction',
			source: 'admin',
			memo,
			entered_by_uuid: locals.session!.acting_as_uuid,
		});

		logAdminAction({
			action: `correction:${direction}`,
			target_uuid: account.uuid,
			target_type: 'account',
			actor_uuid: locals.session!.acting_as_uuid,
			memo: `${direction === 'credit' ? 'Credit' : 'Debit'} correction of ${amount} ƒ. ${memo}`,
		});

		return { success: true };
	},
};
