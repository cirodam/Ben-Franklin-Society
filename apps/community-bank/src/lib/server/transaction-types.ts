/**
 * Transaction types and sources — centralized definitions for all money movements.
 */

// ---------------------------------------------------------------------------
// Transaction Types
// ---------------------------------------------------------------------------

export const TransactionType = {
	/** Standard person-to-person or entity transfer */
	TRANSFER: 'transfer',

	/** Demurrage collection from account to treasury */
	DEMURRAGE: 'demurrage',

	/** Manual correction by admin */
	CORRECTION: 'correction',

	/** Manual adjustment by admin */
	ADJUSTMENT: 'adjustment',
} as const;

export type TransactionTypeValue = (typeof TransactionType)[keyof typeof TransactionType];

// ---------------------------------------------------------------------------
// Transaction Sources
// ---------------------------------------------------------------------------

export const TransactionSource = {
	/** User-initiated online transfer */
	ONLINE: 'online',

	/** Teller-initiated transfer (in-branch) */
	TELLER: 'teller',

	/** Automated system process (demurrage collection) */
	SYSTEM: 'system',

	/** Admin-initiated transaction (corrections, adjustments) */
	ADMIN: 'admin',
} as const;

export type TransactionSourceValue = (typeof TransactionSource)[keyof typeof TransactionSource];

// ---------------------------------------------------------------------------
// Helper: Get human-readable label for transaction type
// ---------------------------------------------------------------------------

export function getTransactionTypeLabel(type: string): string {
	switch (type) {
		case TransactionType.TRANSFER:
			return 'Transfer';
		case TransactionType.DEMURRAGE:
			return 'Demurrage';
		case TransactionType.CORRECTION:
			return 'Correction';
		case TransactionType.ADJUSTMENT:
			return 'Adjustment';
		default:
			return type;
	}
}

export function getTransactionSourceLabel(source: string): string {
	switch (source) {
		case TransactionSource.ONLINE:
			return 'Online';
		case TransactionSource.TELLER:
			return 'Teller';
		case TransactionSource.SYSTEM:
			return 'System';
		case TransactionSource.ADMIN:
			return 'Admin';
		default:
			return source;
	}
}
