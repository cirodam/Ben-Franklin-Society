import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getClient, validateRedirectUri, createAuthCode } from '$lib/server/oidc.js';

export const GET: RequestHandler = async ({ url, locals }) => {
	const responseType = url.searchParams.get('response_type');
	const clientId = url.searchParams.get('client_id');
	const redirectUri = url.searchParams.get('redirect_uri');
	const codeChallenge = url.searchParams.get('code_challenge');
	const codeChallengeMethod = url.searchParams.get('code_challenge_method');
	const scope = url.searchParams.get('scope') ?? 'openid';
	const state = url.searchParams.get('state');

	if (responseType !== 'code') error(400, 'Unsupported response_type');
	if (!clientId || !redirectUri || !codeChallenge) error(400, 'Missing required parameters');
	if (codeChallengeMethod !== 'S256') error(400, 'Only S256 code_challenge_method is supported');

	const client = getClient(clientId);
	if (!client) error(400, 'Unknown client_id');
	if (!validateRedirectUri(clientId, redirectUri)) error(400, 'Invalid redirect_uri');

	if (!locals.session || !locals.person) {
		const next = encodeURIComponent(url.pathname + url.search);
		redirect(302, `/login?next=${next}`);
	}

	const code = createAuthCode({
		clientId,
		redirectUri,
		personUuid: locals.person.uuid,
		actingAsUuid: locals.session.acting_as_uuid,
		scope,
		codeChallenge,
	});

	let dest: URL;
	try {
		dest = new URL(redirectUri);
	} catch {
		error(400, 'Invalid redirect_uri');
	}
	dest.searchParams.set('code', code);
	if (state) dest.searchParams.set('state', state);
	redirect(302, dest.toString());
};
