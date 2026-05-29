import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

interface PersonDetails {
	uuid: string;
	handle: string;
	given_name: string;
	family_name: string;
	name: string;
	type: 'person';
	status: string;
	date_of_birth: string;
	street_address: string | null;
	latitude: number | null;
	longitude: number | null;
	created_at: string;
	updated_at: string;
}

interface AssociationDetails {
	uuid: string;
	handle: string;
	name: string;
	type: 'association';
	status: string;
	created_at: string;
	updated_at: string;
}

type PrincipalDetails = PersonDetails | AssociationDetails;

/**
 * Get detailed principal info by UUID.
 * 
 * GET /api/principals/:uuid
 * 
 * Returns: Full principal details
 * Example: { uuid, handle, name, type, status, ... }
 */
export const GET: RequestHandler = async ({ params }) => {
	const { uuid } = params;

	// Try to find person
	const person = db
		.prepare(
			`SELECT 
				uuid,
				handle,
				given_name,
				family_name,
				given_name || ' ' || family_name as name,
				status,
				date_of_birth,
				street_address,
				latitude,
				longitude,
				created_at,
				updated_at
			FROM person
			WHERE uuid = ?`
		)
		.get(uuid) as Omit<PersonDetails, 'type'> | undefined;

	if (person) {
		return json({ ...person, type: 'person' } as PersonDetails);
	}

	// Try to find association
	const association = db
		.prepare(
			`SELECT 
				uuid,
				handle,
				name,
				status,
				created_at,
				updated_at
			FROM association
			WHERE uuid = ?`
		)
		.get(uuid) as Omit<AssociationDetails, 'type'> | undefined;

	if (association) {
		return json({ ...association, type: 'association' } as AssociationDetails);
	}

	// Not found
	error(404, `Principal ${uuid} not found`);
};
