#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

IMAGE_NAME="cirodam/ben-franklin-society-marketplace"
VERSION="${1:-latest}"

echo "Building Docker image..."
sudo docker build -f "$SCRIPT_DIR/Dockerfile" -t ${IMAGE_NAME}:${VERSION} "$REPO_ROOT"

if [ "$VERSION" != "latest" ]; then
    echo "Tagging as latest..."
    sudo docker tag ${IMAGE_NAME}:${VERSION} ${IMAGE_NAME}:latest
fi

echo "Pushing ${IMAGE_NAME}:${VERSION}..."
sudo docker push ${IMAGE_NAME}:${VERSION}

if [ "$VERSION" != "latest" ]; then
    echo "Pushing ${IMAGE_NAME}:latest..."
    sudo docker push ${IMAGE_NAME}:latest
fi

echo "✓ Successfully pushed ${IMAGE_NAME}:${VERSION}"
