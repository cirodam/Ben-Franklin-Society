import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getAssociationByUuid,
	getCurrentMembers,
	getRolesByAssociation,
} from '$lib/server/organization/associations.js';
import { db } from '$lib/server/db.js';
import { getDocumentBySlug } from '$lib/server/documents/society-docs.js';
import * as bulletin from '$lib/server/communications/bulletin.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const association = getAssociationByUuid(params.uuid);
	if (!association) error(404, 'College not found');
	if (association.type !== 'college') redirect(302, `/associations/${params.uuid}`);

	const members = getCurrentMembers(association.uuid);
	const roles = getRolesByAssociation(association.uuid);

	const memberDetails = members.map((m) => {
		const person = db
			.prepare('SELECT uuid, handle, given_name, family_name FROM person WHERE uuid = ?')
			.get(m.person_uuid) as { uuid: string; handle: string; given_name: string; family_name: string } | undefined;
		return { ...m, person: person ?? null };
	});

	// Get recent motions for this college (motions are now documents in library)
	const motions = db
		.prepare('SELECT uuid, title, created_at FROM library_item WHERE type = ? AND owner_uuid = ? ORDER BY created_at DESC LIMIT 10')
		.all('motion', association.uuid) as { uuid: string; title: string; created_at: string }[];

	// Load governing document if slug is set
	const governingDocument = association.governing_document_slug
		? getDocumentBySlug(association.governing_document_slug)
		: null;

	// Load bulletin posts
	const actingAs = locals.session?.person_uuid ?? null;
	const bulletinPosts = actingAs ? bulletin.getAssociationPosts(association.uuid, actingAs) : [];

	return { association, members: memberDetails, roles, motions, governingDocument, bulletinPosts };
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const title = data.get('title');
		const body = data.get('body');
		const visibility = data.get('visibility') as 'public' | 'members_only' | 'officers_only' | null;
		const category = data.get('category') as 'announcement' | 'discussion' | 'question' | 'event' | 'policy' | null;

		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			return fail(400, { error: 'Title is required' });
		}

		if (!body || typeof body !== 'string' || body.trim().length === 0) {
			return fail(400, { error: 'Body is required' });
		}

		try {
			bulletin.createPost({
				author_uuid: session.person_uuid,
				association_uuid: params.uuid,
				title: title,
				body: body,
				visibility: visibility ?? 'members_only',
				category: category ?? 'discussion',
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: 'Failed to create post' });
		}
	},
};
