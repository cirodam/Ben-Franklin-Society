import { fail, redirect } from '@sveltejs/kit';
import { createPerson } from '$lib/server/organization/people.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const fd = await request.formData();
		const handle = String(fd.get('handle') ?? '').trim().toLowerCase();
		const givenName = String(fd.get('given_name') ?? '').trim();
		const familyName = String(fd.get('family_name') ?? '').trim();
		const dob = String(fd.get('date_of_birth') ?? '').trim();
		const phone = String(fd.get('phone') ?? '').trim();
		const password = String(fd.get('initial_password') ?? '').trim();

		// Validation
		if (!handle || !givenName || !familyName || !dob || !password) {
			return fail(400, { 
				error: 'Handle, given name, family name, date of birth, and password are required.',
				handle, givenName, familyName, dob, phone
			});
		}

		if (!/^[a-z0-9_-]{2,32}$/.test(handle)) {
			return fail(400, { 
				error: 'Handle must be 2-32 lowercase letters, numbers, hyphens, or underscores.',
				handle, givenName, familyName, dob, phone
			});
		}

		if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
			return fail(400, { 
				error: 'Date of birth must be in YYYY-MM-DD format.',
				handle, givenName, familyName, dob, phone
			});
		}

		if (password.length < 8) {
			return fail(400, { 
				error: 'Password must be at least 8 characters.',
				handle, givenName, familyName, dob, phone
			});
		}

		try {
			const person = await createPerson({
				handle,
				given_name: givenName,
				family_name: familyName,
				date_of_birth: dob,
				phone: phone || undefined,
				initial_password: password,
			});

			redirect(303, `/people/${person.uuid}`);
		} catch (err: any) {
			return fail(400, { 
				error: err.message || 'Failed to create person. Handle may already be taken.',
				handle, givenName, familyName, dob, phone
			});
		}
	}
};
