# Docker Deployment Quick Start

This directory contains everything needed to deploy the BFS application suite with Docker.

## Files

- **docker-compose.dev.yml** - Local development (direct port access, no SSL)
- **docker-compose.published.yml** - Production with published DockerHub images
- **.env.example** - Environment variable template (copy to .env)
- **apps/*/Dockerfile** - Multi-stage build configurations for each app
- **.dockerignore** - Files excluded from Docker build context
- **scripts/backup.sh** - Automated backup script for data volumes
- **scripts/bootstrap-droplet.sh** - Automated production deployment script

## Quick Start

Choose your deployment mode:

### Production Deployment (Published Images)

Use published images from DockerHub for production deployments:

### 1. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Generate OIDC secrets
openssl rand -hex 32  # For BANK_OIDC_SECRET
openssl rand -hex 32  # For MAIL_OIDC_SECRET
openssl rand -hex 32  # For MARKETPLACE_OIDC_SECRET
openssl rand -hex 32  # For LIBRARY_OIDC_SECRET

# Edit .env with your domain and secrets
nano .env
```

### 2. Configure DNS

Point your domain records to your server:

```
governance.bfs.example.com  → A record → <server-ip>
bank.bfs.example.com        → A record → <server-ip>
mail.bfs.example.com        → A record → <server-ip>
marketplace.bfs.example.com → A record → <server-ip>
library.bfs.example.com     → A record → <server-ip>
```

Or use wildcard: `*.bfs.example.com → A record → <server-ip>`

### 3. Pull and Start

```bash
# Pull published images from DockerHub
docker compose -f docker-compose.published.yml pull

# Start services
docker compose -f docker-compose.published.yml up -d

# Monitor startup
docker compose -f docker-compose.published.yml logs -f
```

Let's Encrypt will automatically provision SSL certificates (may take 1-2 minutes).

### 4. Initial Setup

Visit `https://governance.bfs.example.com/setup` to initialize and create the first admin account.

---

### Local Development

Use the development compose file for local testing without SSL:

```bash
# Start all services with direct port access
docker compose -f docker-compose.dev.yml up -d

# Access apps directly
# - http://localhost:5173 (governance)
# - http://localhost:5174 (community-bank)
# - http://localhost:5175 (mail)
# - http://localhost:5176 (marketplace)
# - http://localhost:5177 (library)
```

## Common Commands

### Production (published images)

```bash
# View logs
docker compose -f docker-compose.published.yml logs -f [service-name]

# Restart a service
docker compose -f docker-compose.published.yml restart governance

# Stop all services
docker compose -f docker-compose.published.yml down

# Update to latest images
docker compose -f docker-compose.published.yml pull
docker compose -f docker-compose.published.yml up -d

# Check service health
curl https://governance.bfs.example.com/health
```

### Development

```bash
# View logs
docker compose -f docker-compose.dev.yml logs -f [service-name]

# Restart a service
docker compose -f docker-compose.dev.yml restart governance

# Stop all services
docker compose -f docker-compose.dev.yml down

# Rebuild after code changes
docker compose -f docker-compose.dev.yml build [service-name]
docker compose -f docker-compose.dev.yml up -d [service-name]
```

## Backup & Restore

```bash
# Run backup script
./scripts/backup.sh

# Backups saved to ./backups/
ls -lh backups/

# Restore from backup (stop services first)
docker compose -f docker-compose.published.yml down
docker run --rm -v bfs_governance-data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/governance-YYYYMMDD.tar.gz -C /data
docker compose -f docker-compose.published.yml up -d
```

## Architecture

All apps run in isolated containers behind Traefik reverse proxy:

```
Internet → Traefik (SSL) → Docker Network → Individual Apps
                                           ↓
                                      Data Volumes
```

Each app:
- Has isolated SQLite database
- Communicates via HTTP APIs
- Uses OIDC for authentication (governance = provider)
- Auto-restarts on failure
- Health checks every 30s

## Troubleshooting

### Certificate Issues

```bash
# Check Traefik logs
docker compose -f docker-compose.published.yml logs reverse-proxy

# Verify DNS
dig governance.bfs.example.com
```

### Service Won't Start

```bash
# Check service logs
docker compose -f docker-compose.published.yml logs governance

# Verify environment variables
docker compose -f docker-compose.published.yml config

# Restart service
docker compose -f docker-compose.published.yml restart governance
```

### Database Locked

```bash
# Restart affected service
docker compose -f docker-compose.published.yml restart governance
```

## Publishing Images to Docker Hub

### Building and Publishing

To publish images to Docker Hub (maintainers only):

```bash
# 1. Log in to Docker Hub
docker login

# 2. Build and push all images at once
./scripts/publish-images.sh

# This will publish:
# - cirodam/ben-franklin-society-governance:0.1.0
# - cirodam/ben-franklin-society-community-bank:0.1.0
# - cirodam/ben-franklin-society-mail:0.1.0
# - cirodam/ben-franklin-society-marketplace:0.1.0
# - (and :latest tags for each)
```

### Using Published Images

Instead of building from source, you can use published images:

```bash
# Set environment variables for published images
export DOCKER_USERNAME=cirodam
export VERSION=0.1.0

# Use the published images compose file
docker-compose -f docker-compose.published.yml up -d
```

Or create a `.env` file:

```bash
DOCKER_USERNAME=cirodam
VERSION=0.1.0
```

This pulls pre-built images instead of building locally, much faster for deployment.

## Full Documentation

See [docs/architectural/deployment.md](docs/architectural/deployment.md) for complete deployment documentation.
