# The Ben Franklin Society
## Deployment Guide
### Docker & Production Infrastructure

---

## Overview

The BFS application suite consists of two distinct deployment types:

1. **Society Deployments** - Each individual society runs its own server with governance, community bank, mail, marketplace, and library applications
2. **Federation Registry** - A single centralized discovery service that tracks all societies in the network

Each deployment type uses Docker containers with isolated storage, communicating via HTTP APIs.

---

## Deployment Types

### Society Server Deployment

Each society operates its own server with a complete stack of BFS applications behind a unified domain. Applications run in isolated Docker containers:

```
governance.society.example.com  → Governance app (OIDC provider)
bank.society.example.com        → Community Bank
mail.society.example.com        → Mail
marketplace.society.example.com → Marketplace
library.society.example.com     → Library
```

**Use:** `docker-compose.published.yml` or `docker-compose.dev.yml`

### Federation Registry Deployment

The federation registry is a standalone service deployed on a separate server. It provides:
- Society discovery and lookup
- Cryptographic lineage verification
- Network statistics and metrics
- Florens issuance tracking

```
federation.bfs.network → Federation Registry API
```

**Use:** `docker-compose.federation.yml`

**Important:** The federation server must run independently from any individual society server.

---

## Architecture

### Society Domain Structure

All applications for a society are served from subdomains of a single root domain:

```
governance.bfs.example.com  → Governance app (OIDC provider)
bank.bfs.example.com        → Community Bank
mail.bfs.example.com        → Mail
marketplace.bfs.example.com → Marketplace
library.bfs.example.com     → Library
```

### Society Network Topology

```
┌─────────────────────────────────────────────┐
│  Reverse Proxy (Traefik)                    │
│  - SSL termination (*.bfs.example.com)      │
│  - Route by subdomain to backend services   │
│  - Port 443 exposed to internet             │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │   Docker Network   │
        │   (bfs-network)    │
        └─────────┬──────────┘
                  │
    ┌─────────────┼─────────────┬─────────────┐
    │             │             │             │
┌───▼────┐  ┌────▼────┐  ┌─────▼────┐  ┌────▼─────┐
│Gov:5173│  │Bank:5174│  │Mail:5175 │  │Market:5176│
└────┬───┘  └────┬────┘  └─────┬────┘  └────┬─────┘
     │           │              │             │
  ┌──▼──┐    ┌──▼──┐       ┌──▼──┐      ┌──▼──┐
  │Vol 1│    │Vol 2│       │Vol 3│      │Vol 4│
  └─────┘    └─────┘       └─────┘      └─────┘
```

### Storage Strategy

Each application has an isolated Docker volume:

- **governance-data**: `governance.db` + `documents/*.json`
- **community-bank-data**: `bank.db`
- **mail-data**: `mail.db`
- **marketplace-data**: `marketplace.db`

Volumes mount to `/app/data` within each container.

---

## Deployment

### Prerequisites (All Deployments)

- Docker Engine 20.10+
- Docker Compose 2.0+
- Domain with DNS control
- Ports 80, 443 open to internet

---

## Society Server Deployment

Deploy a complete BFS society with all applications on a single server.

### Initial Setup

1. **Clone repository and configure environment:**

```bash
git clone <repository-url> bfs
cd bfs
cp .env.example .env
```

2. **Edit `.env` file with your domain and secrets:**

```bash
# Generate OIDC secrets
openssl rand -hex 32  # Use output for BANK_OIDC_SECRET
openssl rand -hex 32  # Use output for MAIL_OIDC_SECRET
openssl rand -hex 32  # Use output for MARKETPLACE_OIDC_SECRET
openssl rand -hex 32  # Use output for LIBRARY_OIDC_SECRET

# Edit .env
nano .env
```

3. **Configure DNS records:**

Point all subdomains to your server's public IP:

```
governance.bfs.example.com  → A record → <server-ip>
bank.bfs.example.com        → A record → <server-ip>
mail.bfs.example.com        → A record → <server-ip>
marketplace.bfs.example.com → A record → <server-ip>
library.bfs.example.com     → A record → <server-ip>
```

Or use a wildcard:

```
*.bfs.example.com → A record → <server-ip>
```

