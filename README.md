# Ben Franklin Society

The Work Shall Not Be Lost

Software for deliberative democratic governance and community services.

## What is This?

The Ben Franklin Society is a platform for communities to govern themselves through structured deliberation and sortition (random selection). It draws inspiration from the great mutual aid societies of the early 20th century—the Odd Fellows, the Grange, fraternal lodges, and neighborhood cooperatives that helped millions of Americans weather the Great Depression through collective action and democratic self-governance. This project aims to breathe new life into that tradition, adapting these time-tested principles to meet the challenges we face today: economic precarity, social atomization, and the erosion of genuine democratic participation.

The system provides:

- **Sortition-based governance**: Random selection for legislative bodies (like jury duty for governance)
- **Structured deliberation**: A motion system designed to give people time to think, discuss, and decide thoughtfully
- **Community services**: Integrated banking, mail, and marketplace applications
- **Formal organization**: Roles, sections, and hierarchies with clear mandates and accountability
- **Complete record**: Every decision, discussion, and action is permanently recorded

### Core Philosophy

This system is built on the premise that ordinary people, given adequate time and structured deliberation with their peers, can make reasonable, thoughtful, and nuanced collective decisions. Rather than assuming citizens need to be managed by political professionals, it creates the conditions for genuine democratic self-governance.

### Key Features

**Sortition System**
- General Assembly: 12 randomly-selected citizens serving year-long terms
- Committees: Specialized bodies drawn from relevant colleges or the whole community
- No elections, no campaigns, no political theater—just citizens doing their civic duty

**Motion & Deliberation**
- Draft → Introduced → Deliberation → Vote → Enacted/Rejected
- Discussion on every motion throughout the process
- Configurable vote rules (majority, supermajority, quorum requirements)
- Full voting record and audit trail

**Organization Structure**
- Services (Food, Agriculture, Energy, etc.) with formal sections and mandates
- Colleges (professional/vocational groups)
- Committees (permanent and ad hoc)
- Hierarchical roles with clear responsibilities and compensation

**Integrated Services**
- Community banking with lending and deposits
- Internal mail system
- Marketplace for goods and services
- All authenticated through the governance system

**Offline-First Design**
- Banking operates with physical branches, passbooks, and paper slips
- System functions completely without internet access
- Digital ledger reconciles with paper records when connectivity returns
- No dependency on continuous network access

## Quick Start

   A`Q### Two Deployment Types

BFS has two distinct deployment modes:

**Society Deployment**: Full BFS stack for a single community (governance + services)
- Apps: governance, community-bank, mail, marketplace, library
- Each society runs on its own server
- For: Community administrators

**Federation Deployment**: Network-wide discovery registry (separate server)
- App: federation (single API service)
- Runs on centralized infrastructure
- For: Network coordinators
- See: [Federation README](apps/federation/README.md) and [Deployment Guide](docs/architectural/deployment.md)

---

### Society Deployment (Docker)

**One-Command Bootstrap**

Deploy to a fresh Ubuntu 22.04 LTS server (DigitalOcean, Hetzner, etc.) with a single command:

```bash
curl -fsSL https://raw.githubusercontent.com/cirodam/Ben-Franklin-Society/master/scripts/bootstrap-droplet.sh | \
  sudo DOMAIN=bfsathensga.org ACME_EMAIL=contact@tylerdteague.com bash
