import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';

export interface ConfigEntry {
	key: string;
	value: string;
	description: string;
	updated_at: string;
}

export const load: PageServerLoad = async () => {
	const entries = db
		.prepare(`SELECT * FROM community_config ORDER BY key ASC`)
		.all() as ConfigEntry[];
	return { entries };
};
