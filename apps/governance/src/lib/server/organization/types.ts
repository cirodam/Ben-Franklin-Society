// ============================================================================
// Organization Module Types
// ============================================================================
// Shared type definitions for associations, roles, membership, and org charts

export interface Association {
	uuid: string;
	handle: string;
	name: string;
	abbreviation: string | null;
	type: 'society' | 'association' | 'service' | 'college' | 'committee' | 'general_assembly' | 'social_insurance_fund' | 'community_bank';
	status: 'active' | 'dissolved';
	governing_document_slug: string | null;
	org_chart_slug: string | null;
	established_by_motion_uuid: string | null;
	governs_app: string | null;
	created_at: string;
	dissolved_at: string | null;
}

export interface AssociationMember {
	association_uuid: string;
	person_uuid: string;
	joined_at: string;
	removed_at: string | null;
}

export interface Role {
	uuid: string;
	association_uuid: string;
	section_uuid: string | null;
	template_uuid: string | null;
	title: string;
	description: string | null;
	compensation_franks: number;
	reports_to_role_uuid: string | null;
	created_at: string;
}

export interface OrgSection {
	uuid: string;
	association_uuid: string;
	parent_section_uuid: string | null;
	name: string;
	description: string | null;
	created_at: string;
}

export interface RoleTemplate {
	uuid: string;
	association_uuid: string;
	template_key: string;
	title: string;
	description: string | null;
	compensation_franks: number;
	created_at: string;
}

export interface RoleTemplatePermission {
	template_uuid: string;
	app: string;
	permission: string;
}

export interface RolePermission {
	role_uuid: string;
	app: string;
	permission: string;
	association_uuid?: string; // Optional for backwards compatibility
}

export interface RoleAssignment {
	uuid: string;
	role_uuid: string;
	person_uuid: string;
	assigned_at: string;
	removed_at: string | null;
}

export interface SortitionBodyConfig {
	association_uuid: string;
	seat_count: number;
	term_days: number;
	is_permanent: 0 | 1;
	source_college_uuid: string | null;
}
