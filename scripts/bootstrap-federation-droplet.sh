#!/usr/bin/env bash
set -euo pipefail

# Bootstrap script for deploying BFS Federation Registry to a droplet
# 
# Usage:
#   Basic: sudo bash bootstrap-federation-droplet.sh
#   With config: sudo FEDERATION_DOMAIN=federation.bfs.network ACME_EMAIL=admin@example.com bash bootstrap-federation-droplet.sh
#
# Environment variables:
#   FEDERATION_DOMAIN - Your federation domain (e.g., federation.bfs.network) [optional]
#   ACME_EMAIL        - Email for Let's Encrypt SSL certificates [optional]
#   DOCKER_USERNAME   - Docker Hub username [default: cirodam]
#   VERSION           - Image version tag [default: latest]

# Non-interactive mode for apt (prevents configuration prompts)
export DEBIAN_FRONTEND=noninteractive

echo "=========================================="
echo "BFS Federation Registry Bootstrap Script"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Error: This script must be run as root"
  echo "Usage: sudo bash bootstrap-federation-droplet.sh"
  exit 1
fi

# Configuration
FEDERATION_DIR="/opt/bfs-federation"
DOCKER_USERNAME="${DOCKER_USERNAME:-cirodam}"
VERSION="${VERSION:-latest}"
FEDERATION_DOMAIN="${FEDERATION_DOMAIN:-}"
ACME_EMAIL="${ACME_EMAIL:-}"

echo "Installing system updates..."
apt update && apt upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"

echo ""
echo "Installing required packages..."
apt install -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" curl git ufw

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
  apt install -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" docker-compose-plugin
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
# Add rules before enabling to avoid timing issues
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp  # HTTP/3
ufw --force enable
ufw reload
echo "Firewall rules:"
ufw status verbose

echo ""
echo "Creating application directory..."
mkdir -p "$FEDERATION_DIR"
cd "$FEDERATION_DIR"

echo ""
echo "Downloading docker-compose.federation.yml..."
if [ -f docker-compose.federation.yml ]; then
  echo "File already exists, backing up..."
  mv docker-compose.federation.yml docker-compose.federation.yml.backup.$(date +%Y%m%d-%H%M%S)
fi

# Download compose file
echo "Fetching from GitHub repository..."
if ! curl -fsSL -o docker-compose.federation.yml \
  https://raw.githubusercontent.com/cirodam/Ben-Franklin-Society/master/docker-compose.federation.yml; then
  echo "Error: Failed to download docker-compose.federation.yml from GitHub"
  echo "Please ensure:"
  echo "  1. The file exists in the repository"
  echo "  2. The repository is public or accessible"
  echo "  3. You have internet connectivity"
  exit 1
fi

# Verify the file was downloaded and has content
if [ ! -f docker-compose.federation.yml ] || [ ! -s docker-compose.federation.yml ]; then
  echo "Error: docker-compose.federation.yml was not downloaded correctly"
  exit 1
fi

echo "✓ docker-compose.federation.yml downloaded successfully"

echo ""
echo "Downloading Caddyfile.federation..."
if ! curl -fsSL -o Caddyfile.federation \
  https://raw.githubusercontent.com/cirodam/Ben-Franklin-Society/master/Caddyfile.federation; then
  echo "Error: Failed to download Caddyfile.federation from GitHub"
  exit 1
fi

echo "✓ Caddyfile.federation downloaded successfully"

echo ""
echo "Creating .env file..."
if [ -f .env ]; then
  echo ".env file already exists, skipping..."
else
  cat > .env << EOF
# Docker image configuration
DOCKER_USERNAME=$DOCKER_USERNAME
VERSION=$VERSION

# Federation domain configuration (without https://)
FEDERATION_DOMAIN=${FEDERATION_DOMAIN}

