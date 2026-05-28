import { randomBytes } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { generatePKCEChallenge } from './pkce.js';
import { verifyAccessToken, verifyIdToken, isTokenExpired } from './crypto.js';
import type {
	OidcClientConfig,
	TokenSet,
	AccessTokenClaims,
	IdTokenClaims,
	Session,
} from './types.js';

const COOKIE_NAME = 'oidc_session';
const PKCE_COOKIE_NAME = 'oidc_pkce';
const STATE_COOKIE_NAME = 'oidc_state';

// In-memory cache for access tokens (keyed by session UUID)
const accessTokenCache = new Map<string, { token: string; expires_at: number }>();

/**
 * OIDC Client for satellite applications
 */
export class OidcClient {
	private config: OidcClientConfig;

	constructor(config: OidcClientConfig) {
		this.config = config;
	}

	/**
	 * Get consistent cookie options for session cookie
	 * Used for both setting and deleting to ensure proper cookie handling
	 * 
	 * NOTE: We do NOT set a domain attribute, allowing each subdomain to have
	 * its own host-only cookie. This avoids browser security restrictions that
	 * prevent subdomains from setting cookies for parent domains.
	 */
	private getSessionCookieOptions(maxAge?: number) {
		const isProduction = process.env.NODE_ENV === 'production';
		
		return {
			path: '/',
			httpOnly: true,
			sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
			secure: isProduction,
			...(maxAge !== undefined && { maxAge }),
		};
	}

	/**
	 * Initiate the OIDC login flow
	 * Generates PKCE challenge and returns the authorization URL
	 * The caller should redirect to this URL using SvelteKit's redirect()
	 */
	initiateLogin(cookies: Cookies, returnPath?: string): string {
		const { codeVerifier, codeChallenge } = generatePKCEChallenge();
		const state = randomBytes(16).toString('base64url');

		// Store PKCE verifier and state in cookies (short-lived)
		// Use sameSite='none' for cross-subdomain OAuth flows
		const cookieOptions = {
			path: '/',
			httpOnly: true,
			sameSite: 'none' as const,
			secure: true, // Required for sameSite='none'
			maxAge: 600, // 10 minutes
		};

		// Build authorization URL
		const authUrl = new URL(`${this.config.issuerUrl}/oauth/authorize`);
		authUrl.searchParams.set('client_id', this.config.clientId);
		authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
		authUrl.searchParams.set('response_type', 'code');
		authUrl.searchParams.set('scope', 'openid profile');
		authUrl.searchParams.set('code_challenge', codeChallenge);
		authUrl.searchParams.set('code_challenge_method', 'S256');
		authUrl.searchParams.set(
			'state',
			Buffer.from(JSON.stringify({ state, returnPath: returnPath || '/' })).toString('base64url')
		);

		// Store PKCE verifier and state for later verification
		const stateData = JSON.stringify({ codeVerifier, state, returnPath: returnPath || '/' });

		cookies.set(PKCE_COOKIE_NAME, codeVerifier, cookieOptions);
		cookies.set(STATE_COOKIE_NAME, stateData, cookieOptions);

		return authUrl.toString();
	}

