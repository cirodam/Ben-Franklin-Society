# Federation Registry

The Federation Registry is a centralized discovery and coordination service for the Ben Franklin Society network. It provides a lightweight index for society discovery, lineage verification, and network statistics.

## Purpose

- **Discovery:** Find societies by handle, UUID, or lineage
- **Registry:** Track society URLs, IP addresses, and connectivity
- **Verification:** Validate cryptographic lineage chains
- **Metrics:** Aggregate network statistics (member counts, society count)
- **Issuance:** Track Florens issuance across the network

## Architecture

The federation is a **pure API service** with no user interface. It provides RESTful endpoints for:

- Society registration (`POST /api/registry/society`)
- Society lookup (`GET /api/registry/society/{handle}`)
- Lineage queries (`GET /api/registry/lineage/{handle}`)
- Network tree (`GET /api/registry/tree`)
- Statistics (`GET /api/registry/stats`)

## Deployment

**Important:** The federation registry must run on a **separate server** from any individual society deployment.

See [Deployment Guide](../../docs/architectural/deployment.md) for full instructions.

### Quick Start

```bash
# On federation server
cp .env.federation.example .env
nano .env  # Set FEDERATION_DOMAIN and ACME_EMAIL

docker compose -f docker-compose.federation.yml pull
docker compose -f docker-compose.federation.yml up -d
```

### Test Deployment

```bash
curl https://federation.bfs.network/api/registry/stats
```

## Database Schema

The federation maintains a SQLite database with:

- `societies` table: UUID, handle, parent relationships, public keys
- Multi-path connectivity (bfs_url, url, ip_address, port)
- Society metrics (people_count, person_years)
- Florens issuance tracking

## Port

- **5180** - Federation API service

## Environment Variables

- `DATABASE_PATH` - Path to federation.db (default: `/app/data/federation.db`)
- `NODE_ENV` - Node environment (default: `production`)
- `PORT` - Service port (default: `5180`)

## Development

```bash
# From monorepo root (recommended)
pnpm federation:start

# Or using script directly
./scripts/federation-start.sh

# Or from federation directory
cd apps/federation
pnpm dev
```

Service runs at `http://localhost:5180`

### Reset Database

```bash
# From monorepo root
pnpm federation:reset

# Or using script directly
./scripts/federation-reset.sh
```

## API Documentation

See [BFS Network Documentation](../../docs/architectural/bfs_network.md) for federation API details.
