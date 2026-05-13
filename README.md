# BFS (Ben Franklin Society)

Monorepo for the Ben Franklin Society governance and service applications.

## Quick Start

### Development Setup

1. Reset databases (development only):
   ```bash
   pnpm reset
   ```

2. Start all apps:
   ```bash
   pnpm start
   ```

3. Visit governance at http://localhost:5173
   - On first launch, you'll be redirected to `/setup`
   - Create the founder account with your credentials

4. Configure OIDC clients:
   - Go to **Settings** → **OIDC Clients**
   - Click the quick-setup buttons for Community Bank, Mail, and Marketplace
   - Copy each client secret

5. Configure each satellite app:
   - Visit the app (e.g., http://localhost:5174)
   - You'll be redirected to `/oidc-setup`
   - Paste the governance URL and client secret
   - Click **Save Configuration**
   - The app will be ready immediately (no restart needed)

Applications will be available at:
- **Governance**: http://localhost:5173
- **Community Bank**: http://localhost:5174
- **Mail**: http://localhost:5175
- **Marketplace**: http://localhost:5176

## Architecture

This is a monorepo using:
- **pnpm workspaces** for dependency management
- **Turborepo** for build orchestration
- **SvelteKit 2** for all applications
- **SQLite** for data persistence
- **OAuth 2.0 + PKCE** for authentication

### Applications

- **governance**: Identity provider and governance system
- **community-bank**: Community banking service
- **mail**: Internal mail system
- **marketplace**: Goods and services marketplace
- **federation**: Inter-society federation (planned)

### Shared Packages

- **@bfs/db**: SQLite database utilities
- **@bfs/types**: Shared TypeScript types
- **@bfs/ui**: Shared UI components
- **@bfs/crypto**: Cryptographic utilities
- **@bfs/events**: Event system
- **@bfs/oidc-client**: OAuth 2.0 client library

## Development

### Available Scripts

- `pnpm dev`: Start all apps in development mode
- `pnpm build`: Build all apps for production
- `pnpm check`: Type check all apps
- `pnpm lint`: Lint all apps
- `pnpm reset`: Reset all databases (development only)
- `pnpm start`: Start all apps with turbo

### Environment Variables

Each satellite app requires OIDC configuration (created via setup wizards):

```env
GOVERNANCE_URL=http://localhost:5173
OIDC_CLIENT_ID=<app-name>
OIDC_CLIENT_SECRET=<secret>
OIDC_REDIRECT_URI=http://localhost:<port>/oauth/callback
```

Governance app requires:

```env
DATABASE_PATH=./dev.sqlite
OIDC_PRIVATE_KEY=<base64-encoded-ed25519-key>  # Optional: auto-generated if not set
```

## Authentication Flow

1. User visits satellite app (e.g., Community Bank)
2. App redirects to governance `/oauth/authorize` with PKCE challenge
3. User logs in at governance (if not already authenticated)
4. User approves access (consent screen)
5. Governance redirects back to satellite with authorization code
6. Satellite exchanges code for tokens (access + refresh + ID)
7. Satellite validates JWT locally for all subsequent requests
8. Access tokens auto-refresh when expiring (within 5 minutes)

## Security Features

- **PKCE (RFC 7636)**: Protects against authorization code interception
- **EdDSA signatures**: JWT tokens signed with Ed25519
- **Refresh token rotation**: Old tokens revoked when new ones issued
- **Permission claims**: All permissions embedded in JWT (zero API calls)
- **Secure token storage**: HTTP-only cookies with SameSite protection
- **Setup wizards**: Guided configuration for satellite apps

## License

[To be determined]
