/**
 * Transaction types and sources — centralized definitions for all money movements.
 */

// ---------------------------------------------------------------------------
// Transaction Types
// ---------------------------------------------------------------------------

export const TransactionType = {
	/** Standard person-to-person or entity transfer */
	TRANSFER: 'transfer',

	/** New money creation (CB → Treasury on member birthdays) */
	ISSUANCE: 'issuance',

	/** Wealth tax on excess balances → Treasury */
	DEMURRAGE: 'demurrage',

	/** Percentage-based collection from multiple accounts (Treasury dues, CB money destruction) */
	COLLECTION: 'collection',

	/** Money destruction (account → CB, removing from circulation) */
	DESTRUCTION: 'destruction',

	/** Manual correction or adjustment by admin */
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

	/** Scheduled transfer executed automatically */
	SCHEDULED: 'scheduled',

	/** Birthday issuance */
	BIRTHDAY: 'birthday',

	/** Automated system process (demurrage, collection) */
	AUTO: 'auto',

	/** Admin-initiated transaction (CB operations, corrections) */
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
		case TransactionType.ISSUANCE:
			return 'Issuance';
		case TransactionType.DEMURRAGE:
			return 'Demurrage';
		case TransactionType.COLLECTION:
			return 'Collection';
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
		case TransactionSource.SCHEDULED:
			return 'Scheduled';
		case TransactionSource.BIRTHDAY:
			return 'Birthday';
		case TransactionSource.AUTO:
			return 'Automated';
		default:
			return source;
	}
}
