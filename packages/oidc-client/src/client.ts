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
		
		// Store lightweight session data (claims + refresh token only)
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

			// Check if expired or about to expire (within 5 minutes)
			const now = Math.floor(Date.now() / 1000);
			const isExpired = session.expires_at < now;
			const isExpiringSoon = session.expires_at < now + 300; // 5 minutes

			// If expired or expiring soon, try to refresh
			if ((isExpired || isExpiringSoon) && refresh_token) {
				try {
					const newTokens = await this.refreshAccessToken(refresh_token);
					await this.setSession(cookies, newTokens);
					// Return the newly refreshed session
					return await this.getSession(cookies);
				} catch (refreshError) {
					// Refresh failed, clear session
					console.error('[oidc-client] Token refresh failed:', refreshError);
					cookies.delete(COOKIE_NAME, this.getSessionCookieOptions());
					return null;
				}
			}

			// Token is still valid, no refresh needed
			if (isExpired) {
				cookies.delete(COOKIE_NAME, this.getSessionCookieOptions());
				return null;
			}

			return session;
		} catch {
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
	 * Uses the stored refresh token to obtain a fresh access token
	 */
	async getValidAccessToken(cookies: Cookies): Promise<string | null> {
		const sessionCookie = cookies.get(COOKIE_NAME);
		if (!sessionCookie) {
			return null;
		}

		try {
			const data = JSON.parse(sessionCookie);
			if (!data.refresh_token) {
				return null;
			}

			// Use refresh token to get fresh access token
			const tokens = await this.refreshAccessToken(data.refresh_token);
			return tokens.access_token;
		} catch (err) {
			console.error('[oidc-client] Failed to get valid access token:', err);
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
