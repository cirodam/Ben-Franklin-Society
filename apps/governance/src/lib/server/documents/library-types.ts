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
	document_id: string | null; // User-assignable identifier (optional)
	version: number; // Version number (integer)

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
	| 'adopted'
	| 'enacted'
	| 'rejected'
	| 'withdrawn';

export interface Provision {
	number: string; // "1", "1.a", "Section A", etc.
	title?: string; // Optional section heading
	text: string; // The provision content
	reasoning?: string; // Rationale for this provision
}

export interface MotionSignature {
	signer_uuid: string;
	signature_text: string;
	font?: string;
	signed_at: string;
}

export interface MotionContent {
	status: MotionStatus;

	// Core content
	provisions: Provision[];
	introducer_uuid: string;
	body_uuid?: string; // Association/body this motion belongs to

	// Discussion and voting
	discussion_thread_uuid?: string;
	vote_session_uuid?: string;

	// Rules
	vote_rule_uuid?: string;
	deliberation_rule_uuid?: string;

	// Notes
	clerk_notes?: string;
	parliamentarian_notes?: string;

	// Signatures
	signatures?: MotionSignature[];
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
// Prose Documents
// ============================================================================

export type ProseStatus = 'draft' | 'published' | 'archived';

export interface ProseDocContent {
	status: ProseStatus;
	
	// Document body as paragraphs
	paragraphs: string[];
	
	// Optional metadata
	summary?: string;
	tags?: string[];
	
	published_at?: string;
	archived_at?: string;
}

export type ProseDocument = LibraryDocument<ProseDocContent>;

// ============================================================================
// Contracts
// ============================================================================

export type ContractStatus = 'draft' | 'active' | 'completed' | 'terminated';

export interface ContractParty {
	principal_uuid: string; // person or association UUID
	principal_name: string; // cached for display
	role: string; // "buyer", "seller", "guarantor", etc.
}

export interface ContractContent {
	status: ContractStatus;
	
	// The agreement text
	body: string;
	
	// Two parties
	party_a: ContractParty;
	party_b: ContractParty;
	
	// Dates
	effective_date?: string;
	expiry_date?: string;
	acknowledged_at?: string; // when both parties signed off
	completed_at?: string;
	terminated_at?: string;
}

export type ContractDocument = LibraryDocument<ContractContent>;

// ============================================================================
// Organizational Charts
// ============================================================================

export type OrgChartStatus = 'draft' | 'published';

export interface OrgChartSection {
	id: string; // Internal reference ID (not UUID)
	name: string;
	description?: string;
	parent_section_id?: string;
}

export interface OrgChartTemplate {
	id: string; // Internal reference ID (not UUID)
	template_key: string; // e.g., "executive_director", "treasurer"
	title: string;
	description?: string;
	compensation_franks: number;
	permissions: Array<{
		app: string;
		permission: string;
	}>;
}

export interface OrgChartRole {
	id: string; // Internal reference ID (not UUID)
	title: string;
	description?: string;
	section_id?: string;
	template_id?: string;
	reports_to_role_id?: string;
	compensation_franks: number;
}

export interface OrgChartContent {
	status: OrgChartStatus;
	version: string; // Format version, currently "1.0"
	
	// Optional metadata
	description?: string;
	notes?: string;
	
	// Organizational structure
	sections: OrgChartSection[];
	templates: OrgChartTemplate[];
	roles: OrgChartRole[];
	
	published_at?: string;
}

export type OrgChartDocument = LibraryDocument<OrgChartContent>;

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
	document_id: string | null; // User-assignable identifier (optional)
	version: number; // Version number
	title: string;
	owner_uuid: string;
	created_at: string;
	updated_at: string;
	file_path: string; // relative path: 'governing/charter.json'
}
