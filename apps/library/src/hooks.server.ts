import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getOidcClient } from '$lib/server/oidc.js';
import { ensureBucket } from '$lib/server/buckets.js';
import { isOidcConfigured } from '$lib/server/config.js';
import { verifyAccessToken } from '@bfs/oidc-client';
import { getIssuerUrl } from '$lib/server/config.js';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = null;

	console.log('[library/hooks] Request to:', event.url.pathname);

	// Check if OIDC is configured (except for setup page itself)
	if (event.url.pathname !== '/oidc-setup' && !isOidcConfigured()) {
		console.log('[library/hooks] OIDC not configured, redirecting to setup');
		redirect(302, '/oidc-setup');
	}

	// Get session from OIDC client (validates JWT locally)
	// Only attempt if OIDC is configured
	if (isOidcConfigured()) {
		// Check for Bearer token in Authorization header (for server-to-server API calls)
		const authHeader = event.request.headers.get('Authorization');
		if (authHeader?.startsWith('Bearer ')) {
			const token = authHeader.slice(7);
			console.log('[library/hooks] Found Bearer token in Authorization header');
			
			try {
				const issuerUrl = getIssuerUrl();
				const claims = await verifyAccessToken(token, issuerUrl);
				
				if (claims) {
					console.log('[library/hooks] Valid Bearer token for user:', claims.sub);
					// Create session from token claims
					event.locals.session = {
						uuid: claims.jti,
						person_uuid: claims.sub,
						acting_as_uuid: claims.acting_as,
						handle: claims.sub, // Bearer tokens don't have handle in access token
						given_name: '',
						family_name: '',
						permissions: claims.permissions || [],
						contexts: [],
						expires_at: claims.exp,
					};
					// Ensure user bucket exists (use person_uuid for user buckets)
				try {
					console.log('[library/hooks] Ensuring bucket for user:', claims.sub);
					const bucket = ensureBucket('user', claims.sub);
					console.log('[library/hooks] Bucket ensured:', bucket.bucket_key, 'id:', bucket.id);
				} catch (bucketErr) {
					console.error('[library/hooks] Error ensuring bucket:', bucketErr);
				}
				} else {
					console.log('[library/hooks] Invalid Bearer token');
				}
			} catch (err) {
				console.error('[library/hooks] Error verifying Bearer token:', err);
			}
		} else {
			// Fall back to cookie-based session (for browser users)
			const session = await getOidcClient().getSession(event.cookies);
			
			if (session) {
				console.log('[library/hooks] Valid session for user:', session.handle);
				event.locals.session = session;
				// Ensure user bucket exists on login (use person_uuid for user buckets)
				ensureBucket('user', session.person_uuid);
			} else {
				console.log('[library/hooks] No valid session');
			}
		}
	}

	return resolve(event);
};
