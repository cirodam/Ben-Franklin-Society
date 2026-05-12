import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	listPeople,
	getPersonByUuid,
	createPerson,
	updatePersonProfile,
	suspendPerson,
	reinstatePerson,
	revokePerson,
	getPersonByHandle,
} from '$lib/server/people.js';
import { hasPermission, PERMISSIONS } from '$lib/server/permissions.js';
import { audit } from '$lib/server/audit.js';
import { listEnactedMotions, getMotionByUuid } from '$lib/server/motions.js';

function requireEnactedMotion(motion_uuid: string) {
	const motion = getMotionByUuid(motion_uuid);
	if (!motion || motion.status !== 'enacted')
		throw new Error('A passed (enacted) motion is required.');
	return motion;
}

export const load: PageServerLoad = async ({ locals }) => {
	const actingAs = locals.session?.acting_as_uuid ?? null;
	const canAdd    = actingAs ? hasPermission(actingAs, PERMISSIONS.PEOPLE_ADD) : false;
	const canEdit   = actingAs ? hasPermission(actingAs, PERMISSIONS.PEOPLE_EDIT) : false;
	const canRemove = actingAs ? hasPermission(actingAs, PERMISSIONS.PEOPLE_REMOVE) : false;

	const enactedMotions = (canAdd || canRemove) ? listEnactedMotions() : [];

	return { people: listPeople(), canAdd, canEdit, canRemove, actingAs, enactedMotions };
};

export const actions: Actions = {
	add: async ({ locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		if (!hasPermission(actingAs, PERMISSIONS.PEOPLE_ADD)) return fail(403, { error: 'Insufficient permissions' });

		const data = await request.formData();
		const motion_uuid = String(data.get('motion_uuid') ?? '').trim();
		const handle      = String(data.get('handle')      ?? '').trim();
		const given_name  = String(data.get('given_name')  ?? '').trim();
		const family_name = String(data.get('family_name') ?? '').trim();
		const dob         = String(data.get('date_of_birth') ?? '').trim();
		const phone       = String(data.get('phone')       ?? '').trim() || null;
		const password    = String(data.get('password')    ?? '').trim();

		if (!motion_uuid) return fail(400, { error: 'A passed motion must be selected.' });
		try { requireEnactedMotion(motion_uuid); } catch { return fail(400, { error: 'Selected motion is not enacted.' }); }
		if (!handle || !given_name || !family_name || !dob || !password)
			return fail(400, { error: 'All fields except phone are required.' });
		if (password.length < 12)
			return fail(400, { error: 'Password must be at least 12 characters.' });
		if (!/^\d{4}-\d{2}-\d{2}$/.test(dob))
			return fail(400, { error: 'Date of birth must be YYYY-MM-DD.' });
		if (!/^[a-z0-9_-]{2,32}$/.test(handle))
			return fail(400, { error: 'Handle must be 2–32 lowercase letters, numbers, hyphens, or underscores.' });
		if (getPersonByHandle(handle))
			return fail(400, { error: 'That handle is already taken.' });

		const person = await createPerson({ handle, given_name, family_name, date_of_birth: dob, phone: phone ?? undefined, initial_password: password });
		audit(actingAs, 'people.add', 'person', person.uuid, `Added @${handle}`, motion_uuid);
		return { success: true };
	},

	edit: async ({ locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		if (!hasPermission(actingAs, PERMISSIONS.PEOPLE_EDIT)) return fail(403, { error: 'Insufficient permissions' });

		const data = await request.formData();
		const person_uuid  = String(data.get('person_uuid')  ?? '').trim();
		const given_name   = String(data.get('given_name')   ?? '').trim();
		const family_name  = String(data.get('family_name')  ?? '').trim();
		const dob          = String(data.get('date_of_birth') ?? '').trim();
		const phone        = String(data.get('phone')        ?? '').trim() || null;

		if (!person_uuid || !given_name || !family_name || !dob)
			return fail(400, { error: 'Missing required fields.' });
		if (!/^\d{4}-\d{2}-\d{2}$/.test(dob))
			return fail(400, { error: 'Date of birth must be YYYY-MM-DD.' });

		const person = getPersonByUuid(person_uuid);
		if (!person) return fail(404, { error: 'Person not found.' });

		updatePersonProfile(person_uuid, { given_name, family_name, date_of_birth: dob, phone });
		audit(actingAs, 'people.edit', 'person', person_uuid, `Edited @${person.handle}`);
		return { success: true };
	},

	suspend: async ({ locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		if (!hasPermission(actingAs, PERMISSIONS.PEOPLE_REMOVE)) return fail(403, { error: 'Insufficient permissions' });

		const data = await request.formData();
		const motion_uuid = String(data.get('motion_uuid') ?? '').trim();
		const person_uuid = String(data.get('person_uuid') ?? '').trim();

		if (!motion_uuid) return fail(400, { error: 'A passed motion must be selected.' });
		try { requireEnactedMotion(motion_uuid); } catch { return fail(400, { error: 'Selected motion is not enacted.' }); }

		const person = getPersonByUuid(person_uuid);
		if (!person) return fail(404, { error: 'Person not found.' });

		suspendPerson(person_uuid);
		audit(actingAs, 'people.suspend', 'person', person_uuid, `Suspended @${person.handle}`, motion_uuid);
		return { success: true };
	},

	reinstate: async ({ locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		if (!hasPermission(actingAs, PERMISSIONS.PEOPLE_REMOVE)) return fail(403, { error: 'Insufficient permissions' });

		const data = await request.formData();
		const motion_uuid = String(data.get('motion_uuid') ?? '').trim();
		const person_uuid = String(data.get('person_uuid') ?? '').trim();

		if (!motion_uuid) return fail(400, { error: 'A passed motion must be selected.' });
		try { requireEnactedMotion(motion_uuid); } catch { return fail(400, { error: 'Selected motion is not enacted.' }); }

		const person = getPersonByUuid(person_uuid);
		if (!person) return fail(404, { error: 'Person not found.' });

		reinstatePerson(person_uuid);
		audit(actingAs, 'people.reinstate', 'person', person_uuid, `Reinstated @${person.handle}`, motion_uuid);
		return { success: true };
	},

	revoke: async ({ locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		if (!hasPermission(actingAs, PERMISSIONS.PEOPLE_REMOVE)) return fail(403, { error: 'Insufficient permissions' });

		const data = await request.formData();
		const motion_uuid = String(data.get('motion_uuid') ?? '').trim();
		const person_uuid = String(data.get('person_uuid') ?? '').trim();

		if (!motion_uuid) return fail(400, { error: 'A passed motion must be selected.' });
		try { requireEnactedMotion(motion_uuid); } catch { return fail(400, { error: 'Selected motion is not enacted.' }); }

		const person = getPersonByUuid(person_uuid);
		if (!person) return fail(404, { error: 'Person not found.' });

		revokePerson(person_uuid);
		audit(actingAs, 'people.revoke', 'person', person_uuid, `Revoked @${person.handle}`, motion_uuid);
		return { success: true };
	},
};

