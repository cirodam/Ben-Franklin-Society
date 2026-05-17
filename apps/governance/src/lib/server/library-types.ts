// ============================================================================
// Library System Type Definitions
// ============================================================================

/**
 * Base structure for all library documents.
 * Every document in the library conforms to this wrapper structure.
 */
export interface LibraryDocument<TContent = unknown> {
	// Identity
	uuid: string;
	type: string; // 'governing', 'motion', 'budget', 'report', etc.
	slug: string; // URL-safe unique identifier

	// Basic metadata
	title: string;
	owner_uuid: string; // person or association UUID

	// Timestamps
	created_at: string; // ISO 8601
	updated_at: string; // ISO 8601

	// Type-specific content (including status)
	content: TContent;
}

// ============================================================================
// Governing Documents
// ============================================================================

export type GoverningStatus = 'draft' | 'adopted' | 'repealed';

export interface Article {
	number: string; // "I", "II", "III", etc.
	title: string;
	sections: Section[];
}

export interface Section {
	title: string;
	body: string;
	rationale?: string;
}

export interface GoverningDocContent {
	status: GoverningStatus;
	seniority: number; // 1=charter, 2=constitution, 3=bylaw, 4=ordinance, 5=regulation, 6=policy

	articles: Article[];

	adopted_at?: string;
	adopted_by_motion_uuid?: string;
	repealed_at?: string;
	repealed_by_motion_uuid?: string;
}

export type GoverningDocument = LibraryDocument<GoverningDocContent>;

// ============================================================================
// Motions (future - Phase 2)
// ============================================================================

export type MotionStatus =
	| 'draft'
	| 'introduced'
	| 'deliberation'
	| 'enacted'
	| 'rejected'
	| 'withdrawn';

export interface MotionContent {
	status: MotionStatus;

	// Core content
	body: string;
	introducer_uuid: string;
	reasoning?: string;
	body_uuid?: string; // Association/body this motion belongs to

	// Lifecycle timestamps
	introduced_at?: string;
	deliberation_ends_at?: string;
	vote_opened_at?: string;
	vote_closed_at?: string;
	enacted_at?: string;

	// Adoption/repeal (for compatibility with governing doc patterns)
	adopted_at?: string;
	adopted_by_motion_uuid?: string;
	repealed_at?: string;
	repealed_by_motion_uuid?: string;

	// Rules
	vote_rule_uuid?: string;
	deliberation_rule_uuid?: string;

	// Motion metadata
	motion_number?: string; // "M-2026-001"

	// Notes (might move to separate documents later)
	clerk_notes?: string;
	parliamentarian_notes?: string;
}

export type MotionDocument = LibraryDocument<MotionContent>;

// ============================================================================
// Budgets (future - Phase 3)
// ============================================================================

export type BudgetStatus = 'draft' | 'proposed' | 'approved' | 'active' | 'closed';

export interface LineItem {
	category: string;
	description: string;
	amount: number;
	type: 'revenue' | 'expense';
}

export interface BudgetContent {
	status: BudgetStatus;

	fiscal_year: number;
	period: 'annual' | 'quarterly' | 'monthly';

	line_items: LineItem[];
	total_revenue: number;
	total_expenses: number;

	approved_at?: string;
	approved_by_motion_uuid?: string;
}

export type BudgetDocument = LibraryDocument<BudgetContent>;

// ============================================================================
// Reports (future - Phase 3)
// ============================================================================

export type ReportStatus = 'draft' | 'published';

export interface ReportSection {
	title: string;
	body: string;
	data?: unknown; // Flexible data structure
}

export interface ReportContent {
	status: ReportStatus;

	summary: string;
	report_date: string;

	sections: ReportSection[];

	published_at?: string;
}

export type ReportDocument = LibraryDocument<ReportContent>;

// ============================================================================
// Database Index Row
// ============================================================================

/**
 * Represents a row in the library_item table.
 * This is a cached index of the JSON document for fast querying.
 */
export interface LibraryItemRow {
	uuid: string;
	type: string;
	slug: string;
	title: string;
	owner_uuid: string;
	created_at: string;
	updated_at: string;
	file_path: string; // relative path: 'governing/charter.json'
	metadata_json: string; // JSON string with searchable fields
}
