/**
 * Scheduler — automated execution of grouped transfers.
 *
 * Job:
 *  1. runGroupedTransfers()   — execute active grouped transfers (flat and percentage modes).
 *
 * Grouped transfers are mechanical execution only — the bank has no policy opinions.
 * People create transfers manually via UI, scheduler executes them on schedule.
 *
 * All jobs are idempotent — safe to call multiple times per period. Idempotency is tracked
 * in the `scheduler_run` table (UNIQUE on job + period_key).
 * 
 * Note: All other operations are manual:
 * - Account creation: Tellers create accounts when people walk in
 * - Birthday issuance: CB employees post issuance transactions
 * - Treasury collections: Treasury employees create grouped transfers
 * - Account freezing: Tellers freeze accounts when members revoked
 */

import { db } from './db.js';
import { postTransaction } from './ledger.js';
import { getTargetAccounts, type GroupedTransfer } from './grouped-transfers.js';
import { TransactionSource } from './transaction-types.js';
import {
	alreadyRan,
	markRan,
	periodKey,
	type JobResult,
} from './scheduler-utils.js';

// ---------------------------------------------------------------------------
// Job 1 — Run active grouped transfers (flat and percentage modes)
// ---------------------------------------------------------------------------

export function runGroupedTransfers(): JobResult {
	const result: JobResult = { executed: 0, skipped: 0, errors: [] };

	const transfers = db
		.prepare(`SELECT * FROM scheduled_transfer WHERE status = 'active'`)
		.all() as GroupedTransfer[];

	for (const t of transfers) {
		const pk = periodKey(t.schedule);
		const jobKey = `grouped-transfer:${t.uuid}`;

		if (alreadyRan(jobKey, pk)) {
			result.skipped++;
			continue;
		}

		try {
			if (t.transfer_mode === 'flat') {
				// Flat mode: single transaction from specific account
				if (!t.from_uuid || !t.amount) {
					throw new Error('Flat mode requires from_uuid and amount');
				}

				postTransaction({
					from_uuid: t.from_uuid,
					to_uuid: t.to_uuid,
					amount: t.amount,
					type: t.type,
					source: TransactionSource.SCHEDULED,
					scheduled_transfer_uuid: t.uuid,
					memo: t.name,
				});
				markRan(jobKey, pk, { amount: t.amount });
				result.executed++;
			} else {
				// Percentage mode: multiple transactions from many accounts
				if (!t.rate_percentage) {
					throw new Error('Percentage mode requires rate_percentage');
				}

				const targetAccounts = getTargetAccounts(t);
				let totalAmount = 0;
				let transactionCount = 0;

				for (const account of targetAccounts) {
					const chargeAmount = Math.floor(account.balance * t.rate_percentage);
					if (chargeAmount > 0) {
						postTransaction({
							from_uuid: account.uuid,
							to_uuid: t.to_uuid,
							amount: chargeAmount,
							type: t.type,
							source: TransactionSource.SCHEDULED,
							scheduled_transfer_uuid: t.uuid,
							memo: t.name,
						});
						totalAmount += chargeAmount;
						transactionCount++;
					}
				}

				markRan(jobKey, pk, { 
					transaction_count: transactionCount,
					total_amount: totalAmount,
					target_count: targetAccounts.length,
				});
				result.executed++;
			}
		} catch (e) {
			result.errors.push(`Transfer ${t.uuid} (${t.name}): ${String(e)}`);
		}
	}

	return result;
}

// ---------------------------------------------------------------------------
// Run all jobs
// ---------------------------------------------------------------------------

export interface AllJobResults {
	groupedTransfers: JobResult;
}

export function runAll(): AllJobResults {
	return {
		groupedTransfers: runGroupedTransfers(),
	};
}
