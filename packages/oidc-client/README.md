# @bfs/oidc-client

OpenID Connect client library for BFS satellite applications.

## Overview

This package provides a reusable OIDC client implementation for satellite apps (community-bank, mail, marketplace) to authenticate users via the governance app (identity provider).

## Features

- **Authorization Code Flow with PKCE**: Secure OAuth 2.0 flow with proof key for code exchange
- **JWT Verification**: Local token validation using JWKS from the issuer
- **Session Management**: Secure cookie-based session storage
- **Permission Checking**: Built-in helpers for role-based access control

## Installation

```bash
pnpm add @bfs/oidc-client
```

## Usage

### 1. Configure the Client

Create a server-side OIDC client configuration:

```typescript
// src/lib/server/oidc.ts
import { OidcClient } from '@bfs/oidc-client';

const GOVERNANCE_URL = process.env.GOVERNANCE_URL || 'http://localhost:5173';

export const oidcClient = new OidcClient({
	issuerUrl: GOVERNANCE_URL,
	clientId: 'your-client-id', // From governance OIDC client registration
	clientSecret: 'your-client-secret', // Optional for public clients
	redirectUri: 'http://localhost:5174/oauth/callback',
});
```

### 2. Create OAuth Callback Route

Handle the OAuth callback after successful authentication:

```typescript
// src/routes/oauth/callback/+server.ts
import type { RequestHandler } from './$types';
import { oidcClient } from '$lib/server/oidc';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (!code || !state) {
		throw redirect(302, '/');
	}

	try {
		const { tokens, returnPath } = await oidcClient.handleCallback(code, state, cookies);
		oidcClient.setSession(cookies, tokens);
		throw redirect(302, returnPath);
	} catch (error) {
		console.error('OAuth callback error:', error);
		throw redirect(302, '/');
	}
};
```

### 3. Set Up Authentication Hook

Validate sessions on every request:

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { oidcClient } from '$lib/server/oidc';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = await oidcClient.getSession(event.cookies);
	return resolve(event);
};
```

### 4. Protect Routes

Require authentication in layout loaders:

```typescript
// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { oidcClient } from '$lib/server/oidc';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	if (!locals.session) {
		oidcClient.initiateLogin(cookies, url.pathname);
	}

	return {
		session: locals.session,
	};
};
```

### 5. Check Permissions

Use the permission helper in server-side code:

```typescript
import { oidcClient } from '$lib/server/oidc';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;

	if (!oidcClient.hasPermission(session, 'community-bank', 'accounts:read')) {
		throw error(403, 'Insufficient permissions');
	}

	// ... load protected data
};
```

## API Reference

### `OidcClient`

#### Constructor

```typescript
new OidcClient(config: OidcClientConfig)
```

#### Methods

- **`initiateLogin(cookies: Cookies, returnPath?: string): never`**  
  Start the OIDC login flow. Generates PKCE challenge and redirects to authorization endpoint.

- **`handleCallback(code: string, state: string, cookies: Cookies): Promise<{ tokens: TokenSet, returnPath: string }>`**  
  Exchange authorization code for tokens after callback.

- **`setSession(cookies: Cookies, tokens: TokenSet): void`**  
  Store tokens in a secure cookie.

- **`getSession(cookies: Cookies): Promise<Session | null>`**  
  Retrieve and validate the current session.

- **`clearSession(cookies: Cookies): void`**  
  Remove session cookies (logout).

- **`hasPermission(session: Session, app: string, permission: string): boolean`**  
  Check if a session has a specific permission.

### Types

See [src/types.ts](./src/types.ts) for full type definitions.

## Security Considerations

- **PKCE**: All authorization flows use PKCE (S256) to protect against code interception
- **JWT Verification**: Access tokens are verified locally using JWKS from the issuer
- **Secure Cookies**: Session cookies are httpOnly, sameSite=lax, and secure in production
- **State Parameter**: CSRF protection via random state parameter
- **Token Expiry**: Tokens are checked for expiration on every request

## Development

Type-check the package:

```bash
pnpm tsc --noEmit
```

## License

MIT
