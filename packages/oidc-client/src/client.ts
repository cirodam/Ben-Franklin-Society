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
	 * Initiate the OIDC login flow
	 * Generates PKCE challenge and returns the authorization URL
	 * The caller should redirect to this URL using SvelteKit's redirect()
	 */
	initiateLogin(cookies: Cookies, returnPath?: string): string {
		const { codeVerifier, codeChallenge } = generatePKCEChallenge();
		const state = randomBytes(16).toString('base64url');

		// Store PKCE verifier and state in cookies (short-lived)
		const cookieOptions = {
			path: '/',
			httpOnly: true,
			sameSite: 'lax' as const,
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
	 * Store tokens in an encrypted cookie
	 */
	setSession(cookies: Cookies, tokens: TokenSet): void {
		const sessionData = JSON.stringify(tokens);
		cookies.set(COOKIE_NAME, sessionData, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: tokens.expires_in,
		});
	}

	/**
	 * Get the current session from cookies
	 * Validates the access token and returns session data
	 * Automatically refreshes tokens if they are expired or about to expire
	 */
	async getSession(cookies: Cookies): Promise<Session | null> {
		const sessionData = cookies.get(COOKIE_NAME);
		if (!sessionData) {
			return null;
		}

		try {
			const tokens = JSON.parse(sessionData) as TokenSet;

			// Verify access token
			const accessClaims = await verifyAccessToken(tokens.access_token, this.config.issuerUrl);
			
			// Check if expired or about to expire (within 5 minutes)
			const now = Math.floor(Date.now() / 1000);
			const isExpired = !accessClaims || accessClaims.exp < now;
			const isExpiringSoon = accessClaims && accessClaims.exp < now + 300; // 5 minutes

			// If expired or expiring soon, try to refresh
			if ((isExpired || isExpiringSoon) && tokens.refresh_token) {
				try {
					const newTokens = await this.refreshAccessToken(tokens.refresh_token);
					this.setSession(cookies, newTokens);
					// Parse the new tokens and continue
					const newAccessClaims = await verifyAccessToken(newTokens.access_token, this.config.issuerUrl);
					if (!newAccessClaims) {
						cookies.delete(COOKIE_NAME, { path: '/' });
						return null;
					}
					const newIdClaims = await verifyIdToken(newTokens.id_token, this.config.issuerUrl);
					if (!newIdClaims) {
						cookies.delete(COOKIE_NAME, { path: '/' });
						return null;
					}
					return {
						uuid: newAccessClaims.jti,
						person_uuid: newAccessClaims.sub,
						acting_as_uuid: newAccessClaims.acting_as,
						handle: newIdClaims.handle,
						given_name: newIdClaims.given_name,
						family_name: newIdClaims.family_name,
						permissions: newAccessClaims.permissions,
						expires_at: newAccessClaims.exp,
					};
				} catch (refreshError) {
					// Refresh failed, clear session
					console.error('[oidc-client] Token refresh failed:', refreshError);
					cookies.delete(COOKIE_NAME, { path: '/' });
					return null;
				}
			}

			// Token is still valid, no refresh needed
			if (!accessClaims) {
				cookies.delete(COOKIE_NAME, { path: '/' });
				return null;
			}

			// Verify ID token
			const idClaims = await verifyIdToken(tokens.id_token, this.config.issuerUrl);
			if (!idClaims) {
				cookies.delete(COOKIE_NAME, { path: '/' });
				return null;
			}

			// Build session object
			return {
				uuid: accessClaims.jti,
				person_uuid: accessClaims.sub,
				acting_as_uuid: accessClaims.acting_as,
				handle: idClaims.handle,
				given_name: idClaims.given_name,
				family_name: idClaims.family_name,
				permissions: accessClaims.permissions,
				expires_at: accessClaims.exp,
			};
		} catch {
			cookies.delete(COOKIE_NAME, { path: '/' });
			return null;
		}
	}

	/**
	 * Get the access token from the session cookie
	 * Returns null if no valid session exists
	 */
	getAccessToken(cookies: Cookies): string | null {
		const sessionData = cookies.get(COOKIE_NAME);
		if (!sessionData) {
			return null;
		}

		try {
			const tokens = JSON.parse(sessionData) as TokenSet;
			return tokens.access_token;
		} catch {
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
		cookies.delete(COOKIE_NAME, { path: '/' });
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
