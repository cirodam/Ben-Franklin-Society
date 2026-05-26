import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { isOidcConfigured, setOidcConfig, getOidcConfig } from '$lib/server/config.js';
import { env } from '$env/dynamic/private';

const APP_NAME = 'Mail';
const DEFAULT_CLIENT_ID = 'mail';

export const load: PageServerLoad = async ({ url }) => {
	if (isOidcConfigured()) {
		redirect(302, '/');
	}

	const config = getOidcConfig();
	const redirectUri = env.PUBLIC_URL ? `${env.PUBLIC_URL}/oauth/callback` : `${url.origin}/oauth/callback`;

	return {
		appName: APP_NAME,
		clientId: DEFAULT_CLIENT_ID,
		redirectUri,
		governanceUrl: config.governanceUrl,
	};
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const data = await request.formData();
		const governanceUrl = data.get('governance_url');
		const clientSecret = data.get('client_secret');

		if (typeof governanceUrl !== 'string' || !governanceUrl.trim()) {
			return fail(400, { error: 'Governance URL is required' });
		}

		if (typeof clientSecret !== 'string' || !clientSecret.trim()) {
			return fail(400, { error: 'Client Secret is required' });
		}

		// Validate governance URL format
		try {
			new URL(governanceUrl);
		} catch {
			return fail(400, { error: 'Invalid Governance URL format' });
		}

		// Use PUBLIC_URL env var if set, otherwise use request origin
		const redirectUri = env.PUBLIC_URL ? `${env.PUBLIC_URL}/oauth/callback` : `${url.origin}/oauth/callback`;

		// Save to database
		try {
			setOidcConfig({
				governanceUrl,
				clientId: DEFAULT_CLIENT_ID,
				clientSecret,
				redirectUri,
			});
		} catch (err) {
			console.error('Failed to save OIDC config:', err);
			return fail(500, { error: 'Failed to save configuration to database.' });
		}

		return {
			success: true,
			message: 'OIDC configuration saved successfully!',
		};
	},
};
