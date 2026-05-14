# The Ben Franklin Society
## Deployment Guide
### Docker & Production Infrastructure

---

## Overview

The BFS application suite is deployed as containerized services behind a unified domain. Each application (governance, community bank, mail, marketplace) runs in its own Docker container with isolated storage, communicating via HTTP APIs.

---

## Architecture

### Domain Structure

All applications are served from subdomains of a single root domain:

```
governance.bfs.example.com  → Governance app (OIDC provider)
bank.bfs.example.com        → Community Bank
mail.bfs.example.com        → Mail
marketplace.bfs.example.com → Marketplace
```

### Network Topology

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

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Domain with DNS control
- Ports 80, 443 open to internet

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
```

Or use a wildcard:

```
*.bfs.example.com → A record → <server-ip>
```

4. **Build and start services:**

```bash
docker-compose build
docker-compose up -d
```

5. **Monitor startup:**

```bash
docker-compose logs -f
```

Wait for Let's Encrypt to provision certificates (may take 1-2 minutes).

6. **Initial setup:**

Visit `https://governance.bfs.example.com/setup` to initialize the governance database and create the first administrator account.

---

## Operations

### Starting Services

```bash
docker-compose up -d
```

### Stopping Services

```bash
docker-compose down
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f governance
```

### Restarting a Service

```bash
docker-compose restart governance
```

### Rebuilding After Code Changes

```bash
docker-compose build governance
docker-compose up -d governance
```

### Accessing Traefik Dashboard

Visit `http://<server-ip>:8080` (not exposed publicly by default).

---

## Backup & Recovery

### Database Backup

```bash
# Backup all databases
docker run --rm -v bfs_governance-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/governance-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v bfs_community-bank-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/bank-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v bfs_mail-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/mail-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v bfs_marketplace-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/marketplace-$(date +%Y%m%d).tar.gz -C /data .
```

### Database Restore

```bash
# Stop services first
docker-compose down

# Restore from backup
docker run --rm -v bfs_governance-data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/governance-20260514.tar.gz -C /data

# Restart services
docker-compose up -d
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

1. **Split docker-compose.yml per machine**
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
docker-compose logs traefik

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
docker-compose restart governance
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
# Use development compose file
docker-compose -f docker-compose.dev.yml up

# Or use pnpm directly
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