4. **Pull and start services:**

```bash
# For production deployment using published images
docker compose -f docker-compose.published.yml pull
docker compose -f docker-compose.published.yml up -d
```

5. **Monitor startup:**

```bash
docker compose -f docker-compose.published.yml logs -f
```

Wait for Let's Encrypt to provision certificates (may take 1-2 minutes).

6. **Initial setup:**

Visit `https://governance.bfs.example.com/setup` to initialize the governance database and create the first administrator account.

7. **Register with Federation:**

After setup, register your society with the federation registry at `https://federation.bfs.network`.

---

## Federation Registry Deployment

Deploy the centralized discovery service on a separate server.

**Important:** The federation must run on a different server than any individual society.

### Initial Setup

1. **Clone repository and configure environment:**

```bash
git clone <repository-url> bfs-federation
cd bfs-federation
cp .env.federation.example .env
```

2. **Edit `.env` file with your domain:**

```bash
nano .env
```

Set:
```env
DOCKER_USERNAME=cirodam
VERSION=latest
FEDERATION_DOMAIN=federation.bfs.network
ACME_EMAIL=admin@example.com
```

3. **Configure DNS:**

Point federation domain to your server's public IP:

```
federation.bfs.network → A record → <server-ip>
```

4. **Pull and start service:**

```bash
docker compose -f docker-compose.federation.yml pull
docker compose -f docker-compose.federation.yml up -d
```

5. **Monitor startup:**

```bash
docker compose -f docker-compose.federation.yml logs -f
```

6. **Verify deployment:**

Test the API:
```bash
curl https://federation.bfs.network/api/registry/stats
```

---

## Operations

### Starting Services

**Society Server:**
```bash
# Production (published images)
docker compose -f docker-compose.published.yml up -d

# Development (build from source)
docker compose -f docker-compose.dev.yml up -d
```

**Federation Registry:**
```bash
docker compose -f docker-compose.federation.yml up -d
```

### Stopping Services

**Society Server:**
```bash
# Production
docker compose -f docker-compose.published.yml down

# Development
docker compose -f docker-compose.dev.yml down
```

**Federation Registry:**
```bash
docker compose -f docker-compose.federation.yml down
```

### Viewing Logs

**Society Server:**
```bash
# All services (production)
docker compose -f docker-compose.published.yml logs -f

# Specific service (production)
docker compose -f docker-compose.published.yml logs -f governance
```

### Restarting a Service

```bash
# Production
docker compose -f docker-compose.published.yml restart governance

# Development
docker compose -f docker-compose.dev.yml restart governance
```

### Updating Production Images

```bash
# Pull latest images from DockerHub
docker compose -f docker-compose.published.yml pull
docker compose -f docker-compose.published.yml up -d
```

### Rebuilding After Code Changes (Development)

```bash
docker compose -f docker-compose.dev.yml build governance
docker compose -f docker-compose.dev.yml up -d governance
```

### Accessing Traefik Dashboard

Visit `http://<server-ip>:8080` (not exposed publicly by default).

---

## Backup & Recovery

### Database Backup

**Society Server:**
```bash
# Backup all databases
mkdir -p backups
docker run --rm -v bfs_governance-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/governance-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v bfs_community-bank-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/bank-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v bfs_mail-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/mail-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v bfs_marketplace-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/marketplace-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v bfs_library-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/library-$(date +%Y%m%d).tar.gz -C /data .
```

**Federation Registry:**
```bash
# Backup federation database
mkdir -p backups
docker run --rm -v bfs_federation-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/federation-$(date +%Y%m%d).tar.gz -C /data .
```

### Database Restore

**Society Server:**
```bash
# Stop services first
docker compose -f docker-compose.published.yml down

# Restore from backup
docker run --rm -v bfs_governance-data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/governance-20260524.tar.gz -C /data

# Restart services
docker compose -f docker-compose.published.yml up -d
```

**Federation Registry:**
```bash
# Stop service
docker compose -f docker-compose.federation.yml down

# Restore from backup
docker run --rm -v bfs_federation-data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/federation-20260524.tar.gz -C /data

# Restart service
docker compose -f docker-compose.federation.yml up -d
```