```

> **Recommended OS**: Ubuntu 22.04 LTS (most stable with Docker). Avoid Ubuntu 24.04 due to AppArmor compatibility issues.

Then start services:
```bash
cd /opt/bfs && ./start.sh
```

This will:
- Install Docker and configure firewall
- Pull pre-built images from Docker Hub
- Generate all OIDC secrets and keys
- Configure SSL certificates (Let's Encrypt)
- Create helper scripts (start.sh, stop.sh, logs.sh, backup.sh)

**DNS Setup Required:**

Point these A records to your server IP:
- governance.yourdomain.com
- bank.yourdomain.com
- mail.yourdomain.com
- marketplace.yourdomain.com
- library.yourdomain.com

Or use a wildcard: `*.yourdomain.com`

Optionally, point the root domain (yourdomain.com) to your server IP for automatic redirect to governance.

**Initialize Your Society:**

After services start (~2 minutes for SSL), visit:
- https://governance.yourdomain.com/setup

Applications will be available at:
- **Governance**: https://governance.yourdomain.com
- **Community Bank**: https://bank.yourdomain.com
- **Mail**: https://mail.yourdomain.com
- **Marketplace**: https://marketplace.yourdomain.com

For detailed deployment documentation, see **[DOCKER.md](DOCKER.md)**.

---

### Federation Deployment (Docker)

**One-Command Bootstrap**

Deploy the federation registry to a fresh Ubuntu 22.04 LTS server:

```bash
# Download and run bootstrap script
wget https://raw.githubusercontent.com/cirodam/Ben-Franklin-Society/master/scripts/bootstrap-federation-droplet.sh
sudo bash bootstrap-federation-droplet.sh
```

Or as a one-liner:

```bash
curl -fsSL https://raw.githubusercontent.com/cirodam/Ben-Franklin-Society/master/scripts/bootstrap-federation-droplet.sh | sudo bash
```

Then start services:
```bash
cd /opt/bfs-federation && ./start.sh
```

This will:
- Install Docker and configure firewall (ports 22, 80)
- Download federation compose file and Caddyfile
- Pull pre-built federation image from Docker Hub
- Create helper scripts (start.sh, stop.sh, restart.sh, logs.sh)

**Access via IP Address:**

The federation registry will be accessible at:
- **http://YOUR_SERVER_IP**

No domain name or SSL required. To find your server's IP:
```bash
ip addr show
```

**Configure Societies:**

In each society's governance app, add the federation server:
1. Go to **Federation** → **Servers**
2. Add server with URL: `http://YOUR_FEDERATION_IP`
3. Click **Register** to join the network

---

### Development Setup (Local)

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

## Project Structure

### Applications

This is a monorepo containing multiple SvelteKit applications that work together:

**governance** — The core identity and governance system
- Identity provider (OIDC server)
- Sortition and seat management
- Motion system with deliberation and voting
- Roles, permissions, and organizational structure
- Community record and audit log
- Document management

**community-bank** — Local banking services
- Member accounts with deposits and lending
- Transaction history
- Integration with governance identity

**mail** — Internal communication
- Person-to-person messaging
- Threaded conversations
- Authenticated through governance

**marketplace** — Goods and services exchange
- Listings and transactions
- Integrated with community banking
- Member-only access

**federation** — Inter-society communication (planned)
- Federation between multiple BFS communities
- Cross-community trade and coordination

### Shared Packages

- **@bfs/db**: SQLite database utilities and helpers
- **@bfs/types**: Shared TypeScript types across all apps
- **@bfs/ui**: Common UI components (buttons, cards, badges, etc.)
- **@bfs/crypto**: Cryptographic utilities for signing and verification
- **@bfs/events**: Event system for cross-application communication
- **@bfs/oidc-client**: OAuth 2.0 client library for satellite apps

## Technical Architecture

### Design Principles

**Simplicity over scale** — SQLite databases, no microservices, direct SQL queries. This is designed for communities of hundreds to low thousands, not millions.

**Data sovereignty** — Every community runs its own instance. No central authority, no SaaS vendor lock-in.

**Permanent record** — Nothing is ever deleted. Motions, votes, discussions, and decisions are recorded for perpetuity.

**Strong authentication** — OAuth 2.0 with PKCE, EdDSA signatures, refresh token rotation. Identity is centralized in the governance app.

### Stack

- **pnpm workspaces** for dependency management
- **Turborepo** for build orchestration  
- **SvelteKit 5** for all applications (with runes)
- **SQLite** for data persistence (better-sqlite3)
- **TypeScript** throughout
- **OAuth 2.0 + PKCE** for authentication
- **EdDSA (Ed25519)** for JWT signing

### Data Model Highlights

**Sortition System**
- `sortition_body_config`: Configuration for GA/committees (seat count, term length)
- `seat`: Fixed numbered seats (never deleted)
- `seat_term`: Who holds each seat during what period
- `sortition`: Records each lottery draw event

**Motion System**
- `motion`: Proposal with title, body, reasoning, status, vote rule
- `motion_vote_tally`: Real-time vote counts (aye/nay/abstain)
- `motion_vote_receipt`: Individual vote records (anonymized)
- `motion_comment`: Discussion thread on each motion

**Organization**
- `association`: Generic container (services, colleges, committees, GA)
- `org_section`: Hierarchical sections with mandates
- `role`: Positions within associations linked to sections
- `person_role`: Who holds which roles

**Permissions**
- Role-based permissions stored directly on roles
- JWT tokens contain all permissions (no database lookups on each request)
- Granular permissions for motions, votes, roles, documents, etc.

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

