import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getPersonByUuid, updatePersonProfile } from '$lib/server/organization/people.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	if (!session) {
		throw redirect(302, '/login');
	}

	const person = getPersonByUuid(session.person_uuid);
	if (!person) {
		throw redirect(302, '/login');
	}

	return {
		person
	};
};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Not authenticated' });
		}

		const fd = await request.formData();
		const givenName = String(fd.get('given_name') ?? '').trim();
		const familyName = String(fd.get('family_name') ?? '').trim();
		const dob = String(fd.get('date_of_birth') ?? '').trim();
		const phone = String(fd.get('phone') ?? '').trim();
		const streetAddress = String(fd.get('street_address') ?? '').trim();
		const latitudeStr = String(fd.get('latitude') ?? '').trim();
		const longitudeStr = String(fd.get('longitude') ?? '').trim();

		// Parse coordinates
		const latitude = latitudeStr ? parseFloat(latitudeStr) : null;
		const longitude = longitudeStr ? parseFloat(longitudeStr) : null;

		// Validation
		if (!givenName || !familyName || !dob) {
			return fail(400, {
				error: 'Given name, family name, and date of birth are required.',
				givenName,
				familyName,
				dob,
				phone,
				streetAddress,
				latitude,
				longitude
			});
		}

		if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
			return fail(400, {
				error: 'Date of birth must be in YYYY-MM-DD format.',
				givenName,
				familyName,
				dob,
				phone,
				streetAddress,
				latitude,
				longitude
			});
		}

		// Validate coordinates if provided
		if (latitude !== null && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
			return fail(400, {
				error: 'Latitude must be a number between -90 and 90.',
				givenName,
				familyName,
				dob,
				phone,
				streetAddress,
				latitude,
				longitude
			});
		}

		if (longitude !== null && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
			return fail(400, {
				error: 'Longitude must be a number between -180 and 180.',
				givenName,
				familyName,
				dob,
				phone,
				streetAddress,
				latitude,
				longitude
			});
		}

		try {
			updatePersonProfile(locals.session.person_uuid, {
				given_name: givenName,
				family_name: familyName,
				date_of_birth: dob,
				phone: phone || null,
				street_address: streetAddress || null,
				latitude: latitude,
				longitude: longitude
			});
		} catch (err: any) {
			return fail(400, {
				error: err.message || 'Failed to update profile.',
				givenName,
				familyName,
				dob,
				phone,
				streetAddress,
				latitude,
				longitude
			});
		}

		throw redirect(303, '/me');
	}
};
