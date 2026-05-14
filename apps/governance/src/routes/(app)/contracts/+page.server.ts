import type { PageServerLoad } from './$types.js';
import { listContracts, getContractParties } from '$lib/server/contracts.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ locals }) => {
	const actingAs = locals.session?.acting_as_uuid ?? null;

	// Get all contracts, optionally filtered by principal if they want to see only theirs
	const contracts = listContracts();

	// Enrich with party information
	const enrichedContracts = contracts.map((contract) => {
		const parties = getContractParties(contract.uuid);
		
		// Get principal names
		const partyDetails = parties.map((party) => {
			const principal = db
				.prepare('SELECT name, handle FROM association WHERE uuid = ? UNION SELECT given_name || " " || family_name as name, handle FROM person WHERE uuid = ?')
				.get(party.principal_uuid, party.principal_uuid) as { name: string; handle: string } | undefined;

			return {
				...party,
				principal_name: principal?.name ?? 'Unknown',
				principal_handle: principal?.handle ?? party.principal_handle,
			};
		});

		return {
			...contract,
			parties: partyDetails,
		};
	});

	return {
		contracts: enrichedContracts,
		actingAs,
	};
};
