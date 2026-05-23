import { randomUUID } from 'node:crypto';
import { db } from '../core/db.js';
import { getConfig, setConfig } from '../config.js';

// --- Types ---

export interface MonetaryPolicy {
	franks_per_person_year: number;
	tolerance_percent: number;
}

export interface MonetarySupply {
	minted_supply: number;
	total_supply: number;
	external_supply: number;
}

export interface MonetaryOperation {
	uuid: string;
	type: 'mint' | 'burn';
	amount: number;
	account_uuid: string;
	reason: string;
	minted_supply_before: number;
	minted_supply_after: number;
	total_supply_before: number;
	total_supply_after: number;
	performed_by_uuid: string;
	performed_at: string;
}

export interface MonetaryStatus {
	person_years: number;
	member_count: number;
	policy: MonetaryPolicy;
	expected_minted_supply: number;
	minted_supply: number;
	minted_variance: number;
	minted_variance_percent: number;
	in_tolerance: boolean;
	total_supply: number;
	external_supply: number;
	calculated_at: string;
}

// --- Configuration ---

const DEFAULT_POLICY: MonetaryPolicy = {
	franks_per_person_year: 2000,
	tolerance_percent: 5.0
};

export function getMonetaryPolicy(): MonetaryPolicy {
	const franksPerPersonYear = getConfig('monetary:franks_per_person_year');
	const tolerancePercent = getConfig('monetary:tolerance_percent');

	return {
		franks_per_person_year: franksPerPersonYear
			? Number(franksPerPersonYear)
			: DEFAULT_POLICY.franks_per_person_year,
		tolerance_percent: tolerancePercent
			? Number(tolerancePercent)
			: DEFAULT_POLICY.tolerance_percent
	};
}

export function updateMonetaryPolicy(policy: Partial<MonetaryPolicy>): void {
	if (policy.franks_per_person_year !== undefined) {
		setConfig('monetary:franks_per_person_year', policy.franks_per_person_year.toString());
	}
	if (policy.tolerance_percent !== undefined) {
		setConfig('monetary:tolerance_percent', policy.tolerance_percent.toString());
	}
}

// --- Supply Queries ---

/**
 * Get minted supply (franks this society has created)
 */
export function getMintedSupply(): number {
	const result = db
		.prepare('SELECT minted_supply FROM monetary_supply WHERE id = 1')
		.get() as { minted_supply: number } | undefined;

	if (!result) {
		// Initialize if doesn't exist
		db.prepare(
			'INSERT OR IGNORE INTO monetary_supply (id, minted_supply, updated_at) VALUES (1, 0, ?)'
		).run(new Date().toISOString());
		return 0;
	}

	return result.minted_supply;
}

/**
 * Get total supply (all franks in all accounts, including external)
 */
export function getTotalSupply(): number {
	const result = db
		.prepare('SELECT COALESCE(SUM(franks_balance), 0) as total FROM account')
		.get() as { total: number };
	return result.total;
}

/**
 * Get external supply (franks from other societies)
 */
export function getExternalSupply(): number {
	return getTotalSupply() - getMintedSupply();
}

/**
 * Get all supply metrics
 */
export function getMonetarySupply(): MonetarySupply {
	const minted = getMintedSupply();
	const total = getTotalSupply();
	return {
		minted_supply: minted,
		total_supply: total,
		external_supply: total - minted
	};
}

// --- Person-Years ---

/**
 * Fetch person-years from governance API
 */
export async function getPersonYears(): Promise<{ person_years: number; member_count: number }> {
	const governanceUrl = getConfig('oidc:governance_url');
	if (!governanceUrl) {
		throw new Error('Governance URL not configured');
	}

	const response = await fetch(`${governanceUrl}/api/society/person-years`);
	if (!response.ok) {
		throw new Error(`Failed to fetch person-years: ${response.statusText}`);
	}

	const data = await response.json();
	return {
		person_years: data.person_years,
		member_count: data.member_count
	};
}

// --- Mint/Burn Operations ---

/**
 * Mint new franks (create currency) into an account
 */
