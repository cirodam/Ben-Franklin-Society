// ============================================================================
// Society Document Type Definitions
// ============================================================================
// Shared document types for motions, governing documents, and other structured
// documents used across the BFS platform (library app, governance app, etc.)

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

	// Integration tracking (optional)
	source_library_file_id?: number; // If imported from library app, track original file

	// Type-specific content (including status)
	content: TContent;
}

// ============================================================================
// Governing Documents
// ============================================================================

export type GoverningStatus = 'draft' | 'enacted' | 'repealed' | 'sunsetted';

export type SeniorityLevel = 'charter' | 'constitution' | 'bylaw' | 'ordinance' | 'regulation' | 'policy';

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
	seniority: SeniorityLevel;
	articles: Article[];
	preamble?: string;

	// When status is 'enacted', 'repealed', or 'sunsetted'
	enacted_at?: string;
	enacted_by_motion_uuid?: string;
	enacted_by_motion_title?: string;

	// Optional sunset (automatic expiration)
	sunset_at?: string;

	// When status is 'repealed' (actively repealed by motion)
	repealed_at?: string;
	repealed_by_motion_uuid?: string;
	repealed_by_motion_title?: string;
}

export type GoverningDocument = LibraryDocument<GoverningDocContent>;

// ============================================================================
// Motions
// ============================================================================

export type MotionStatus =
	| 'draft'
	| 'introduced'
	| 'deliberation'
	| 'voting'
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

	// Core content
	provisions: Provision[];
	introducer_uuid: string;
	body_uuid?: string; // Association/body this motion belongs to
	body_name?: string; // Human-readable name of the body (denormalized)

	// Document references (informational - for linking motions to governing docs)
	referenced_documents?: string[]; // Slugs of documents this motion references

	// Discussion and voting
	discussion_thread_uuid?: string;
	vote_session_uuid?: string;

	// Rules
	vote_rule_uuid?: string;
	vote_rule_name?: string;
	deliberation_rule_uuid?: string;
	deliberation_rule_name?: string;

	// Notes
	clerk_notes?: string;
	parliamentarian_notes?: string;

	// Signatures
	signatures?: MotionSignature[];
}

export type MotionDocument = LibraryDocument<MotionContent>;

// ============================================================================
// Budgets
// ============================================================================

export type BudgetStatus = 'draft' | 'proposed' | 'approved' | 'active' | 'closed';

export interface LineItem {
	category: string;
	description: string;
	amount: number;
	type: 'revenue' | 'expense';
}

export interface BudgetContent {
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
// Reports
// ============================================================================

export type ReportStatus = 'draft' | 'published';

export interface ReportSection {
	title: string;
	body: string;
	data?: unknown; // Flexible data structure
}

export interface ReportContent {
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
// Injury Reports
// ============================================================================

export type InjuryReportStatus =
	| 'filed' // Initial filing
	| 'under_review' // Mediation Service reviewing/assessing
	| 'mediation' // Active mediation process
	| 'resolved' // Successfully resolved
	| 'closed'; // Closed without resolution

export type InjuryType = 'physical' | 'material' | 'relational' | 'systemic' | 'communal';

export type Gravity = 'minor' | 'moderate' | 'severe';

export type SafetyRisk = 'low' | 'moderate' | 'high';

export interface InjuryParty {
	party_uuid: string; // person, association, or society UUID
	party_name: string; // cached for display
	party_type: 'person' | 'association' | 'society';
}

export interface IncidentAccount {
	uuid: string;
	author_uuid: string;
	author_name: string; // cached for display
	author_role: 'complainant' | 'respondent' | 'witness';
	account: string; // narrative text
	provided_at: string; // ISO 8601
}

export interface InjuryReportContent {
	status: InjuryReportStatus;

	// Core incident details
	injury_types: InjuryType[];
	incident_start: string; // ISO 8601
	incident_end: string | null;
	location: string | null;

	// Parties involved
	complainants: InjuryParty[];
	respondents: InjuryParty[];

	// Narratives from different perspectives
	accounts: IncidentAccount[];

	// Mediation Service assessments (overseen by College of Conciliation)
	gravity: Gravity | null;
	safety_risk: SafetyRisk | null;
	assessed_at: string | null;
	assessed_by_uuid: string | null; // Mediator who performed assessment
	assessment_notes: string | null;

	// Resolution tracking
	mediation_notes: string | null;
	resolution_summary: string | null;
	resolved_at: string | null;
	closed_at: string | null;
	closing_notes: string | null;

	// Metadata
	filed_by_uuid: string; // person who filed the report
	filed_at: string; // ISO 8601
}

export type InjuryReportDocument = LibraryDocument<InjuryReportContent>;

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
