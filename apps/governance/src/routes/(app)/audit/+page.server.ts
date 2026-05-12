import type { PageServerLoad } from './$types.js';
import { getAuditLog } from '$lib/server/audit.js';
import { db } from '$lib/server/db.js';

const PAGE_SIZE = 50;

export const load: PageServerLoad = async ({ url }) => {
	const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10));

	const entries = getAuditLog({ limit: PAGE_SIZE + 1, offset });
	const hasMore = entries.length > PAGE_SIZE;
	const page = entries.slice(0, PAGE_SIZE);

	// Enrich with actor handle
	const actorUuids = [...new Set(page.map((e) => e.actor_uuid))];
	const actorMap: Record<string, string> = {};
	for (const uuid of actorUuids) {
		const row = db.prepare('SELECT handle FROM person WHERE uuid = ?').get(uuid) as { handle: string } | undefined;
		if (row) actorMap[uuid] = row.handle;
	}

	// Enrich with motion title where applicable
	const motionUuids = [...new Set(page.map((e) => e.motion_uuid).filter(Boolean))] as string[];
	const motionMap: Record<string, string> = {};
	for (const uuid of motionUuids) {
		const row = db.prepare('SELECT title FROM motion WHERE uuid = ?').get(uuid) as { title: string } | undefined;
		if (row) motionMap[uuid] = row.title;
	}

	return { entries: page, actorMap, motionMap, offset, hasMore };
};
