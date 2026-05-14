import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { createContract, addMilestone } from '$lib/server/contracts.js';
import { hasPermission, PERMISSIONS } from '$lib/server/permissions.js';
import { db } from '$lib/server/db.js';
import { audit } from '$lib/server/audit.js';
import { addEntry } from '$lib/server/record.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session) error(401, 'Not authenticated');

	const actingAs = locals.session.acting_as_uuid;

	// Check permission
	const canCreate = hasPermission(actingAs, PERMISSIONS.CONTRACTS_CREATE);
	if (!canCreate) error(403, 'Insufficient permissions');

	// Get all potential parties (members and associations)
	const people = db
		.prepare('SELECT uuid, given_name, family_name, handle FROM person ORDER BY given_name, family_name')
		.all() as Array<{ uuid: string; given_name: string; family_name: string; handle: string }>;

	const associations = db
		.prepare('SELECT uuid, name, handle FROM association ORDER BY name')
		.all() as Array<{ uuid: string; name: string; handle: string }>;

	return {
		people,
		associations,
		actingAs,
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		if (!hasPermission(actingAs, PERMISSIONS.CONTRACTS_CREATE)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const data = await request.formData();
		const title = data.get('title') as string;
		const body = data.get('body') as string;
		const effective_date = (data.get('effective_date') as string) || undefined;
		const expiry_date = (data.get('expiry_date') as string) || undefined;

		const party_a_uuid = data.get('party_a_uuid') as string;
		const party_a_role = data.get('party_a_role') as string;
		const party_b_uuid = data.get('party_b_uuid') as string;
		const party_b_role = data.get('party_b_role') as string;

		if (!title || !body || !party_a_uuid || !party_a_role || !party_b_uuid || !party_b_role) {
			return fail(400, { error: 'Missing required fields' });
		}

		if (party_a_uuid === party_b_uuid) {
			return fail(400, { error: 'Parties must be different' });
		}

		// Get party details
		const getPartyDetails = (uuid: string) => {
			// Try person first
			let result = db
				.prepare('SELECT given_name || " " || family_name as name, handle FROM person WHERE uuid = ?')
				.get(uuid) as { name: string; handle: string } | undefined;
			
			if (result) return { ...result, society_handle: 'BFS' };

			// Try association
			result = db
				.prepare('SELECT name, handle FROM association WHERE uuid = ?')
				.get(uuid) as { name: string; handle: string } | undefined;
			
			if (result) return { ...result, society_handle: 'BFS' };

			return null;
		};

		const partyADetails = getPartyDetails(party_a_uuid);
		const partyBDetails = getPartyDetails(party_b_uuid);

		if (!partyADetails || !partyBDetails) {
			return fail(400, { error: 'Invalid party selection' });
		}

		try {
			const contractUuid = createContract({
				title,
				body,
				jurisdiction: 'intra',
				jurisdiction_society_handle: 'BFS',
				party_a: {
					principal_uuid: party_a_uuid,
					principal_handle: partyADetails.handle,
					principal_society_handle: partyADetails.society_handle,
					role: party_a_role,
				},
				party_b: {
					principal_uuid: party_b_uuid,
					principal_handle: partyBDetails.handle,
					principal_society_handle: partyBDetails.society_handle,
					role: party_b_role,
				},
				effective_date,
				expiry_date,
			});

			// Add milestones if provided
			const milestones = data.getAll('milestone_title') as string[];
			const milestoneDescriptions = data.getAll('milestone_description') as string[];
			const milestoneDueDates = data.getAll('milestone_due_date') as string[];

			for (let i = 0; i < milestones.length; i++) {
				if (milestones[i].trim()) {
					addMilestone({
						contract_uuid: contractUuid,
						title: milestones[i],
						description: milestoneDescriptions[i] || undefined,
						due_date: milestoneDueDates[i] || undefined,
					});
				}
			}

			// Audit log
			audit(actingAs, 'contract.create', 'contract', contractUuid, `Created contract: ${title}`);

			redirect(303, `/contracts/${contractUuid}`);
		} catch (err) {
			return fail(500, { error: err instanceof Error ? err.message : 'Failed to create contract' });
		}
	},
};
