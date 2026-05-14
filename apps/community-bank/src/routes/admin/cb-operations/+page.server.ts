import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getAccountByUuid, searchAccounts } from '$lib/server/accounts.js';
import { postTransaction, getLedgerStats } from '$lib/server/ledger.js';
import { TransactionType, TransactionSource } from '$lib/server/transaction-types.js';
import { logAdminAction } from '$lib/server/admin.js';
import { db } from '$lib/server/db.js';

// Get Central Bank account
function getCentralBankAccount() {
	return db
		.prepare(`SELECT * FROM account WHERE account_type = 'system' AND name = 'Central Bank' LIMIT 1`)
		.get() as any;
}

// Get recent issuance transactions (last 30 days)
function getRecentIssuances() {
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	
	return db
		.prepare(
			`SELECT t.*, 
			        a_to.handle_cache as to_handle, 
			        a_to.name as to_name
			 FROM "transaction" t
			 JOIN account a_to ON t.to_uuid = a_to.uuid
			 WHERE t.type = 'issuance' 
			   AND t.created_at >= ?
			 ORDER BY t.created_at DESC
			 LIMIT 50`
		)
		.all(thirtyDaysAgo.toISOString()) as any[];
}

// Get recent destruction transactions (last 30 days)
function getRecentDestructions() {
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	
	return db
		.prepare(
			`SELECT t.*, 
			        a_from.handle_cache as from_handle, 
			        a_from.name as from_name
			 FROM "transaction" t
			 JOIN account a_from ON t.from_uuid = a_from.uuid
			 WHERE t.type = 'destruction' 
			   AND t.created_at >= ?
			 ORDER BY t.created_at DESC
			 LIMIT 50`
		)
		.all(thirtyDaysAgo.toISOString()) as any[];
}

export const load: PageServerLoad = async () => {
	const cbAccount = getCentralBankAccount();
	const stats = getLedgerStats();
	const recentIssuances = getRecentIssuances();
	const recentDestructions = getRecentDestructions();
	
	// Get Treasury account for default recipient
	const treasuryAccount = db
		.prepare(`SELECT * FROM account WHERE handle_cache = 'treasury' LIMIT 1`)
		.get() as any;
	
	return {
		cbAccount,
		treasuryAccount,
		stats,
		recentIssuances,
		recentDestructions,
	};
};

export const actions: Actions = {
	issue: async ({ request, locals }) => {
		const data = await request.formData();
		const toUuid = String(data.get('to_uuid') ?? '').trim();
		const amountFranks = parseFloat(String(data.get('amount') ?? '0'));
		const memo = String(data.get('memo') ?? '').trim() || null;
		const txType = String(data.get('type') ?? 'issuance').trim();

		// Validation
		if (!toUuid) return fail(400, { error: 'Recipient account is required' });
		if (!amountFranks || amountFranks <= 0) return fail(400, { error: 'Amount must be positive' });

		const cbAccount = getCentralBankAccount();
		if (!cbAccount) return fail(500, { error: 'Central Bank account not found' });

		const toAccount = getAccountByUuid(toUuid);
		if (!toAccount) return fail(400, { error: 'Recipient account not found' });
		if (toAccount.status === 'frozen') return fail(400, { error: 'Recipient account is frozen' });

		try {
			const amountCents = Math.round(amountFranks * 100);
			
			postTransaction({
				from_uuid: cbAccount.uuid,
				to_uuid: toUuid,
				amount: amountCents,
				type: txType as any,
				source: TransactionSource.ADMIN,
				memo,
				entered_by_uuid: locals.session!.acting_as_uuid,
			});

			logAdminAction({
				action: 'cb_issue_franks',
				target_uuid: toAccount.uuid,
				target_type: 'account',
				actor_uuid: locals.session!.acting_as_uuid,
				memo: `Issued ƒ${amountFranks.toFixed(2)} to ${toAccount.handle_cache} (${memo || 'no memo'})`,
			});

			return { success: true, action: 'issue' };
		} catch (err) {
			return fail(500, { error: String(err) });
		}
	},

	destroy: async ({ request, locals }) => {
		const data = await request.formData();
		const fromUuid = String(data.get('from_uuid') ?? '').trim();
		const amountFranks = parseFloat(String(data.get('amount') ?? '0'));
		const memo = String(data.get('memo') ?? '').trim() || null;

		// Validation
		if (!fromUuid) return fail(400, { error: 'Source account is required' });
		if (!amountFranks || amountFranks <= 0) return fail(400, { error: 'Amount must be positive' });

		const cbAccount = getCentralBankAccount();
		if (!cbAccount) return fail(500, { error: 'Central Bank account not found' });

		const fromAccount = getAccountByUuid(fromUuid);
		if (!fromAccount) return fail(400, { error: 'Source account not found' });
		if (fromAccount.status === 'frozen') return fail(400, { error: 'Source account is frozen' });

		try {
			const amountCents = Math.round(amountFranks * 100);
			
			postTransaction({
				from_uuid: fromUuid,
				to_uuid: cbAccount.uuid,
				amount: amountCents,
				type: TransactionType.DESTRUCTION,
				source: TransactionSource.ADMIN,
				memo,
				entered_by_uuid: locals.session!.acting_as_uuid,
			});

			logAdminAction({
				action: 'cb_destroy_franks',
				target_uuid: fromAccount.uuid,
				target_type: 'account',
				actor_uuid: locals.session!.acting_as_uuid,
				memo: `Destroyed ƒ${amountFranks.toFixed(2)} from ${fromAccount.handle_cache} (${memo || 'no memo'})`,
			});

			return { success: true, action: 'destroy' };
		} catch (err) {
			return fail(500, { error: String(err) });
		}
	},
};
