#!/usr/bin/env bash
set -euo pipefail

# Bootstrap script for deploying BFS Federation Registry to a droplet
# 
# Usage:
#   sudo bash bootstrap-federation-droplet.sh
#
# Environment variables:
#   DOCKER_USERNAME   - Docker Hub username [default: cirodam]
#   VERSION           - Image version tag [default: latest]
#
# The federation will be accessible at http://YOUR_SERVER_IP
# No domain name or SSL configuration required.

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
EOF

  echo "✓ .env file created at $FEDERATION_DIR/.env"
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
echo "✅ Configuration complete!"
echo ""
echo "Start the federation registry with:"
echo "  $FEDERATION_DIR/start.sh"
echo ""
echo "Useful commands:"
echo "  Start:   $FEDERATION_DIR/start.sh"
echo "  Stop:    $FEDERATION_DIR/stop.sh"
echo "  Restart: $FEDERATION_DIR/restart.sh"
echo "  Logs:    $FEDERATION_DIR/logs.sh"
echo ""
echo "The federation registry will be available at:"
echo "  http://YOUR_SERVER_IP"
echo ""
echo "To find your server's IP address, run: ip addr show"
echo "=========================================="