	/**
	 * Handle the OAuth callback and exchange authorization code for tokens
	 */
	async handleCallback(
		code: string,
		stateParam: string,
		cookies: Cookies
	): Promise<{ tokens: TokenSet; returnPath: string }> {
		// Decode the state parameter from the URL
		const { state, returnPath: returnPathFromState } = JSON.parse(
			Buffer.from(stateParam, 'base64url').toString()
		);

		// Retrieve and verify PKCE verifier and state from cookies
		const stateData = cookies.get(STATE_COOKIE_NAME);
		if (!stateData) {
			throw new Error('Missing state data');
		}

		const { codeVerifier, state: savedState, returnPath } = JSON.parse(stateData);

		if (state !== savedState) {
			throw new Error('State mismatch');
		}

		// Exchange authorization code for tokens
		const tokenUrl = `${this.config.issuerUrl}/oauth/token`;
		console.log(`[oidc-client] Token exchange URL: ${tokenUrl}`);
		
		const tokenResponse = await fetch(tokenUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				code,
				redirect_uri: this.config.redirectUri,
				client_id: this.config.clientId,
				...(this.config.clientSecret && { client_secret: this.config.clientSecret }),
				code_verifier: codeVerifier,
			}),
		});

		if (!tokenResponse.ok) {
			const responseText = await tokenResponse.text();
			console.error(`[oidc-client] Token exchange failed (${tokenResponse.status}):`, responseText);
			try {
				const error = JSON.parse(responseText);
				throw new Error(`Token exchange failed: ${error.error || tokenResponse.status}`);
			} catch {
				throw new Error(`Token exchange failed (${tokenResponse.status}): ${responseText.substring(0, 200)}`);
			}
		}

		const tokens = (await tokenResponse.json()) as TokenSet;

		// Clean up temporary cookies
		cookies.delete(PKCE_COOKIE_NAME, { path: '/' });
		cookies.delete(STATE_COOKIE_NAME, { path: '/' });

		return { tokens, returnPath };
	}

	/**
	 * Store session in cookie (claims only, not full JWTs)
	 * This keeps the cookie small (<1KB) to avoid browser size limits (4KB)
	 */
	async setSession(cookies: Cookies, tokens: TokenSet): Promise<void> {
		// Extract claims from tokens
		const accessClaims = await verifyAccessToken(tokens.access_token, this.config.issuerUrl);
		const idClaims = await verifyIdToken(tokens.id_token, this.config.issuerUrl);
		
		if (!accessClaims || !idClaims) {
			throw new Error('Failed to verify tokens');
		}
		
		// Store session data (claims + refresh token only)
		// DO NOT store access_token - it's too large and would exceed 4KB cookie limit
		const sessionData = JSON.stringify({
			session: {
				uuid: accessClaims.jti,
				person_uuid: accessClaims.sub,
				acting_as_uuid: accessClaims.acting_as,
				handle: idClaims.handle,
				given_name: idClaims.given_name,
				family_name: idClaims.family_name,
				permissions: accessClaims.permissions,
				contexts: idClaims.contexts,
				expires_at: accessClaims.exp,
			},
			refresh_token: tokens.refresh_token,
		});
		
		const cookieOptions = this.getSessionCookieOptions(tokens.expires_in);
		console.log('[oidc-client] Setting session cookie with options:', {
			cookieName: COOKIE_NAME,
			expires_in: tokens.expires_in,
			dataLength: sessionData.length,
			cookieOptions,
			isProduction: process.env.NODE_ENV === 'production'
		});
		cookies.set(COOKIE_NAME, sessionData, cookieOptions);
		console.log('[oidc-client] Cookie set operation completed');
		
		// Verify the cookie was set by trying to read it back
		const verification = cookies.get(COOKIE_NAME);
		console.log('[oidc-client] Verification - cookie readable immediately after set:', !!verification);
	}

	/**
	 * Get the current session from cookies
	 * Validates the access token and returns session data
	 * Automatically refreshes tokens if they are expired or about to expire
	 */
	async getSession(cookies: Cookies): Promise<Session | null> {
		const sessionData = cookies.get(COOKIE_NAME);
		console.log('[oidc-client] getSession called, cookie found:', !!sessionData);
		if (!sessionData) {
			return null;
		}

		try {
			const { session, refresh_token } = JSON.parse(sessionData) as {
				session: Session;
				refresh_token?: string;
			};

			// Validate session structure
			if (!session.person_uuid || !session.uuid || typeof session.expires_at !== 'number') {
				console.error('[oidc-client] Invalid session structure, clearing corrupt session');
				cookies.delete(COOKIE_NAME, this.getSessionCookieOptions());
				return null;
			}

			// Check if expired or about to expire (within 5 minutes)
			const now = Math.floor(Date.now() / 1000);
			const isExpired = session.expires_at < now;
			const isExpiringSoon = session.expires_at < now + 300; // 5 minutes

			// If expired or expiring soon, try to refresh
			if ((isExpired || isExpiringSoon) && refresh_token) {
				try {
					console.log('[oidc-client] Access token expiring, attempting refresh');
					const newTokens = await this.refreshAccessToken(refresh_token);
					await this.setSession(cookies, newTokens);
					// Return the newly refreshed session
					return await this.getSession(cookies);
				} catch (refreshError) {
					// Refresh failed, clear session
					const errorMsg = refreshError instanceof Error ? refreshError.message : String(refreshError);
					console.error('[oidc-client] Token refresh failed:', errorMsg);
					
					// If error is invalid_grant, the refresh token was revoked (e.g., context switched)
					if (errorMsg.includes('invalid_grant')) {
						console.log('[oidc-client] Refresh token revoked, clearing session for re-authentication');
					}
					
					cookies.delete(COOKIE_NAME, this.getSessionCookieOptions());
					return null;
				}
			}

			// Token is still valid, no refresh needed
			if (isExpired) {
				console.log('[oidc-client] Session expired, clearing');
				cookies.delete(COOKIE_NAME, this.getSessionCookieOptions());
				return null;
			}

			return session;
		} catch (parseError) {
			console.error('[oidc-client] Failed to parse session cookie:', parseError);
			cookies.delete(COOKIE_NAME, this.getSessionCookieOptions());
			return null;
		}
	}

	/**
	 * Get the access token from the session cookie
	 * Note: We no longer store full access tokens in cookies
	 * This method is deprecated and returns null
	 * @deprecated Use getSession() to get session claims instead
	 */
	getAccessToken(cookies: Cookies): string | null {
		return null;
	}

	/**
	 * Get a valid access token for server-to-server API calls
	 * Uses in-memory cache to avoid excessive refreshes
	 */
	async getValidAccessToken(cookies: Cookies): Promise<string | null> {
		const sessionCookie = cookies.get(COOKIE_NAME);
		if (!sessionCookie) {
			console.log('[oidc-client] getValidAccessToken: No session cookie found');
			return null;
		}

		try {
			const data = JSON.parse(sessionCookie);
			const { session, refresh_token } = data;
			
			if (!refresh_token || !session.uuid) {
				console.log('[oidc-client] getValidAccessToken: No refresh token or session UUID');
				return null;
			}

			// Check in-memory cache first
			const cached = accessTokenCache.get(session.uuid);
			if (cached) {
				const now = Math.floor(Date.now() / 1000);
				// Use cached token if it won't expire in the next 60 seconds
				if (cached.expires_at > now + 60) {
					return cached.token;
				}
			}

			// Not cached or expired, refresh it
			console.log('[oidc-client] getValidAccessToken: Refreshing access token');
			const tokens = await this.refreshAccessToken(refresh_token);
			
			// Cache the new access token
			const accessClaims = await verifyAccessToken(tokens.access_token, this.config.issuerUrl);
			if (accessClaims) {
				accessTokenCache.set(session.uuid, {
					token: tokens.access_token,
					expires_at: accessClaims.exp
				});
			}
			
			// If refresh token changed, update session
			if (tokens.refresh_token !== refresh_token) {
				await this.setSession(cookies, tokens);
			}
			
			return tokens.access_token;
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : String(err);
			console.error('[oidc-client] Failed to get valid access token:', errorMsg);
			
			// Clear corrupt session on error
			if (errorMsg.includes('invalid_grant') || errorMsg.includes('JSON')) {
				console.log('[oidc-client] Clearing corrupt session after error');
				cookies.delete(COOKIE_NAME, this.getSessionCookieOptions());
			}
			
			return null;
		}
	}

	/**
	 * Refresh the access token using a refresh token
	 */
	async refreshAccessToken(refreshToken: string): Promise<TokenSet> {
		const tokenResponse = await fetch(`${this.config.issuerUrl}/oauth/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
				client_id: this.config.clientId,
				...(this.config.clientSecret && { client_secret: this.config.clientSecret }),
			}),
		});

		if (!tokenResponse.ok) {
			const error = await tokenResponse.json();
			throw new Error(`Token refresh failed: ${error.error || tokenResponse.status}`);
		}

		return (await tokenResponse.json()) as TokenSet;
	}

	/**
	 * Clear the session (logout)
	 */
	clearSession(cookies: Cookies): void {
		// Clear access token from cache
		const sessionCookie = cookies.get(COOKIE_NAME);
		if (sessionCookie) {
			try {
				const data = JSON.parse(sessionCookie);
				if (data.session?.uuid) {
					accessTokenCache.delete(data.session.uuid);
				}
			} catch {
				// Ignore parse errors on logout
			}
		}
		
		cookies.delete(COOKIE_NAME, this.getSessionCookieOptions());
		cookies.delete(PKCE_COOKIE_NAME, { path: '/' });
		cookies.delete(STATE_COOKIE_NAME, { path: '/' });
	}

	/**
	 * Check if a user has a specific permission
	 */
	hasPermission(session: Session, app: string, permission: string): boolean {
		return session.permissions.some((p) => p.app === app && p.permission === permission);
	}
}
