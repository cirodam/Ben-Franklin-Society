import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { isOidcConfigured, setOidcConfig, getOidcConfig } from '$lib/server/config.js';

const APP_NAME = 'Community Bank';
const DEFAULT_CLIENT_ID = 'community-bank';
const DEFAULT_REDIRECT_URI = 'http://localhost:5174/oauth/callback';
const DEFAULT_GOVERNANCE_URL = 'http://localhost:5173';

export const load: PageServerLoad = async () => {
	if (isOidcConfigured()) {
		redirect(302, '/');
	}

	const config = getOidcConfig();

	return {
		appName: APP_NAME,
		clientId: DEFAULT_CLIENT_ID,
		redirectUri: DEFAULT_REDIRECT_URI,
		governanceUrl: config.governanceUrl,
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
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

		// Save to database
		try {
			setOidcConfig({
				governanceUrl,
				clientId: DEFAULT_CLIENT_ID,
				clientSecret,
				redirectUri: DEFAULT_REDIRECT_URI,
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
