#!/bin/bash
set -e

echo "==> Building Forma..."
docker compose build

echo "==> Stopping old container..."
docker compose down --remove-orphans || true

echo "==> Starting Forma on port 3001..."
docker compose up -d

echo "==> Done. Forma running at http://$(hostname -I | awk '{print $1}'):3001"
