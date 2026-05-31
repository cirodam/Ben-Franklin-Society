import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { verifyAccessToken } from '$lib/server/infrastructure/oidc/jwt.js';
import { getPersonByUuid } from '$lib/server/organization/people.js';

export const GET: RequestHandler = async ({ request }) => {
	const auth = request.headers.get('authorization');
	if (!auth?.startsWith('Bearer ')) {
		return json({ error: 'invalid_token' }, { status: 401 });
	}

	const claims = verifyAccessToken(auth.slice(7));
	if (!claims) {
		return json({ error: 'invalid_token' }, { status: 401 });
	}

	const person = getPersonByUuid(claims.sub);
	if (!person) {
		return json({ error: 'invalid_token' }, { status: 401 });
	}

	return json(
		{
			sub: person.uuid,
			handle: person.handle,
			given_name: person.given_name,
			family_name: person.family_name,
			acting_as: claims.acting_as,
			permissions: claims.permissions,
		},
		{ headers: { 'Access-Control-Allow-Origin': '*' } }
	);
};
