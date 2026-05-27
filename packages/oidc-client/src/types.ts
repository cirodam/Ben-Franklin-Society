/**
 * OIDC Client TypeScript type definitions
 */

export interface OidcClientConfig {
	/** The OIDC issuer URL (governance server) */
	issuerUrl: string;
	/** OAuth 2.0 client ID */
	clientId: string;
	/** OAuth 2.0 client secret (optional for public clients) */
	clientSecret?: string;
	/** The redirect URI for this application */
	redirectUri: string;
}

export interface TokenSet {
	access_token: string;
	id_token: string;
	token_type: 'Bearer';
	expires_in: number;
	refresh_token?: string; // Optional for refresh token flow
}

export interface AccessTokenClaims {
	iss: string;
	sub: string; // person_uuid
	aud: string; // client_id
	iat: number;
	exp: number;
	jti: string;
	client_id: string;
	acting_as: string; // association UUID, or same as sub when acting as self
	session_uuid: string; // session UUID for updating context
	permissions: Array<{ app: string; permission: string }>;
	scope: string;
}

export interface IdTokenClaims {
	iss: string;
	sub: string;
	aud: string;
	iat: number;
	exp: number;
	handle: string;
	given_name: string;
	family_name: string;
	acting_as: string;
	contexts?: Array<{ uuid: string; type: string; label: string }>;
}

export interface Session {
	uuid: string;
	person_uuid: string;
	acting_as_uuid: string;
	handle: string;
	given_name: string;
	family_name: string;
	permissions: Array<{ app: string; permission: string }>;
	contexts?: Array<{ uuid: string; type: string; label: string }>;
	expires_at: number; // Unix timestamp
}

export interface PKCEChallenge {
	codeVerifier: string;
	codeChallenge: string;
}

export interface AuthorizationParams {
	clientId: string;
	redirectUri: string;
	scope: string;
	state: string;
	codeChallenge: string;
}
