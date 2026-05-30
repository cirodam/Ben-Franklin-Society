#!/bin/bash
set -e

# Configuration
REGISTRY_USER="${1:-cirodam}"
VERSION="${2:-latest}"

echo "======================================"
echo "Building Website Docker Image"
echo "======================================"
echo "Registry: $REGISTRY_USER"
echo "Version: $VERSION"
echo ""

IMAGE_NAME="$REGISTRY_USER/ben-franklin-society-website:$VERSION"

echo "Building website image: $IMAGE_NAME"
sudo docker build --no-cache -t "$IMAGE_NAME" -f apps/website/Dockerfile .

echo ""
echo "Pushing website image to Docker Hub..."
sudo docker push "$IMAGE_NAME"

echo ""
echo "======================================"
echo "Build Complete!"
echo "======================================"
echo "Image: $IMAGE_NAME"
echo ""
echo "To deploy to your server:"
echo "  ssh root@YOUR_SERVER 'cd /opt/bfs-website && docker compose pull && docker compose up -d'"
echo ""
