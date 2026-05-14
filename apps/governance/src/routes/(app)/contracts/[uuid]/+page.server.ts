import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getContractByUuid,
	getContractParties,
	getContractMilestones,
	getContractEvents,
	acknowledgeContract,
	attestMilestone,
	skipMilestone,
	declareDispute,
	terminateContract,
} from '$lib/server/contracts.js';
import { db } from '$lib/server/db.js';
import { audit } from '$lib/server/audit.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const contract = getContractByUuid(params.uuid);
	if (!contract) error(404, 'Contract not found');

	const parties = getContractParties(contract.uuid);
	const milestones = getContractMilestones(contract.uuid);
	const events = getContractEvents(contract.uuid);

	// Enrich party info
	const enrichedParties = parties.map((party) => {
		// Try to get person or association name
		let principal = db
			.prepare('SELECT given_name || " " || family_name as name, handle FROM person WHERE uuid = ?')
			.get(party.principal_uuid) as { name: string; handle: string } | undefined;

		if (!principal) {
			principal = db
				.prepare('SELECT name, handle FROM association WHERE uuid = ?')
				.get(party.principal_uuid) as { name: string; handle: string } | undefined;
		}

		return {
			...party,
			principal_name: principal?.name ?? 'Unknown',
			principal_handle_display: principal?.handle ?? party.principal_handle,
		};
	});

	const actingAs = locals.session?.acting_as_uuid ?? null;

	// Check if acting user is a party to this contract
	const isParty = actingAs ? parties.some((p) => p.principal_uuid === actingAs) : false;
	const myParty = actingAs ? parties.find((p) => p.principal_uuid === actingAs) : null;
	const hasAcknowledged = myParty?.signed_at !== null;

	return {
		contract,
		parties: enrichedParties,
		milestones,
		events,
		actingAs,
		isParty,
		myParty,
		hasAcknowledged,
	};
};

export const actions: Actions = {
	acknowledge: async ({ params, locals }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		try {
			acknowledgeContract(params.uuid, actingAs);
			audit(actingAs, 'contract.acknowledge', 'contract', params.uuid, 'Acknowledged contract');
			return { success: true };
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to acknowledge contract' });
		}
	},

	attestMilestone: async ({ request, locals, params }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const milestoneUuid = data.get('milestone_uuid') as string;

		if (!milestoneUuid) {
			return fail(400, { error: 'Missing milestone UUID' });
		}

		// Find party UUID for acting user
		const parties = getContractParties(params.uuid);
		const myParty = parties.find((p) => p.principal_uuid === actingAs);

		if (!myParty) {
			return fail(403, { error: 'Not a party to this contract' });
		}

		try {
			attestMilestone(milestoneUuid, myParty.uuid);
			audit(actingAs, 'contract.milestone_attested', 'contract', params.uuid, 'Attested milestone completion');
			return { success: true };
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to attest milestone' });
		}
	},

	skipMilestone: async ({ request, locals, params }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const milestoneUuid = data.get('milestone_uuid') as string;

		if (!milestoneUuid) {
			return fail(400, { error: 'Missing milestone UUID' });
		}

		const parties = getContractParties(params.uuid);
		const myParty = parties.find((p) => p.principal_uuid === actingAs);

		if (!myParty) {
			return fail(403, { error: 'Not a party to this contract' });
		}

		try {
			skipMilestone(milestoneUuid, myParty.uuid);
			audit(actingAs, 'contract.milestone_skipped', 'contract', params.uuid, 'Skipped milestone');
			return { success: true };
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to skip milestone' });
		}
	},

	declareDispute: async ({ request, locals, params }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const reason = data.get('reason') as string;

		if (!reason || reason.trim() === '') {
			return fail(400, { error: 'Dispute reason is required' });
		}

		const parties = getContractParties(params.uuid);
		const myParty = parties.find((p) => p.principal_uuid === actingAs);

		if (!myParty) {
			return fail(403, { error: 'Not a party to this contract' });
		}

		try {
			declareDispute(params.uuid, myParty.uuid, reason);
			audit(actingAs, 'contract.dispute_declared', 'contract', params.uuid, `Dispute declared: ${reason}`);
			return { success: true };
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to declare dispute' });
		}
	},

	terminate: async ({ request, locals, params }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const reason = data.get('reason') as string;

		if (!reason || reason.trim() === '') {
			return fail(400, { error: 'Termination reason is required' });
		}

		const parties = getContractParties(params.uuid);
		const isParty = parties.some((p) => p.principal_uuid === actingAs);

		if (!isParty) {
			return fail(403, { error: 'Not a party to this contract' });
		}

		try {
			terminateContract(params.uuid, reason);
			audit(actingAs, 'contract.terminated', 'contract', params.uuid, `Contract terminated: ${reason}`);
			return { success: true };
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to terminate contract' });
		}
	},
};
