#!/bin/bash
set -e

echo "======================================"
echo "Ben Franklin Society - Website Setup"
echo "======================================"

# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
    echo "Docker already installed."
fi

# Configure firewall
echo "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Create deployment directory
DEPLOY_DIR="/opt/bfs-website"
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Download docker-compose file
echo "Downloading deployment files..."
curl -fsSL https://raw.githubusercontent.com/cirodam/Ben-Franklin-Society/master/docker-compose.website.yml -o docker-compose.yml

# Create Caddyfile for SSL (optional, if domain configured)
cat > Caddyfile <<'EOF'
benfranklinsociety.org, www.benfranklinsociety.org {
    reverse_proxy website:80
    encode gzip
}
EOF

# Create helper scripts
cat > start.sh <<'EOF'
#!/bin/bash
docker compose pull
docker compose up -d
echo "Website started!"
echo "Visit: http://$(hostname -I | awk '{print $1}')"
EOF
chmod +x start.sh

cat > stop.sh <<'EOF'
#!/bin/bash
docker compose down
echo "Website stopped."
EOF
chmod +x stop.sh

cat > restart.sh <<'EOF'
#!/bin/bash
docker compose restart
echo "Website restarted."
EOF
chmod +x restart.sh

cat > logs.sh <<'EOF'
#!/bin/bash
docker compose logs -f "$@"
EOF
chmod +x logs.sh

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "To start the website:"
echo "  cd $DEPLOY_DIR && ./start.sh"
echo ""
echo "Available commands:"
echo "  ./start.sh    - Start the website"
echo "  ./stop.sh     - Stop the website"
echo "  ./restart.sh  - Restart the website"
echo "  ./logs.sh     - View logs"
echo ""
echo "The website will be accessible at: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "For SSL/domain setup, configure your domain DNS to point to this server"
echo "and the Caddyfile will automatically provision Let's Encrypt certificates."
echo ""
