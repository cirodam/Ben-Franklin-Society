#!/usr/bin/env bash
set -euo pipefail

# Docker Hub Publishing Script for BFS Society Apps
# Usage: ./scripts/publish-images.sh [docker-hub-username] [version-tag]
# Example: ./scripts/publish-images.sh cirodam 0.1.0
#
# Note: Federation is published separately via publish-federation-images.sh

DOCKER_USERNAME="${1:-cirodam}"
VERSION="${2:-latest}"

echo "Building and publishing BFS images to Docker Hub"
echo "Username: $DOCKER_USERNAME"
echo "Version: $VERSION"
echo ""

# Build context is the monorepo root
cd "$(dirname "$0")/.."

APPS=(
    "governance"
    "community-bank"
    "mail"
    "marketplace"
    "library"
)

for APP in "${APPS[@]}"; do
    echo "=========================================="
    echo "Building: $APP"
    echo "=========================================="
    
    IMAGE_NAME="$DOCKER_USERNAME/ben-franklin-society-$APP"
    
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
done

echo "=========================================="
echo "All images published successfully!"
echo "=========================================="
echo ""
echo "Images published:"
for APP in "${APPS[@]}"; do
    echo "  - $DOCKER_USERNAME/ben-franklin-society-$APP:$VERSION"
    if [ "$VERSION" != "latest" ]; then
        echo "  - $DOCKER_USERNAME/ben-franklin-society-$APP:latest"
    fi
done
