#!/usr/bin/env bash
set -euo pipefail

# Bootstrap script for deploying BFS to a DigitalOcean droplet
# Run as root: curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/scripts/bootstrap-droplet.sh | bash

echo "=========================================="
echo "BFS Droplet Bootstrap Script"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Error: This script must be run as root"
  echo "Usage: sudo bash bootstrap-droplet.sh"
  exit 1
fi

# Configuration
BFS_DIR="/opt/bfs"
DOCKER_USERNAME="${DOCKER_USERNAME:-cirodam}"
VERSION="${VERSION:-latest}"
DOMAIN="${DOMAIN:-}"

echo "Installing system updates..."
apt update && apt upgrade -y

echo ""
echo "Installing required packages..."
apt install -y curl git ufw

echo ""
echo "Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sh /tmp/get-docker.sh
  rm /tmp/get-docker.sh
  echo "Docker installed successfully"
else
  echo "Docker already installed"
fi

echo ""
echo "Installing Docker Compose plugin..."
if ! docker compose version &> /dev/null; then
  apt install -y docker-compose-plugin
  echo "Docker Compose installed successfully"
else
  echo "Docker Compose already installed"
fi

echo ""
echo "Verifying Docker installation..."
docker --version
docker compose version

echo ""
echo "Setting up firewall..."
# Allow SSH, HTTP, HTTPS
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw status

echo ""
echo "Creating application directory..."
mkdir -p "$BFS_DIR"
cd "$BFS_DIR"

echo ""
echo "Downloading docker-compose.published.yml..."
if [ -f docker-compose.published.yml ]; then
  echo "File already exists, backing up..."
  mv docker-compose.published.yml docker-compose.published.yml.backup.$(date +%Y%m%d-%H%M%S)
fi

# Download compose file
echo "Fetching from GitHub repository..."
if ! curl -fsSL -o docker-compose.published.yml \
  https://raw.githubusercontent.com/cirodam/Ben-Franklin-Society/master/docker-compose.published.yml; then
  echo "Error: Failed to download docker-compose.published.yml from GitHub"
  echo "Please ensure:"
  echo "  1. The file exists in the repository"
  echo "  2. The repository is public or accessible"
  echo "  3. You have internet connectivity"
  exit 1
fi

# Verify the file was downloaded and has content
if [ ! -f docker-compose.published.yml ] || [ ! -s docker-compose.published.yml ]; then
  echo "Error: docker-compose.published.yml was not downloaded correctly"
  exit 1
fi

echo "✓ docker-compose.published.yml downloaded successfully"

echo ""
echo "Creating .env file..."
if [ -f .env ]; then
  echo ".env file already exists, skipping..."
else
  cat > .env << EOF
# Docker image configuration
DOCKER_USERNAME=$DOCKER_USERNAME
VERSION=$VERSION

# Domain configuration (without https://)
DOMAIN=${DOMAIN}

# OIDC secrets (generate with: openssl rand -hex 32)
BANK_OIDC_SECRET=
MAIL_OIDC_SECRET=
MARKETPLACE_OIDC_SECRET=
LIBRARY_OIDC_SECRET=

# Let's Encrypt email for SSL certificates
ACME_EMAIL=
EOF

  echo ".env file created at $BFS_DIR/.env"
  echo ""
  echo "=========================================="
  echo "IMPORTANT: You must edit .env before starting services!"
  echo "=========================================="
  echo ""
  echo "Required configuration:"
  echo "1. Set DOMAIN to your domain (e.g., example.com)"
  echo "2. Generate OIDC secrets with: openssl rand -hex 32" (4 needed)
  echo "3. Set ACME_EMAIL to your email for Let's Encrypt"
  echo ""
  echo "Edit with: nano $BFS_DIR/.env"
fi

echo ""
echo "Creating backup directory..."
mkdir -p "$BFS_DIR/backups"

echo ""
echo "Creating startup helper script..."
cat > "$BFS_DIR/start.sh" << 'EOFSCRIPT'
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Check if .env is configured
if grep -q "DOMAIN=$" .env || grep -q "ACME_EMAIL=$" .env; then
  echo "Error: .env file is not fully configured!"
  echo "Please edit .env and set all required values:"
  echo "  - DOMAIN"
  echo "  - BANK_OIDC_SECRET, MAIL_OIDC_SECRET, MARKETPLACE_OIDC_SECRET, LIBRARY_OIDC_SECRET"
  echo "  - ACME_EMAIL"
  echo ""
  echo "Edit with: nano .env"
  exit 1
fi

echo "Pulling latest images..."
docker compose -f docker-compose.published.yml pull

echo "Starting services..."
docker compose -f docker-compose.published.yml up -d

echo ""
echo "Services started successfully!"
echo ""
echo "Check status with: docker ps"
echo "View logs with: docker compose -f docker-compose.published.yml logs -f"
EOFSCRIPT

chmod +x "$BFS_DIR/start.sh"

