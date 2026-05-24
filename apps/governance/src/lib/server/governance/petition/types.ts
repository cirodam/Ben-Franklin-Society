/**
 * Type definitions for the petition system
 */

export interface Petition {
	uuid: string;
	title: string;
	body: string;
	created_by_uuid: string;
	created_at: string;
	status: 'open' | 'responded' | 'withdrawn';
	responded_at: string | null;
	responded_by_uuid: string | null;
	response_body: string | null;
	related_motion_uuid: string | null;
}

export interface PetitionSignature {
	petition_uuid: string;
	person_uuid: string;
	signed_at: string;
	unsigned_at: string | null;
}

export interface PetitionWithSignatures extends Petition {
	signature_count: number;
	current_signatures: Array<{
		person_uuid: string;
		person_handle: string;
		signed_at: string;
	}>;
	is_signed_by?: string | null; // person_uuid if provided
}
