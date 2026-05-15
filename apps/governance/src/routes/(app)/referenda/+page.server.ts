import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getAssociationByHandle,
	getCurrentMembers,
} from '$lib/server/associations.js';
import { listMotions, createMotion, getVoteTally, getComments } from '$lib/server/motions.js';
import { listDeliberationRules } from '$lib/server/deliberation_rules.js';
import { hasPermission, PERMISSIONS } from '$lib/server/permissions.js';

export const load: PageServerLoad = async ({ locals }) => {
	const association = getAssociationByHandle('society');
	if (!association) error(404, 'Society not found');

	const members = getCurrentMembers(association.uuid);
	const actingAs = locals.session?.acting_as_uuid ?? null;

	// Get all motions for this body
	const allMotions = listMotions({ bodyUuid: association.uuid });

	// Group motions by status for deliberation-centric display
	const activeDeliberations = allMotions
		.filter((m) => m.status === 'deliberation')
		.map((m) => {
			const voteTally = getVoteTally(m.uuid);
			const tally = voteTally ? {
				eligible: voteTally.eligible_count,
				voted: voteTally.aye_count + voteTally.nay_count + voteTally.abstain_count,
				aye: voteTally.aye_count,
				nay: voteTally.nay_count,
				abstain: voteTally.abstain_count
			} : null;
			const comments = getComments(m.uuid);
			return { ...m, tally, comments };
		});

	const pending = allMotions
		.filter((m) => m.status === 'introduced' || m.status === 'draft')
		.map((m) => {
			const comments = getComments(m.uuid);
			return { ...m, comments };
		});

	const recentDecisions = allMotions
		.filter((m) => m.status === 'enacted' || m.status === 'rejected')
		.sort((a, b) => {
			const aDate = a.resolved_at || a.enacted_at || a.created_at;
			const bDate = b.resolved_at || b.enacted_at || b.created_at;
			return bDate.localeCompare(aDate);
		})
		.slice(0, 10)
		.map((m) => {
			const comments = getComments(m.uuid);
			return { ...m, comments };
		});

	const canCreateMotion = actingAs
		? hasPermission(actingAs, PERMISSIONS.MOTIONS_CREATE, association.uuid)
		: false;

	const deliberationRules = listDeliberationRules(association.uuid);

	return {
		association,
		members,
		activeDeliberations,
		pending,
		recentDecisions,
		canCreateMotion,
		deliberationRules,
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByHandle('society');
		if (!association) return fail(404, { message: 'Society not found' });

		// Check permissions
		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_CREATE, association.uuid)) {
			return fail(403, { message: 'Not authorized to create motions' });
		}

		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const body = String(data.get('body') ?? '').trim();
		const reasoning = String(data.get('reasoning') ?? '').trim() || null;
		const deliberation_rule_uuid = String(data.get('deliberation_rule_uuid') ?? '').trim() || null;

		if (!title) return fail(400, { message: 'Title is required' });
		if (!body) return fail(400, { message: 'Motion text is required' });

		const society = getAssociationByHandle('society');
		if (!society) return fail(500, { message: 'Society association not found' });

		const motion = createMotion({
			title,
			body,
			reasoning,
			introduced_by_uuid: actingAs,
			body_uuid: society.uuid,
			deliberation_rule_uuid,
		});

		return { created: motion.uuid };
	},
};
