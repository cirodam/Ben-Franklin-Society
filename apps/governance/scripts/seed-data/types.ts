// Shared types for seed data configurations

export interface BaseAssociationConfig {
	handle: string;
	name: string;
	type: string;
	abbreviation: string;
	description: string;
	governing_document_slug?: string;
}

export interface CoreAssociationConfig extends BaseAssociationConfig {
	type: 'society' | 'general_assembly' | 'association' | 'social_insurance_fund';
}

export interface ServiceConfig extends BaseAssociationConfig {
	type: 'service';
	governs_app?: string | null;
}

export interface CollegeConfig extends BaseAssociationConfig {
	type: 'college';
	governing_document_slug?: string;
}

export interface SortitionConfig {
	seat_count: number;
	term_days: number;
	source_college?: string; // handle reference to college
}

export interface CommitteeConfig extends BaseAssociationConfig {
	type: 'committee';
	governing_document_slug?: string;
	sortition?: SortitionConfig;
}
