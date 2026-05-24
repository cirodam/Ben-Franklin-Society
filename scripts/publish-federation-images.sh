#!/usr/bin/env bash
set -euo pipefail

# Docker Hub Publishing Script for Federation Registry
# Usage: ./scripts/publish-federation-images.sh [docker-hub-username] [version-tag]
# Example: ./scripts/publish-federation-images.sh cirodam 0.1.0

DOCKER_USERNAME="${1:-cirodam}"
VERSION="${2:-latest}"

echo "Building and publishing Federation Registry image to Docker Hub"
echo "Username: $DOCKER_USERNAME"
echo "Version: $VERSION"
echo ""

# Build context is the monorepo root
cd "$(dirname "$0")/.."

APP="federation"
IMAGE_NAME="$DOCKER_USERNAME/ben-franklin-society-$APP"

echo "=========================================="
echo "Building: $APP"
echo "=========================================="

# Build the image
sudo docker build \
    -f "apps/$APP/Dockerfile" \
    -t "$IMAGE_NAME:$VERSION" \
    .

# Tag as latest if not already
if [ "$VERSION" != "latest" ]; then
    sudo docker tag "$IMAGE_NAME:$VERSION" "$IMAGE_NAME:latest"
fi

echo ""
echo "Pushing: $IMAGE_NAME:$VERSION"
sudo docker push "$IMAGE_NAME:$VERSION"

if [ "$VERSION" != "latest" ]; then
    echo "Pushing: $IMAGE_NAME:latest"
    sudo docker push "$IMAGE_NAME:latest"
fi

echo "✓ Published $APP"
echo ""

echo "=========================================="
echo "Federation image published successfully!"
echo "=========================================="
echo ""
echo "Image published:"
echo "  - $DOCKER_USERNAME/ben-franklin-society-$APP:$VERSION"
if [ "$VERSION" != "latest" ]; then
    echo "  - $DOCKER_USERNAME/ben-franklin-society-$APP:latest"
fi
echo ""
echo "Deploy with:"
echo "  docker compose -f docker-compose.federation.yml pull"
echo "  docker compose -f docker-compose.federation.yml up -d"