- `pnpm dev` — Start all apps in development mode
- `pnpm build` — Build all apps for production
- `pnpm check` — Type check all apps
- `pnpm lint` — Lint all apps
- `pnpm reset` — Reset all databases (development only)
- `pnpm start` — Start all apps with turbo

### Building and Publishing Docker Images

**Society Apps** (governance, community-bank, mail, marketplace):

```bash
# Build and push all society applications
./scripts/publish-images.sh cirodam 1.0.0

# Build specific app only
cd apps/governance && docker build -t cirodam/ben-franklin-society-governance:1.0.0 .
docker push cirodam/ben-franklin-society-governance:1.0.0
```

**Federation Registry** (standalone service):

```bash
# Build and publish federation image
cd apps/federation
docker build -t cirodam/ben-franklin-society-federation:latest .
docker push cirodam/ben-franklin-society-federation:latest

# Deploy to federation server
sudo bash scripts/bootstrap-federation-droplet.sh
```

The federation registry requires a separate server and uses [docker-compose.federation.yml](docker-compose.federation.yml) for deployment.

### Project Layout

```
apps/
  governance/        # Core governance and identity system
  community-bank/    # Banking application
  mail/             # Mail system
  marketplace/      # Marketplace
  federation/       # Inter-society federation (planned)

packages/
  db/               # Database utilities
  types/            # Shared TypeScript types
  ui/               # UI component library
  crypto/           # Cryptographic helpers
  events/           # Event system
  oidc-client/      # OAuth client

docs/
  architectural/    # Technical architecture docs
  conceptual/       # Philosophy and design principles
```

### Key Conventions

**Database queries** — Direct SQL with better-sqlite3, no ORM. Queries live in `src/lib/server/*.ts` modules.

**Server functions** — All data access through server-side functions. Never query the database from components.

**Types first** — Define TypeScript interfaces for all database tables. Export from server modules.

**Permanent record** — Use `removed_at` / `deleted_at` timestamps instead of DELETE. Nothing is ever truly deleted.

**UUID primary keys** — All tables use TEXT PRIMARY KEY with UUIDs (via `randomUUID()`).

**Timestamps** — ISO 8601 strings (`new Date().toISOString()`) stored as TEXT.

## Authentication & Security

### OAuth 2.0 Flow

The governance app acts as an identity provider for all other applications:

1. User visits satellite app (e.g., Community Bank)
2. App redirects to governance `/oauth/authorize` with PKCE challenge
3. User logs in at governance (if not already authenticated)
4. User approves access (consent screen)
5. Governance redirects back with authorization code
6. Satellite exchanges code for tokens (access + refresh + ID)
7. Satellite validates JWT locally for all subsequent requests
8. Access tokens auto-refresh when expiring

### Security Features

- **PKCE (RFC 7636)** — Protects against authorization code interception
- **EdDSA signatures** — JWT tokens signed with Ed25519 keys
- **Refresh token rotation** — Old tokens revoked when new ones issued
- **Permission claims** — All permissions embedded in JWT (zero API calls for authorization)
- **HTTP-only cookies** — Tokens stored in secure, SameSite cookies
- **Setup wizards** — Guided configuration for new deployments

### Environment Variables

**Governance app:**
```env
DATABASE_PATH=./dev.sqlite
OIDC_PRIVATE_KEY=<base64-encoded-ed25519-key>  # Auto-generated if not set
```

**Satellite apps:**
```env
GOVERNANCE_URL=http://localhost:5173
OIDC_CLIENT_ID=<app-name>
OIDC_CLIENT_SECRET=<secret>
OIDC_REDIRECT_URI=http://localhost:<port>/oauth/callback
```

Configuration is created through the web UI setup wizards on first launch.

## Documentation

- **Conceptual docs**: `docs/conceptual/` — Philosophy, principles, and design rationale
- **Architecture docs**: `docs/architectural/` — Technical design, data models, and implementation details
- **Code comments**: Inline documentation in server modules

### Key Architectural Documents

- `docs/conceptual/0 - intellectual-foundation.md` — Core premises and philosophy
- `docs/architectural/governance_app/governance_app.md` — Governance system overview
- `docs/architectural/sortition/sortition.md` — Sortition implementation
- `docs/architectural/data_model/` — Detailed schema documentation

## License

[To be determined]

---

**Note**: This is experimental software for communities exploring alternatives to conventional governance structures. It is not production-ready and should be used only for experimentation and development.
