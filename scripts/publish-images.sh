#!/usr/bin/env bash
set -euo pipefail

# Docker Hub Publishing Script for BFS Apps
# Usage: ./scripts/publish-images.sh [docker-hub-username] [version-tag]
# Example: ./scripts/publish-images.sh benfranklinsociety 0.1.0

DOCKER_USERNAME="${1:-}"
VERSION="${2:-latest}"

if [ -z "$DOCKER_USERNAME" ]; then
    echo "Error: Docker Hub username required"
    echo "Usage: $0 <docker-hub-username> [version-tag]"
    echo "Example: $0 benfranklinsociety 0.1.0"
    exit 1
fi

echo "Building and publishing BFS images to Docker Hub"
echo "Username: $DOCKER_USERNAME"
echo "Version: $VERSION"
echo ""

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username: $DOCKER_USERNAME"; then
    echo "Please log in to Docker Hub first:"
    echo "  docker login"
    exit 1
fi

# Build context is the monorepo root
cd "$(dirname "$0")/.."

APPS=("governance" "community-bank" "mail" "marketplace")

for APP in "${APPS[@]}"; do
    echo "=========================================="
    echo "Building: $APP"
    echo "=========================================="
    
    IMAGE_NAME="$DOCKER_USERNAME/bfs-$APP"
    
    # Build the image
    docker build \
        -f "apps/$APP/Dockerfile" \
        -t "$IMAGE_NAME:$VERSION" \
        -t "$IMAGE_NAME:latest" \
        .
    
    echo ""
    echo "Pushing: $IMAGE_NAME:$VERSION"
    docker push "$IMAGE_NAME:$VERSION"
    
    echo "Pushing: $IMAGE_NAME:latest"
    docker push "$IMAGE_NAME:latest"
    
    echo "✓ Published $APP"
    echo ""
done

echo "=========================================="
echo "All images published successfully!"
echo "=========================================="
echo ""
echo "Images published:"
for APP in "${APPS[@]}"; do
    echo "  - $DOCKER_USERNAME/bfs-$APP:$VERSION"
    echo "  - $DOCKER_USERNAME/bfs-$APP:latest"
done
