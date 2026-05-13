import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getPersonByUuid } from '$lib/server/people.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const person = getPersonByUuid(params.uuid);
	
	if (!person) {
		throw error(404, 'Person not found');
	}

	// Get roles held by this person
	const roles = db.prepare(`
		SELECT 
			r.uuid,
			r.name,
			r.level,
			r.division,
			r.salary_monthly,
			r.daily_rate,
			r.term_days,
			a.uuid as association_uuid,
			a.name as association_name,
			a.type as association_type,
			pr.assigned_at
		FROM person_role pr
		JOIN role r ON pr.role_uuid = r.uuid
		JOIN association a ON r.association_uuid = a.uuid
		WHERE pr.person_uuid = ? AND pr.removed_at IS NULL
		ORDER BY pr.assigned_at DESC
	`).all(params.uuid);

	// Get bulletin posts by this person
	const posts = db.prepare(`
		SELECT 
			uuid,
			title,
			body,
			color,
			created_at,
			(SELECT COUNT(*) FROM bulletin_comment WHERE post_uuid = bulletin_post.uuid AND deleted_at IS NULL) as comment_count
		FROM bulletin_post
		WHERE author_uuid = ? AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT 10
	`).all(params.uuid);

	return {
		person,
		roles,
		posts
	};
};
