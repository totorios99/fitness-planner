#!/bin/bash
# Build the Forma image and (re)deploy it as a native CasaOS app.
# Run as root (needs docker): sudo ./deploy.sh
set -e

IMAGE="forma:local"
APPID="forma"
HERE="$(cd "$(dirname "$0")" && pwd)"
COMPOSE="$HERE/docker-compose.yml"
DATA_DIR="/DATA/AppData/forma"
DB="$DATA_DIR/forma.db"
SEED_DB="$HERE/prisma/forma.db"

echo "==> Building image $IMAGE ..."
docker build --no-cache -t "$IMAGE" .

# Ensure the DB volume exists. Only seed it from the local DB when it's MISSING,
# so we never clobber data the running app has already written.
mkdir -p "$DATA_DIR"
if [ ! -f "$DB" ] && [ -f "$SEED_DB" ]; then
  echo "==> Seeding DB volume from $SEED_DB (first run) ..."
  cp "$SEED_DB" "$DB"
fi
# Container runs as uid 1001 and must be able to write the SQLite file.
chmod 777 "$DATA_DIR" 2>/dev/null || true
[ -f "$DB" ] && chmod 666 "$DB" 2>/dev/null || true

# Clean recreate so the freshly-built (same-tag) image is actually used.
# Data lives in the host bind-mount above, so this does not lose data.
if casaos-cli app-management list apps 2>/dev/null | grep -q "^$APPID "; then
  echo "==> Removing old CasaOS app (keeping config, data is bind-mounted) ..."
  casaos-cli app-management uninstall -n "$APPID" 2>/dev/null || true
  sleep 2
fi

echo "==> Installing CasaOS app '$APPID' ..."
casaos-cli app-management install -f "$COMPOSE"

echo "==> Done. Forma on http://localhost:3001 (give it a few seconds to start)."
