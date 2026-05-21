import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { getConfig, setConfig } from './config.js';
import { getAccountByUuid } from './accounts.js';
import type { Account } from './accounts.js';

// --- Types ---

export interface DemurrageConfig {
	rate_percent: number;
	destination_account_uuid: string;
	enabled: boolean;
}

export interface DemurrageOperation {
	uuid: string;
	collection_date: string;
	accounts_processed: number;
	accounts_charged: number;
	total_collected: number;
	destination_uuid: string;
	performed_by_uuid: string;
	performed_at: string;
	notes: string | null;
}

export interface CollectionSummary {
	operation: DemurrageOperation;
	summary: {
		accounts_exempt: number;
		accounts_zero_balance: number;
		accounts_charged: number;
		total_collected: number;
		destination_balance_after: number;
	};
}

// --- Configuration ---

export function getDemurrageConfig(): DemurrageConfig | null {
	const rateStr = getConfig('demurrage:rate_percent');
	const destinationUuid = getConfig('demurrage:destination_account_uuid');
	const enabledStr = getConfig('demurrage:enabled');

	if (!rateStr || !destinationUuid || !enabledStr) {
		return null;
	}

	return {
		rate_percent: Number(rateStr),
		destination_account_uuid: destinationUuid,
		enabled: enabledStr === '1'
	};
}

export function updateDemurrageConfig(config: Partial<DemurrageConfig>): void {
	if (config.rate_percent !== undefined) {
		setConfig('demurrage:rate_percent', config.rate_percent.toString());
	}
	if (config.destination_account_uuid !== undefined) {
		setConfig('demurrage:destination_account_uuid', config.destination_account_uuid);
	}
	if (config.enabled !== undefined) {
		setConfig('demurrage:enabled', config.enabled ? '1' : '0');
	}
}

export function isDemurrageEnabled(): boolean {
	const config = getDemurrageConfig();
	return config?.enabled ?? false;
}

// --- Calculation ---

/**
 * Calculate demurrage for a given balance
 * Formula: balance × (rate_percent / 100)
 */
export function calculateDemurrage(
	balance: number,
	ratePercent: number
): number {
	if (balance <= 0 || ratePercent <= 0) {
		return 0;
	}

	const amount = Math.floor(balance * (ratePercent / 100));
	return Math.max(0, amount);
}

// --- Collection Operation ---

/**
 * Collect demurrage from all non-exempt accounts
 */
export function collectDemurrage(opts: {
	performedByUuid: string;
	collectionDate?: string;
	notes?: string;
}): CollectionSummary {
	const config = getDemurrageConfig();
	if (!config || !config.enabled) {
		throw new Error('Demurrage is not enabled');
	}

	const destinationAccount = getAccountByUuid(config.destination_account_uuid);
	if (!destinationAccount) {
		throw new Error('Destination account not found');
	}

	const collectionDate = opts.collectionDate ?? new Date().toISOString().split('T')[0];
	const now = new Date().toISOString();
	const operationUuid = randomUUID();

	// Get all accounts that should be charged (non-exempt, positive balance)
	const eligibleAccounts = db
		.prepare(
			`SELECT * FROM account 
			 WHERE demurrage_exempt = 0 
			 AND balance > 0
			 ORDER BY uuid`
		)
		.all() as Account[];

	const allAccounts = db
		.prepare('SELECT COUNT(*) as count FROM account')
		.get() as { count: number };
	const exemptAccounts = db
		.prepare('SELECT COUNT(*) as count FROM account WHERE demurrage_exempt = 1')
		.get() as { count: number };
	const zeroBalanceAccounts =
		allAccounts.count - exemptAccounts.count - eligibleAccounts.length;

	let totalCollected = 0;
	let accountsCharged = 0;

	// Process each eligible account
	db.transaction(() => {
		for (const account of eligibleAccounts) {
			// Calculate demurrage amount (simple percentage)
			let amount = calculateDemurrage(account.balance, config.rate_percent);

			// Don't charge more than the balance
			if (amount > account.balance) {
				amount = account.balance;
			}

			if (amount === 0) {
				continue; // Skip if no charge
			}

			const balanceBefore = account.balance;
			const balanceAfter = balanceBefore - amount;

			// Create transaction
			const transactionUuid = randomUUID();
			db.prepare(
				`INSERT INTO "transaction" 
				(uuid, from_uuid, to_uuid, amount, type, source, memo, created_at)
				VALUES (?, ?, ?, ?, 'demurrage', 'system', ?, ?)`
			).run(
				transactionUuid,
				account.uuid,
				config.destination_account_uuid,
				amount,
				'Demurrage collection',
				now
			);

			// Update account balance
			db.prepare('UPDATE account SET balance = balance - ? WHERE uuid = ?').run(
				amount,
				account.uuid
			);

			// Update destination account balance
			db.prepare('UPDATE account SET balance = balance + ? WHERE uuid = ?').run(
				amount,
				config.destination_account_uuid
			);

			accountsCharged++;
			totalCollected += amount;
		}

		// Log operation
		db.prepare(
			`INSERT INTO demurrage_operation
			(uuid, collection_date, accounts_processed, accounts_charged, total_collected, destination_uuid, performed_by_uuid, performed_at, notes)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			operationUuid,
			collectionDate,
			eligibleAccounts.length,
			accountsCharged,
			totalCollected,
			config.destination_account_uuid,
			opts.performedByUuid,
			now,
			opts.notes ?? null
		);
	})();

	const operation = getDemurrageOperationByUuid(operationUuid)!;
	const destinationAccountAfter = getAccountByUuid(config.destination_account_uuid)!;

	return {
		operation,
		summary: {
			accounts_exempt: exemptAccounts.count,
			accounts_zero_balance: zeroBalanceAccounts,
			accounts_charged: accountsCharged,
			total_collected: totalCollected,
			destination_balance_after: destinationAccountAfter.balance
		}
	};
}

// --- Queries ---

export function getDemurrageOperationByUuid(uuid: string): DemurrageOperation | null {
	return (
		(db
			.prepare('SELECT * FROM demurrage_operation WHERE uuid = ?')
			.get(uuid) as DemurrageOperation | undefined) ?? null
	);
}

export function getDemurrageOperations(opts?: {
	limit?: number;
	offset?: number;
}): DemurrageOperation[] {
	const limit = opts?.limit ?? 50;
	const offset = opts?.offset ?? 0;

	return db
		.prepare(
			'SELECT * FROM demurrage_operation ORDER BY performed_at DESC LIMIT ? OFFSET ?'
		)
		.all(limit, offset) as DemurrageOperation[];
}
