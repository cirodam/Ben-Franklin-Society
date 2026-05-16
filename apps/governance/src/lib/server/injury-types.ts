/**
 * TypeScript types for the Injury System
 * Used by the College of Conciliation to track and respond to harm
 */

export type InjuryType = 'physical' | 'material' | 'relational' | 'systemic' | 'communal';

export type PartyRole = 'complainant' | 'respondent';

export type AuthorRole = 'complainant' | 'respondent' | 'witness';

export type Gravity = 'minor' | 'moderate' | 'severe';

export type SafetyRisk = 'low' | 'moderate' | 'high';

/**
 * The core record of an incident where harm was alleged
 */
export interface InjuryRecord {
	uuid: string;
	injury_number: number;
	/** CSV list of injury types */
	injury_types: string;
	/** ISO 8601 datetime */
	incident_start: string;
	/** ISO 8601 datetime or NULL if ongoing */
	incident_end: string | null;
	/** Free-form text describing where the incident occurred */
	location: string | null;
	/** ISO 8601 datetime */
	filed_at: string;
	/** Assessment of harm severity */
	gravity: Gravity | null;
	/** Assessment of future risk */
	safety_risk: SafetyRisk | null;
	/** ISO 8601 datetime */
	created_at: string;
}

/**
 * Links parties to an injury record
 */
export interface InjuryParty {
	injury_uuid: string;
	/** UUID of person, association, or society */
	party_uuid: string;
	role: PartyRole;
}

/**
 * Narratives of what happened from different perspectives
 */
export interface IncidentAccount {
	uuid: string;
	injury_uuid: string;
	/** UUID of person providing account */
	author_uuid: string;
	author_role: AuthorRole;
	account: string;
	/** ISO 8601 datetime */
	provided_at: string;
	/** ISO 8601 datetime */
	created_at: string;
}

/**
 * Request body for creating a new injury record
 */
export interface CreateInjuryRequest {
	injury_types: InjuryType[];
	incident_start: string;
	incident_end?: string | null;
	location?: string | null;
	complainants: string[]; // UUIDs
	respondents: string[]; // UUIDs
	complainant_account?: string; // Initial account from complainant
}

/**
 * Request body for updating assessments
 */
export interface UpdateInjuryAssessmentRequest {
	gravity?: Gravity;
	safety_risk?: SafetyRisk;
}

/**
 * Request body for adding an incident account
 */
export interface CreateIncidentAccountRequest {
	injury_uuid: string;
	author_uuid: string;
	author_role: AuthorRole;
	account: string;
}

/**
 * Full injury record with related data
 */
export interface InjuryRecordWithDetails extends InjuryRecord {
	complainants: Array<{ uuid: string; handle?: string; name?: string }>;
	respondents: Array<{ uuid: string; handle?: string; name?: string }>;
	accounts: IncidentAccount[];
}
