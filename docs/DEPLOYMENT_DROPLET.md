# Deploying BFS to DigitalOcean Droplet

## Automated Setup (Recommended)

The fastest way to deploy is using the bootstrap script:

### 1. Create Droplet
- **Size**: 2GB RAM minimum (Basic $18/month works)
- **OS**: Ubuntu 24.04 LTS
- **Add your SSH key** during creation

### 2. Run Bootstrap Script

SSH into your droplet and run:
```bash
ssh root@your-droplet-ip

# Download and run bootstrap script
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/BFS/main/scripts/bootstrap-droplet.sh | bash
```

Or if you have the repo locally:
```bash
curl -fsSL https://path-to-your-script/bootstrap-droplet.sh | bash
```

The script will:
- ✓ Install Docker and Docker Compose
- ✓ Set up firewall (SSH, HTTP, HTTPS)
- ✓ Create `/opt/bfs` directory
- ✓ Download docker-compose.published.yml
- ✓ Create .env template
- ✓ Create helper scripts (start.sh, stop.sh, logs.sh, backup.sh, update.sh)

### 3. Configure Environment

Edit the configuration file:
```bash
cd /opt/bfs
nano .env
```

Set these required values:
```bash
DOMAIN=your-domain.com              # Your domain (without https://)
BANK_OIDC_SECRET=...                # Generate with: openssl rand -hex 32
MAIL_OIDC_SECRET=...                # Generate with: openssl rand -hex 32
MARKETPLACE_OIDC_SECRET=...         # Generate with: openssl rand -hex 32
ACME_EMAIL=admin@your-domain.com    # For Let's Encrypt SSL
```

### 4. Configure DNS

Point your domain to the droplet IP:
```
governance.your-domain.com → A record → your-droplet-ip
bank.your-domain.com       → A record → your-droplet-ip
mail.your-domain.com       → A record → your-droplet-ip
marketplace.your-domain.com → A record → your-droplet-ip
```

Or use wildcard: `*.your-domain.com → A record → your-droplet-ip`

### 5. Start Services

```bash
cd /opt/bfs
./start.sh
```

Monitor the logs:
```bash
./logs.sh
```

Wait for Let's Encrypt to provision SSL certificates (1-2 minutes).

### 6. Initialize

Visit `https://governance.your-domain.com/setup` to create your society and first admin account.

---

## Manual Setup Guide

### 1. Create Droplet
- **Size**: 2GB RAM minimum (Basic $18/month works)
- **OS**: Ubuntu 24.04 LTS
- **Add your SSH key** during creation

### 2. Initial Server Setup

SSH into your droplet:
```bash
ssh root@your-droplet-ip
```

Update system and install Docker:
```bash
# Update packages
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose plugin
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 3. Setup Application Directory

```bash
# Create app directory
mkdir -p /opt/bfs
cd /opt/bfs

# Download compose file and env template
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/docker-compose.published.yml
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.env.example

# Or if repo is private, clone just what you need:
# git clone --depth 1 --filter=blob:none --sparse YOUR_REPO_URL .
# git sparse-checkout set docker-compose.published.yml .env.example
```

### 4. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Generate secrets
openssl rand -hex 32  # BANK_OIDC_SECRET
openssl rand -hex 32  # MAIL_OIDC_SECRET  
openssl rand -hex 32  # MARKETPLACE_OIDC_SECRET

# Edit configuration
nano .env
```

Required `.env` settings:
```bash
DOCKER_USERNAME=cirodam
VERSION=latest

# Your domain (without https://)
DOMAIN=your-domain.com

# Generate these secrets above
BANK_OIDC_SECRET=your_bank_secret_here
MAIL_OIDC_SECRET=your_mail_secret_here
MARKETPLACE_OIDC_SECRET=your_marketplace_secret_here

# Email for Let's Encrypt
ACME_EMAIL=admin@your-domain.com
```

### 5. Configure DNS

Point these subdomains to your droplet IP:
```
governance.your-domain.com → A record → your-droplet-ip
bank.your-domain.com       → A record → your-droplet-ip
mail.your-domain.com       → A record → your-droplet-ip
marketplace.your-domain.com → A record → your-droplet-ip
```

Or use wildcard DNS:
```
*.your-domain.com → A record → your-droplet-ip
```

**Wait for DNS propagation** (check with `nslookup governance.your-domain.com`)

### 6. Start Services

```bash
# Pull and start all services
docker compose -f docker-compose.published.yml up -d

# Monitor startup (Ctrl+C to exit)
docker compose -f docker-compose.published.yml logs -f

# Check running containers
docker ps
```

### 7. Initialize Governance App

Visit `https://governance.your-domain.com/setup` to:
- Create the first society
- Set up the founding member account
- Configure initial settings

### 8. Verify Other Services

- **Community Bank**: `https://bank.your-domain.com`
- **Mail**: `https://mail.your-domain.com`
- **Marketplace**: `https://marketplace.your-domain.com`

## Management Commands

### Using Helper Scripts (Automated Setup)

If you used the bootstrap script, these convenient helpers are available in `/opt/bfs`:

```bash
cd /opt/bfs

# Start all services
./start.sh

# Stop all services
./stop.sh

# View logs (all services)
./logs.sh

# View logs (specific service)
./logs.sh governance
./logs.sh traefik

# Backup all data volumes
./backup.sh

# Update to latest images
./update.sh
```

### Using Docker Compose Directly (Manual Setup)

```bash
# View logs
docker compose -f docker-compose.published.yml logs -f [service]

# Restart service
docker compose -f docker-compose.published.yml restart governance

# Stop all
docker compose -f docker-compose.published.yml down

# Update to new version
docker compose -f docker-compose.published.yml pull
docker compose -f docker-compose.published.yml up -d

# Backup data
docker run --rm -v bfs_governance-data:/data -v /opt/bfs/backups:/backup \
  alpine tar czf /backup/governance-$(date +%Y%m%d).tar.gz -C /data .
```

## Firewall Setup (Recommended)

```bash
# Install UFW if not present
apt install ufw -y

# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

## Troubleshooting

**Services won't start:**
```bash
# Check logs
docker compose -f docker-compose.published.yml logs

# Verify DNS
nslookup governance.your-domain.com

# Test ports
netstat -tlnp | grep -E ':80|:443'
```

**SSL certificate issues:**
```bash
# Check Traefik logs
docker compose -f docker-compose.published.yml logs traefik

# Verify email in .env is correct
# Ensure ports 80/443 are open
# Wait up to 2 minutes for certificate provisioning
```

**Can't access services:**
- Verify DNS points to droplet IP
- Check firewall allows ports 80/443
- Ensure .env DOMAIN matches DNS records (without https://)
- Check Traefik is running: `docker ps | grep traefik`

## Updating Images

When new versions are published:

```bash
cd /opt/bfs

# Pull latest images
docker compose -f docker-compose.published.yml pull

# Recreate containers with new images
docker compose -f docker-compose.published.yml up -d

# Old images will be replaced, data persists in volumes
```

## Resource Usage

Typical droplet usage:
- **CPU**: Low (~5-10% idle)
- **RAM**: ~1.2GB with all services
- **Disk**: ~500MB for images + your data
- **Bandwidth**: Depends on usage

Consider upgrading if you see:
- High RAM usage causing OOM kills
- Slow response times
- Database locking errors
