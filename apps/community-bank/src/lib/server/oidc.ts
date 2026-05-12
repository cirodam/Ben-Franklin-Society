import { OidcClient } from '@bfs/oidc-client';

const GOVERNANCE_URL = process.env.GOVERNANCE_URL ?? 'http://localhost:5173';
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID ?? 'community-bank';
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET;
const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI ?? 'http://localhost:5174/oauth/callback';

export const oidcClient = new OidcClient({
	issuerUrl: GOVERNANCE_URL,
	clientId: OIDC_CLIENT_ID,
	clientSecret: OIDC_CLIENT_SECRET,
	redirectUri: OIDC_REDIRECT_URI,
});
