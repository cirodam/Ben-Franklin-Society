import { getDatabase } from '@bfs/db';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const db = getDatabase();

	const posts = db.prepare(`
		SELECT 
			bp.uuid,
			bp.title,
			bp.body,
			bp.color,
			bp.created_at,
			p.given_name,
			p.family_name,
			p.handle,
			(SELECT COUNT(*) FROM bulletin_comment WHERE post_uuid = bp.uuid AND deleted_at IS NULL) as comment_count
		FROM bulletin_post bp
		JOIN person p ON bp.author_uuid = p.uuid
		WHERE bp.deleted_at IS NULL
			AND datetime(bp.created_at) > datetime('now', '-30 days')
		ORDER BY bp.created_at DESC
	`).all() as Array<{
		uuid: string;
		title: string;
		body: string;
		color: string;
		created_at: string;
		given_name: string;
		family_name: string;
		handle: string;
		comment_count: number;
	}>;

	return { posts };
};