export function mintFranks(opts: {
	amount: number;
	account_uuid: string;
	reason: string;
	performed_by_uuid: string;
}): MonetaryOperation {
	if (opts.amount <= 0) {
		throw new Error('Mint amount must be positive');
	}

	// Verify account exists
	const account = db
		.prepare('SELECT uuid FROM account WHERE uuid = ?')
		.get(opts.account_uuid) as { uuid: string } | undefined;

	if (!account) {
		throw new Error('Account not found');
	}

	const uuid = randomUUID();
	const now = new Date().toISOString();
	const mintedBefore = getMintedSupply();
	const totalBefore = getTotalSupply();
	const mintedAfter = mintedBefore + opts.amount;
	const totalAfter = totalBefore + opts.amount;

	db.transaction(() => {
		// Credit the account
		db.prepare('UPDATE account SET franks_balance = franks_balance + ? WHERE uuid = ?').run(
			opts.amount,
			opts.account_uuid
		);

		// Update minted supply
		db.prepare(
			'INSERT INTO monetary_supply (id, minted_supply, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET minted_supply = ?, updated_at = ?'
		).run(mintedAfter, now, mintedAfter, now);

		// Log operation
		db.prepare(
			`INSERT INTO monetary_operation 
			(uuid, type, amount, account_uuid, reason, minted_supply_before, minted_supply_after, total_supply_before, total_supply_after, performed_by_uuid, performed_at)
			VALUES (?, 'mint', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			uuid,
			opts.amount,
			opts.account_uuid,
			opts.reason,
			mintedBefore,
			mintedAfter,
			totalBefore,
			totalAfter,
			opts.performed_by_uuid,
			now
		);
	})();

	return getMonetaryOperationByUuid(uuid)!;
}

/**
 * Burn franks (remove currency from circulation) from an account
 */
export function burnFranks(opts: {
	amount: number;
	account_uuid: string;
	reason: string;
	performed_by_uuid: string;
}): MonetaryOperation {
	if (opts.amount <= 0) {
		throw new Error('Burn amount must be positive');
	}

	// Verify account exists and has sufficient balance
	const account = db
		.prepare('SELECT uuid, franks_balance FROM account WHERE uuid = ?')
		.get(opts.account_uuid) as { uuid: string; franks_balance: number } | undefined;

	if (!account) {
		throw new Error('Account not found');
	}

	if (account.franks_balance < opts.amount) {
		throw new Error(
			`Cannot burn ${opts.amount} franks: account only has ${account.franks_balance} franks`
		);
	}

	const uuid = randomUUID();
	const now = new Date().toISOString();
	const mintedBefore = getMintedSupply();
	const totalBefore = getTotalSupply();

	if (opts.amount > mintedBefore) {
		throw new Error(
			`Cannot burn ${opts.amount} franks: only ${mintedBefore} franks have been minted`
		);
	}

	const mintedAfter = mintedBefore - opts.amount;
	const totalAfter = totalBefore - opts.amount;

	db.transaction(() => {
		// Debit the account
		db.prepare('UPDATE account SET franks_balance = franks_balance - ? WHERE uuid = ?').run(
			opts.amount,
			opts.account_uuid
		);

		// Update minted supply
		db.prepare(
			'INSERT INTO monetary_supply (id, minted_supply, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET minted_supply = ?, updated_at = ?'
		).run(mintedAfter, now, mintedAfter, now);

		// Log operation
		db.prepare(
			`INSERT INTO monetary_operation 
			(uuid, type, amount, account_uuid, reason, minted_supply_before, minted_supply_after, total_supply_before, total_supply_after, performed_by_uuid, performed_at)
			VALUES (?, 'burn', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			uuid,
			opts.amount,
			opts.account_uuid,
			opts.reason,
			mintedBefore,
			mintedAfter,
			totalBefore,
			totalAfter,
			opts.performed_by_uuid,
			now
		);
	})();

	return getMonetaryOperationByUuid(uuid)!;
}

// --- Status ---

/**
 * Get comprehensive monetary status including variance from policy target
 */
export async function getMonetaryStatus(): Promise<MonetaryStatus> {
	const policy = getMonetaryPolicy();
	const supply = getMonetarySupply();
	const { person_years, member_count } = await getPersonYears();

	const expectedMintedSupply = Math.floor(person_years * policy.franks_per_person_year);
	const mintedVariance = supply.minted_supply - expectedMintedSupply;
	const mintedVariancePercent =
		expectedMintedSupply > 0 ? (mintedVariance / expectedMintedSupply) * 100 : 0;
	const inTolerance = Math.abs(mintedVariancePercent) <= policy.tolerance_percent;

	return {
		person_years,
		member_count,
		policy,
		expected_minted_supply: expectedMintedSupply,
		minted_supply: supply.minted_supply,
		minted_variance: mintedVariance,
		minted_variance_percent: mintedVariancePercent,
		in_tolerance: inTolerance,
		total_supply: supply.total_supply,
		external_supply: supply.external_supply,
		calculated_at: new Date().toISOString()
	};
}

// --- History ---

export function getMonetaryOperationByUuid(uuid: string): MonetaryOperation | null {
	return (
		(db
			.prepare('SELECT * FROM monetary_operation WHERE uuid = ?')
			.get(uuid) as MonetaryOperation | undefined) ?? null
	);
}

export function getMonetaryOperations(opts?: {
	limit?: number;
	offset?: number;
}): MonetaryOperation[] {
	const limit = opts?.limit ?? 50;
	const offset = opts?.offset ?? 0;

	return db
		.prepare(
			'SELECT * FROM monetary_operation ORDER BY performed_at DESC LIMIT ? OFFSET ?'
		)
		.all(limit, offset) as MonetaryOperation[];
}
