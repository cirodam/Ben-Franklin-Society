#!/bin/bash
set -e

IMAGE_NAME="cirodam/ben-franklin-society-governance"
VERSION="${1:-latest}"

echo "Building Docker image..."
sudo docker build -f Dockerfile -t ${IMAGE_NAME}:${VERSION} ../..

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
