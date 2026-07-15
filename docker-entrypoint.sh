#!/bin/sh
set -e

# Ensure the data + uploads directories exist on the mounted volume.
DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR" "${UPLOADS_DIR:-$DATA_DIR/uploads}"

echo "→ Applying database migrations..."
npx prisma migrate deploy

echo "→ Seeding (idempotent: admin user + PhD template)..."
npm run seed || echo "  seed step reported an issue; continuing"

echo "→ Starting server on ${HOSTNAME}:${PORT}..."
exec npm run start
