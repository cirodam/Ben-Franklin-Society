#!/bin/bash
# Backup script for BFS Docker volumes

set -e

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "Starting BFS backup at $DATE"

# Backup governance data
echo "Backing up governance..."
docker run --rm \
  -v bfs_governance-data:/data \
  -v "$(pwd)/$BACKUP_DIR:/backup" \
  alpine \
  tar czf "/backup/governance-$DATE.tar.gz" -C /data .

# Backup community bank data
echo "Backing up community bank..."
docker run --rm \
  -v bfs_community-bank-data:/data \
  -v "$(pwd)/$BACKUP_DIR:/backup" \
  alpine \
  tar czf "/backup/bank-$DATE.tar.gz" -C /data .

# Backup mail data
echo "Backing up mail..."
docker run --rm \
  -v bfs_mail-data:/data \
  -v "$(pwd)/$BACKUP_DIR:/backup" \
  alpine \
  tar czf "/backup/mail-$DATE.tar.gz" -C /data .

# Backup marketplace data
echo "Backing up marketplace..."
docker run --rm \
  -v bfs_marketplace-data:/data \
  -v "$(pwd)/$BACKUP_DIR:/backup" \
  alpine \
  tar czf "/backup/marketplace-$DATE.tar.gz" -C /data .

echo "Backup complete! Files saved to $BACKUP_DIR/"

# Optional: Remove backups older than 30 days
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Cleanup complete."
