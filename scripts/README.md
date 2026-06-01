# BFS Scripts

Development and deployment scripts for the platform.

## Two Workflows

BFS has two distinct operational modes that never overlap:

- **Society Workflow**: Running individual BFS societies (governance, banking, mail, marketplace, library)
- **Federation Workflow**: Operating the network-wide discovery registry

Use society scripts when working on society features. Use federation scripts when working on network coordination.

---

## Society Workflow

Scripts for developing and deploying individual BFS societies.

### start.sh
Start all society applications in development mode.

```bash
./scripts/start.sh
# Or: pnpm start
```

Launches: governance, community-bank, mail, marketplace, library at http://localhost:5173-5177

### reset.sh
Reset all society application databases to fresh state.

```bash
./scripts/reset.sh          # Reset databases only
./scripts/reset.sh --clean  # Also clear build artifacts
# Or: pnpm reset
```

### publish-images.sh
Build and publish Docker images for society applications.

```bash
./scripts/publish-images.sh <username> <version>
./scripts/publish-images.sh cirodam 0.1.0
# Or: pnpm publish:society cirodam 0.1.0
```

Builds and pushes: governance, community-bank, mail, marketplace, library

### bootstrap-droplet.sh
Automated society deployment to a fresh Ubuntu server.

```bash
curl -fsSL https://raw.githubusercontent.com/.../bootstrap-droplet.sh | \
  sudo DOMAIN=bfsathensga.org ACME_EMAIL=admin@example.com bash
```

See [bootstrap-droplet.sh documentation](#bootstrap-dropletsh) below for details.

---

## Federation Workflow

Scripts for developing and deploying the federation registry (network coordination).

### federation-start.sh
Start the federation registry in development mode (standalone).

```bash
./scripts/federation-start.sh
# Or: pnpm federation:start
```

Launches federation API at http://localhost:5180

### federation-reset.sh
Reset the federation registry database.

```bash
./scripts/federation-reset.sh
# Or: pnpm federation:reset
```

### publish-federation-images.sh
Build and publish Docker image for federation registry.

```bash
./scripts/publish-federation-images.sh <username> <version>
./scripts/publish-federation-images.sh cirodam 0.1.0
# Or: pnpm publish:federation cirodam 0.1.0
```

Builds and pushes: federation

**Note**: Federation has its own separate docker-compose.federation.yml and deployment process. See [docs/architectural/deployment.md](../docs/architectural/deployment.md) for federation deployment instructions.

---

## Detailed Documentation

### bootstrap-droplet.sh

Automated setup script for deploying BFS to a fresh Ubuntu droplet.

### What It Does

1. **System Setup**
   - Updates system packages
   - Installs Docker and Docker Compose
   - Configures firewall (UFW)

2. **Directory Structure**
   - Creates `/opt/bfs` as installation directory
   - Creates `backups/` subdirectory
   - Downloads `docker-compose.published.yml`

3. **Configuration**
   - Creates `.env` template with placeholders
   - Sets up default values (cirodam/latest)

4. **Helper Scripts**
   - `start.sh` - Pull images and start services
   - `stop.sh` - Stop all services
   - `logs.sh` - View service logs
   - `backup.sh` - Backup data volumes
   - `update.sh` - Pull latest images and restart

### Usage

#### One-Line Install (from GitHub)

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/BFS/main/scripts/bootstrap-droplet.sh | sudo bash
```

#### From Local Copy

```bash
sudo bash bootstrap-droplet.sh
```

#### With Environment Variables

```bash
DOMAIN=example.com DOCKER_USERNAME=myuser sudo -E bash bootstrap-droplet.sh
```

### After Bootstrap

1. **Configure DNS** - Point subdomains to droplet IP
2. **Edit .env** - Set domain, OIDC secrets, email
3. **Start services** - Run `/opt/bfs/start.sh`
4. **Initialize** - Visit `https://governance.your-domain.com/setup`

### Requirements

- Fresh Ubuntu 24.04 LTS droplet
- Root access
- Domain with DNS configured
- Minimum 2GB RAM

### Files Created

```
/opt/bfs/
├── docker-compose.published.yml
├── .env
├── start.sh
├── stop.sh
├── logs.sh
├── backup.sh
├── update.sh
└── backups/
```

### Environment Variables

The script respects these environment variables:

- `DOCKER_USERNAME` - Docker Hub username (default: cirodam)
- `VERSION` - Image version tag (default: latest)
- `DOMAIN` - Your domain name (default: empty, must be set manually)

### Troubleshooting

**Script fails to download docker-compose.published.yml:**
- Update the GitHub URL in the script to your actual repository
- Or copy the file manually to `/opt/bfs/`

**Permission denied:**
- Make sure to run with `sudo` or as root
- Check script is executable: `chmod +x bootstrap-droplet.sh`

**Docker commands fail:**
- Verify Docker is installed: `docker --version`
- Check Docker service is running: `systemctl status docker`

**Services won't start:**
- Check `.env` is configured: `cat /opt/bfs/.env`
- Verify DNS is propagated: `nslookup governance.your-domain.com`
- View logs: `/opt/bfs/logs.sh`
