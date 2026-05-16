# BFS Droplet Deployment - Quick Reference

## 🚀 One-Command Deploy

```bash
# SSH to your droplet
ssh root@your-droplet-ip

# Run bootstrap
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/BFS/main/scripts/bootstrap-droplet.sh | bash

# Configure
cd /opt/bfs
nano .env  # Set DOMAIN, OIDC secrets, ACME_EMAIL

# Start
./start.sh
```

## ⚙️ Required Configuration

In `/opt/bfs/.env`:

```bash
DOMAIN=yourdomain.com                          # No https://
BANK_OIDC_SECRET=$(openssl rand -hex 32)      # Generate 3 secrets
MAIL_OIDC_SECRET=$(openssl rand -hex 32)
MARKETPLACE_OIDC_SECRET=$(openssl rand -hex 32)
ACME_EMAIL=admin@yourdomain.com                # For SSL certs
```

## 🌐 DNS Records

```
governance.yourdomain.com  → A → your-droplet-ip
bank.yourdomain.com        → A → your-droplet-ip
mail.yourdomain.com        → A → your-droplet-ip
marketplace.yourdomain.com → A → your-droplet-ip
```

OR wildcard: `*.yourdomain.com → A → your-droplet-ip`

## 📋 Helper Commands

```bash
cd /opt/bfs

./start.sh    # Start all services
./stop.sh     # Stop all services
./logs.sh     # View logs (Ctrl+C to exit)
./backup.sh   # Backup data volumes
./update.sh   # Pull latest images and restart
```

## 🔍 Monitoring

```bash
docker ps                    # Check containers
./logs.sh traefik           # SSL certificate issues
./logs.sh governance        # App logs
docker compose ps           # Service status
```

## 🆘 Common Issues

**Services won't start?**
```bash
./logs.sh                    # Check what's failing
cat .env                     # Verify configuration
docker ps                    # See what's running
```

**Can't access sites?**
```bash
nslookup governance.yourdomain.com   # Check DNS
ufw status                           # Check firewall
./logs.sh traefik                    # Check SSL
```

**SSL certificate issues?**
- Wait 1-2 minutes for Let's Encrypt
- Verify ACME_EMAIL is set in .env
- Ensure ports 80/443 are open
- Check DNS points to droplet

## 📦 Droplet Specs

- **Minimum**: 2GB RAM, 50GB disk
- **Recommended**: 4GB RAM, 80GB disk
- **OS**: Ubuntu 24.04 LTS
- **Cost**: ~$18-24/month

## 🔄 Updating

```bash
cd /opt/bfs
./update.sh           # Pulls latest images
./logs.sh             # Monitor the update
```

## 💾 Backups

```bash
cd /opt/bfs
./backup.sh           # Creates timestamped backups
ls -lh backups/       # View backups
```

**Restore from backup:**
```bash
./stop.sh
docker run --rm \
  -v bfs_governance-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/bfs_governance-data-TIMESTAMP.tar.gz -C /data
./start.sh
```

## 🎯 First Time Setup

After deployment:

1. **Wait** for SSL certificates (1-2 min)
2. **Visit** `https://governance.yourdomain.com/setup`
3. **Create** founding society
4. **Register** first admin account
5. **Verify** other services are accessible

## 📚 Full Documentation

- [Complete Deployment Guide](DEPLOYMENT_DROPLET.md)
- [Docker Documentation](DOCKER.md)
- [Architecture Overview](architectural/architecture.md)