### Automated Backups

Add to crontab:

```cron
# Daily backups at 2 AM
0 2 * * * cd /path/to/bfs && ./scripts/backup.sh
```

---

## Security Considerations

### TLS/HTTPS

- Let's Encrypt certificates auto-renewed by Traefik
- HTTP automatically redirects to HTTPS
- HSTS headers recommended (configure in Traefik middleware)

### Secrets Management

- OIDC secrets stored in `.env` (never commit to git)
- Rotate secrets periodically
- Use Docker secrets in production (Swarm/Kubernetes)

### Network Isolation

- Apps communicate on internal Docker network
- Only reverse proxy exposes ports publicly
- Consider firewall rules for additional protection

### Database Security

- SQLite files only accessible within containers
- Volume permissions restrict host access
- Regular backups to separate storage

---

## Inter-Society Communication

When deploying as part of a federated network:

### Public API Endpoints

These endpoints must be publicly accessible for peer-to-peer communication:

```
# Community Bank
POST https://bank.bfs.example.com/api/inter-society/transfers

# Mail
POST https://mail.bfs.example.com/api/inter-society/messages
GET  https://mail.bfs.example.com/api/inter-society/handles/:handle
```

### Federation Registry

Register your society with the Federation:

```
POST https://federation.bfs.network/api/societies
{
  "handle": "your-society-handle",
  "endpoints": {
    "governance": "https://governance.bfs.example.com",
    "bank": "https://bank.bfs.example.com",
    "mail": "https://mail.bfs.example.com"
  },
  "public_key": "<society-public-key>",
  "coordinates": { "lat": 40.7128, "lon": -74.0060 }
}
```

---

## Monitoring & Health Checks

### Service Health

Each service exposes a health endpoint:

```bash
curl https://governance.bfs.example.com/health
curl https://bank.bfs.example.com/health
curl https://mail.bfs.example.com/health
curl https://marketplace.bfs.example.com/health
```

### Resource Monitoring

```bash
# Container resource usage
docker stats

# Disk usage
docker system df
```

### Alerts

Configure monitoring tools (Prometheus, Grafana, etc.) to alert on:
- Service downtime
- High CPU/memory usage
- Disk space warnings
- Certificate expiration

---

## Scaling & Distribution

### Multi-Machine Deployment

To run apps on separate machines:

1. **Split docker-compose.published.yml per machine**
2. **Update environment variables:**
   - Use public URLs for `GOVERNANCE_URL`
   - Apps communicate over internet instead of Docker network
3. **Update DNS to point subdomains to different IPs**
4. **Ensure firewall rules allow inter-machine communication**

### Load Balancing

For high-traffic deployments:
- Run multiple instances per app
- Use Traefik's load balancing features
- Consider Kubernetes for orchestration

---

## Troubleshooting

### Certificate Errors

```bash
# Check Traefik logs
docker compose -f docker-compose.published.yml logs reverse-proxy

# Verify DNS propagation
dig governance.bfs.example.com

# Manual cert request test
curl -v https://governance.bfs.example.com
```

### Database Locked Errors

SQLite with WAL mode should prevent most locking issues, but if they occur:

```bash
# Check for processes holding locks
docker exec <container> lsof /app/data/governance.db

# Restart the affected service
docker compose -f docker-compose.published.yml restart governance
```

### OIDC Authentication Issues

Check redirect URIs match exactly:

```bash
# In governance database
sqlite3 /path/to/governance.db "SELECT * FROM oidc_client WHERE client_id='community-bank';"
```

Ensure `redirect_uri` matches `PUBLIC_URL` in `.env`.

---

## Development vs Production

### Local Development

```bash
# Use development compose file (builds from source, direct port access)
docker compose -f docker-compose.dev.yml up

# Or use pnpm directly (faster for active development)
pnpm dev
```

### Production Hardening

- [ ] Remove Traefik dashboard port (8080) from public access
- [ ] Enable rate limiting middleware
- [ ] Configure log rotation
- [ ] Set up automated backups
- [ ] Configure monitoring/alerting
- [ ] Use Docker secrets instead of .env file
- [ ] Enable WAF (Web Application Firewall)
- [ ] Configure fail2ban or similar
