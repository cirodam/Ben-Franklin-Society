import type { PageServerLoad } from './$types.js';
import { listVoteSessions, getActiveVoteSessions } from '$lib/server/governance/vote-sessions';
import { listAssociations } from '$lib/server/organization/associations';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.session) {
		return { sessions: [], associations: [], filters: {} };
	}

	// Get filter parameters
	const statusFilter = url.searchParams.get('status');
	const bodyFilter = url.searchParams.get('body');

	// Get all sessions with motion and body details
	let sessions = listVoteSessions({
		status: statusFilter as any
	}).map((session) => {
		const motion = db.prepare('SELECT title, body_uuid FROM motion WHERE uuid = ?')
			.get(session.motion_uuid) as { title: string; body_uuid: string } | undefined;
		
		const body = motion ? db.prepare('SELECT name, abbreviation FROM association WHERE uuid = ?')
			.get(motion.body_uuid) as { name: string; abbreviation: string | null } | undefined : undefined;
		
		const opener = db.prepare('SELECT given_name, family_name, handle FROM person WHERE uuid = ?')
			.get(session.opened_by) as { given_name: string; family_name: string; handle: string } | undefined;

		return {
			...session,
			motion_title: motion?.title ?? 'Unknown Motion',
			body_uuid: motion?.body_uuid,
			body_name: body?.name ?? 'Unknown Body',
			body_abbreviation: body?.abbreviation,
			opener_name: opener ? `${opener.given_name} ${opener.family_name}` : 'Unknown',
			opener_handle: opener?.handle
		};
	});

	// Apply body filter
	if (bodyFilter) {
		sessions = sessions.filter((s) => s.body_uuid === bodyFilter);
	}

	// Get all associations for filter dropdown
	const associations = listAssociations({ status: 'active' });

	return {
		sessions,
		associations,
		filters: {
			status: statusFilter,
			body: bodyFilter
		}
	};
};