echo ""
echo "Creating stop helper script..."
cat > "$BFS_DIR/stop.sh" << 'EOFSCRIPT'
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Stopping services..."
docker compose -f docker-compose.published.yml down

echo "Services stopped."
EOFSCRIPT

chmod +x "$BFS_DIR/stop.sh"

echo ""
echo "Creating logs helper script..."
cat > "$BFS_DIR/logs.sh" << 'EOFSCRIPT'
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

SERVICE="${1:-}"

if [ -z "$SERVICE" ]; then
  echo "Following logs for all services (Ctrl+C to exit)..."
  docker compose -f docker-compose.published.yml logs -f
else
  echo "Following logs for $SERVICE (Ctrl+C to exit)..."
  docker compose -f docker-compose.published.yml logs -f "$SERVICE"
fi
EOFSCRIPT

chmod +x "$BFS_DIR/logs.sh"

echo ""
echo "Creating backup script..."
cat > "$BFS_DIR/backup.sh" << 'EOFSCRIPT'
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d-%H%M%S)

echo "Creating backups..."
mkdir -p "$BACKUP_DIR"

# Backup each data volume
for volume in bfs_governance-data bfs_community-bank-data bfs_mail-data bfs_marketplace-data bfs_library-data; do
  if docker volume inspect "$volume" &> /dev/null; then
    echo "Backing up $volume..."
    docker run --rm \
      -v "$volume":/data \
      -v "$(pwd)/$BACKUP_DIR":/backup \
      alpine tar czf "/backup/${volume}-${DATE}.tar.gz" -C /data .
    echo "  ✓ Created ${volume}-${DATE}.tar.gz"
  fi
done

echo ""
echo "Backups completed successfully!"
echo "Location: $BACKUP_DIR"
ls -lh "$BACKUP_DIR"/*-"${DATE}".tar.gz
EOFSCRIPT

chmod +x "$BFS_DIR/backup.sh"

echo ""
echo "Creating update script..."
cat > "$BFS_DIR/update.sh" << 'EOFSCRIPT'
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Pulling latest images..."
docker compose -f docker-compose.published.yml pull

echo ""
echo "Recreating services with new images..."
docker compose -f docker-compose.published.yml up -d

echo ""
echo "Update completed successfully!"
echo ""
echo "View logs with: ./logs.sh"
EOFSCRIPT

chmod +x "$BFS_DIR/update.sh"

echo ""
echo "Verifying installation..."
if [ ! -f "$BFS_DIR/docker-compose.published.yml" ]; then
  echo "Error: docker-compose.published.yml is missing!"
  exit 1
fi

if [ ! -f "$BFS_DIR/.env" ]; then
  echo "Error: .env file is missing!"
  exit 1
fi

echo "✓ All required files present"

echo ""
echo "=========================================="
echo "Bootstrap Complete!"
echo "=========================================="
echo ""
echo "Installation directory: $BFS_DIR"
echo ""
echo "IMPORTANT: Complete these steps before starting services:"
echo ""
echo "1. Configure DNS A records pointing to this server ($(hostname -I | awk '{print $1}')):"
echo "   governance.yourdomain.com"
echo "   bank.yourdomain.com"
echo "   mail.yourdomain.com"
echo "   marketplace.yourdomain.com"
echo "   library.yourdomain.com"
echo ""
echo "2. Edit .env configuration:"
echo "   cd $BFS_DIR && nano .env"
echo ""
echo "   Required changes:"
echo "   - DOMAIN=yourdomain.com (e.g., bfsathensga.org)"
echo "   - BANK_OIDC_SECRET=<run: openssl rand -hex 32>"
echo "   - MAIL_OIDC_SECRET=<run: openssl rand -hex 32>"
echo "   - MARKETPLACE_OIDC_SECRET=<run: openssl rand -hex 32>"
echo "   - LIBRARY_OIDC_SECRET=<run: openssl rand -hex 32>"
echo "   - ACME_EMAIL=your-email@example.com"
echo ""
echo "3. Start services:"
echo "   cd $BFS_DIR && ./start.sh"
echo ""
echo "4. Monitor logs:"
echo "   cd $BFS_DIR && ./logs.sh"
echo ""
echo "5. After services start (~2 min for SSL), initialize:"
echo "   Visit https://governance.yourdomain.com/setup"
echo ""
echo "Available commands:"
echo "  ./start.sh   - Start all services"
echo "  ./stop.sh    - Stop all services"
echo "  ./logs.sh    - View logs (optionally: ./logs.sh governance)"
echo "  ./backup.sh  - Backup all data volumes"
echo "  ./update.sh  - Pull latest images and restart"
echo ""
echo "Troubleshooting:"
echo "  docker ps                    - Check running containers"
echo "  docker compose ps            - Check service status"
echo "  ./logs.sh traefik           - Check SSL certificate issues"
echo "  ufw status                   - Verify firewall rules"
echo ""
