import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { createPerson, getPersonByHandle } from '$lib/server/people.js';
import { createAssociation, addMember } from '$lib/server/associations.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async () => {
	const existing = db.prepare('SELECT 1 FROM person LIMIT 1').get();
	if (existing) redirect(302, '/login');
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const rawHandle   = data.get('handle');
		const givenName   = data.get('given_name');
		const familyName  = data.get('family_name');
		const dob         = data.get('date_of_birth');
		const password    = data.get('password');
		const confirm     = data.get('confirm_password');

		if (
			typeof rawHandle !== 'string' || !rawHandle ||
			typeof givenName !== 'string' || !givenName ||
			typeof familyName !== 'string' || !familyName ||
			typeof dob !== 'string' || !dob ||
			typeof password !== 'string' || !password ||
			typeof confirm !== 'string'
		) {
			return fail(400, { error: 'All fields are required.' });
		}

		const handle = rawHandle.toLowerCase().trim();

		if (password !== confirm) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		if (password.length < 12) {
			return fail(400, { error: 'Password must be at least 12 characters.' });
		}

		if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
			return fail(400, { error: 'Date of birth must be in YYYY-MM-DD format.' });
		}

		if (!/^[a-z0-9_-]{2,32}$/.test(handle)) {
			return fail(400, { error: 'Handle must be 2–32 lowercase letters, numbers, hyphens, or underscores.' });
		}

		if (getPersonByHandle(handle)) {
			return fail(400, { error: 'That handle is already taken.' });
		}

		const person = await createPerson({ handle, given_name: givenName, family_name: familyName, date_of_birth: dob, initial_password: password });

		// Seed the four system associations and add the founding member
		const systemAssociations = [
			{ handle: 'general-assembly',    name: 'General Assembly',    type: 'general_assembly'    },
			{ handle: 'central-bank',        name: 'Central Bank',        type: 'central_bank'        },
			{ handle: 'social-insurance',    name: 'Social Insurance Fund', type: 'social_insurance_fund' },
			{ handle: 'community-bank',      name: 'Community Bank',      type: 'community_bank'      },
		] as const;

		for (const assoc of systemAssociations) {
			const created = createAssociation(assoc);
			addMember(created.uuid, person.uuid);
		}

		redirect(302, '/login');
	}
};
