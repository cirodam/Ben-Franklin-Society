import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getFullRecord, addEntry, editEntry, deleteEntry, getEntryByUuid } from '$lib/server/communications/record.js';
import { hasPermission, PERMISSIONS } from '$lib/server/infrastructure/permissions.js';
import { audit } from '$lib/server/documents/audit.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
	const limit = 50;

	const entries = getFullRecord(limit + 1, offset);
	const hasMore = entries.length > limit;
	const page = hasMore ? entries.slice(0, limit) : entries;

	// Join recorder name and association name
	const enriched = page.map((e) => {
		const recorder = db
			.prepare('SELECT handle, given_name, family_name FROM person WHERE uuid = ?')
			.get(e.recorded_by) as { handle: string; given_name: string; family_name: string } | undefined;
		const association = db
			.prepare('SELECT name, handle FROM association WHERE uuid = ?')
			.get(e.association_uuid) as { name: string; handle: string } | undefined;
		return {
			...e,
			recorder: recorder ?? null,
			association_name: association?.name ?? null,
			association_handle: association?.handle ?? null,
		};
	});

	// Collect all association uuids the current user has record:write in
	const writeableAssociationUuids: string[] = [];
	if (locals.session) {
		const actingAs = locals.session.acting_as_uuid;
		const rows = db.prepare(
			`SELECT DISTINCT r.association_uuid
			 FROM role_assignment ra
			 JOIN role r ON r.uuid = ra.role_uuid
			 JOIN role_permission rp ON rp.role_uuid = ra.role_uuid
			 WHERE ra.person_uuid = ? AND ra.removed_at IS NULL
			   AND rp.app = 'governance' AND rp.permission = ?`
		).all(actingAs, PERMISSIONS.RECORD_WRITE) as { association_uuid: string }[];
		writeableAssociationUuids.push(...rows.map(r => r.association_uuid));
	}

	// Load associations for the "add entry" form
	const associations = writeableAssociationUuids.length
		? db.prepare(
			`SELECT uuid, name FROM association WHERE uuid IN (${writeableAssociationUuids.map(() => '?').join(',')}) ORDER BY name`
		  ).all(...writeableAssociationUuids) as { uuid: string; name: string }[]
		: [];

	const actingAs = locals.session?.acting_as_uuid ?? null;

	return { entries: enriched, offset, limit, hasMore, associations, actingAs };
};

export const actions: Actions = {
	add: async ({ locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const association_uuid = String(data.get('association_uuid') ?? '').trim();
		const body = String(data.get('body') ?? '').trim();

		if (!association_uuid || !body) return fail(400, { error: 'Missing fields' });
		if (!hasPermission(actingAs, PERMISSIONS.RECORD_WRITE, association_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const entry = addEntry(association_uuid, actingAs, 'manual', 'record', '', body);
		audit(actingAs, 'record.add', 'record_entry', entry.uuid, body);
		return { success: true };
	},

	edit: async ({ locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const entry_uuid = String(data.get('entry_uuid') ?? '').trim();
		const body = String(data.get('body') ?? '').trim();

		if (!entry_uuid || !body) return fail(400, { error: 'Missing fields' });

		const entry = getEntryByUuid(entry_uuid);
		if (!entry) return fail(404, { error: 'Entry not found' });
		if (!hasPermission(actingAs, PERMISSIONS.RECORD_WRITE, entry.association_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		editEntry(entry_uuid, body);
		audit(actingAs, 'record.edit', 'record_entry', entry_uuid, body);
		return { success: true };
	},

	delete: async ({ locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const entry_uuid = String(data.get('entry_uuid') ?? '').trim();
		if (!entry_uuid) return fail(400, { error: 'Missing entry_uuid' });

		const entry = getEntryByUuid(entry_uuid);
		if (!entry) return fail(404, { error: 'Entry not found' });
		if (!hasPermission(actingAs, PERMISSIONS.RECORD_WRITE, entry.association_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		deleteEntry(entry_uuid);
		audit(actingAs, 'record.delete', 'record_entry', entry_uuid, `Entry deleted: ${entry.body.slice(0, 80)}`);
		return { success: true };
	},
};