# Let's Encrypt email for SSL certificates
ACME_EMAIL=${ACME_EMAIL}
EOF

  echo "✓ .env file created at $FEDERATION_DIR/.env"
  
  # Check if required values are set
  if [ -z "$FEDERATION_DOMAIN" ] || [ -z "$ACME_EMAIL" ]; then
    echo ""
    echo "=========================================="
    echo "IMPORTANT: Configuration incomplete!"
    echo "=========================================="
    echo ""
    echo "You must edit .env before starting services:"
    echo ""
    if [ -z "$FEDERATION_DOMAIN" ]; then
      echo "  - Set FEDERATION_DOMAIN to your domain (e.g., federation.bfs.network)"
    fi
    if [ -z "$ACME_EMAIL" ]; then
      echo "  - Set ACME_EMAIL to your email for Let's Encrypt"
    fi
    echo ""
    echo "Edit with: nano $FEDERATION_DIR/.env"
  else
    echo "✓ Configuration complete (FEDERATION_DOMAIN and ACME_EMAIL set)"
  fi
fi

echo ""
echo "Creating backup directory..."
mkdir -p "$FEDERATION_DIR/backups"

echo ""
echo "Creating startup helper script..."
cat > "$FEDERATION_DIR/start.sh" << 'EOFSCRIPT'
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Check if .env is configured
if grep -q "FEDERATION_DOMAIN=$" .env || grep -q "ACME_EMAIL=$" .env; then
  echo "Error: .env file is not fully configured!"
  echo "Please edit .env and set all required values:"
  echo "  - FEDERATION_DOMAIN (e.g., federation.bfs.network)"
  echo "  - ACME_EMAIL (your email for Let's Encrypt)"
  echo ""
  echo "Edit with: nano .env"
  exit 1
fi

echo "Pulling latest images..."
docker compose -f docker-compose.federation.yml pull

echo "Starting federation registry..."
docker compose -f docker-compose.federation.yml up -d

echo ""
echo "Federation registry started successfully!"
echo ""
echo "Check status with: docker ps"
echo "View logs with: docker compose -f docker-compose.federation.yml logs -f"
EOFSCRIPT

chmod +x "$FEDERATION_DIR/start.sh"

echo ""
echo "Creating stop helper script..."
cat > "$FEDERATION_DIR/stop.sh" << 'EOFSCRIPT'
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Stopping federation registry..."
docker compose -f docker-compose.federation.yml down

echo "Federation registry stopped."
EOFSCRIPT

chmod +x "$FEDERATION_DIR/stop.sh"

echo ""
echo "Creating restart helper script..."
cat > "$FEDERATION_DIR/restart.sh" << 'EOFSCRIPT'
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Restarting federation registry..."
docker compose -f docker-compose.federation.yml restart

echo "Federation registry restarted."
EOFSCRIPT

chmod +x "$FEDERATION_DIR/restart.sh"

echo ""
echo "Creating logs helper script..."
cat > "$FEDERATION_DIR/logs.sh" << 'EOFSCRIPT'
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

docker compose -f docker-compose.federation.yml logs -f
EOFSCRIPT

chmod +x "$FEDERATION_DIR/logs.sh"

echo ""
echo "=========================================="
echo "Bootstrap complete!"
echo "=========================================="
echo ""
echo "Installation directory: $FEDERATION_DIR"
echo ""

# Final configuration check
if [ -z "$FEDERATION_DOMAIN" ] || [ -z "$ACME_EMAIL" ]; then
  echo "⚠️  NEXT STEPS:"
  echo "1. Edit configuration: nano $FEDERATION_DIR/.env"
  echo "2. Start services: $FEDERATION_DIR/start.sh"
  echo ""
  echo "Required configuration:"
  if [ -z "$FEDERATION_DOMAIN" ]; then
    echo "  - FEDERATION_DOMAIN (your domain, e.g., federation.bfs.network)"
  fi
  if [ -z "$ACME_EMAIL" ]; then
    echo "  - ACME_EMAIL (your email for Let's Encrypt)"
  fi
else
  echo "✅ Configuration complete!"
  echo ""
  echo "Start the federation registry with:"
  echo "  $FEDERATION_DIR/start.sh"
fi

echo ""
echo "Useful commands:"
echo "  Start:   $FEDERATION_DIR/start.sh"
echo "  Stop:    $FEDERATION_DIR/stop.sh"
echo "  Restart: $FEDERATION_DIR/restart.sh"
echo "  Logs:    $FEDERATION_DIR/logs.sh"
echo ""
echo "The federation registry will be available at:"
echo "  https://${FEDERATION_DOMAIN:-federation.bfs.network}"
echo ""
echo "Make sure your DNS A record points to this server's IP address."
echo "=========================================="
