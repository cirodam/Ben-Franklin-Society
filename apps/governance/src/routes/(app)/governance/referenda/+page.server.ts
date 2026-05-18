import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getAssociationByHandle,
	getCurrentMembers,
} from '$lib/server/organization/associations.js';
import { listMotions, createMotion, getVoteTally, getComments } from '$lib/server/governance/motions.js';
import { listDeliberationRules } from '$lib/server/governance/deliberation-rules.js';
import { hasPermission, PERMISSIONS } from '$lib/server/infrastructure/permissions.js';
import {
	listPetitions,
	createPetition,
	signPetition,
	unsignPetition,
} from '$lib/server/governance/petitions.js';
import {
	listReferendums,
	getReferendumWithQuestions,
	castVote,
	getVote,
} from '$lib/server/governance/referendums.js';

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

	// Get petitions
	const openPetitions = listPetitions({ status: 'open', personUuid: actingAs ?? undefined });
	const respondedPetitions = listPetitions({ status: 'responded', personUuid: actingAs ?? undefined });

	// Get referendums
	const openReferendums = listReferendums({ status: 'open' });
	const closedReferendums = listReferendums({ status: 'closed' });

	// Enrich open referendums with questions and user's votes
	const enrichedOpenReferendums = openReferendums.map((ref) => {
		const withQuestions = getReferendumWithQuestions(ref.uuid);
		if (!withQuestions || !actingAs) return withQuestions;

		// Check which questions the user has voted on
		const questionsWithVotes = withQuestions.questions.map((q) => ({
			...q,
			userVote: getVote(q.uuid, actingAs),
		}));

		return {
			...withQuestions,
			questions: questionsWithVotes,
		};
	});

	return {
		association,
		members,
		activeDeliberations,
		pending,
		recentDecisions,
		canCreateMotion,
		deliberationRules,
		openPetitions,
		respondedPetitions,
		openReferendums: enrichedOpenReferendums,
		closedReferendums,
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

	createPetition: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const body = String(data.get('body') ?? '').trim();

		if (!title) return fail(400, { message: 'Title is required' });
		if (!body) return fail(400, { message: 'Description is required' });

		const petition = createPetition({
			title,
			body,
			created_by_uuid: actingAs,
		});

		return { petitionCreated: petition.uuid };
	},

	signPetition: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const petitionUuid = String(data.get('petition_uuid') ?? '');

		if (!petitionUuid) return fail(400, { message: 'Petition UUID is required' });

		signPetition(petitionUuid, actingAs);

		return { success: true };
	},

	unsignPetition: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const petitionUuid = String(data.get('petition_uuid') ?? '');

		if (!petitionUuid) return fail(400, { message: 'Petition UUID is required' });

		unsignPetition(petitionUuid, actingAs);

		return { success: true };
	},

	voteOnQuestion: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const questionUuid = String(data.get('question_uuid') ?? '');
		const voteValue = String(data.get('vote_value') ?? '');

		if (!questionUuid) return fail(400, { message: 'Question UUID is required' });
		if (!voteValue) return fail(400, { message: 'Vote value is required' });

		// Parse vote value (could be simple string or JSON)
		let parsedVote: any;
		try {
			parsedVote = JSON.parse(voteValue);
		} catch {
			parsedVote = voteValue;
		}

		castVote({
			question_uuid: questionUuid,
			person_uuid: actingAs,
			vote_value: parsedVote,
		});

		return { success: true };
	},
};
