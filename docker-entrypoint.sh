#!/bin/sh
set -e

echo "🚀 [Docker Entrypoint] Starting NestJS Production Container..."

# Resolve prisma CLI binary
if [ -x "./node_modules/.bin/prisma" ]; then
  PRISMA_CMD="./node_modules/.bin/prisma"
else
  PRISMA_CMD="npx --no-install prisma"
fi

if [ "$SKIP_MIGRATIONS" != "true" ]; then
  echo "📦 [Docker Entrypoint] Checking database configuration & Prisma synchronization..."

  MAX_RETRIES=5
  RETRY_DELAY=3

  if grep -E 'provider\s*=\s*"mongodb"' prisma/schema.prisma >/dev/null 2>&1; then
    echo "🍃 [Docker Entrypoint] MongoDB detected. Synchronizing Prisma schema (prisma db push)..."
    ATTEMPT=1
    until $PRISMA_CMD db push --skip-generate; do
      if [ "$ATTEMPT" -ge "$MAX_RETRIES" ]; then
        echo "❌ [Docker Entrypoint] Prisma db push failed after $MAX_RETRIES attempts!"
        exit 1
      fi
      echo "⚠️ [Docker Entrypoint] Database not ready yet (attempt $ATTEMPT/$MAX_RETRIES). Retrying in ${RETRY_DELAY}s..."
      ATTEMPT=$((ATTEMPT + 1))
      sleep "$RETRY_DELAY"
    done
  else
    echo "🐘 [Docker Entrypoint] Relational database detected. Running Prisma migrations (prisma migrate deploy)..."
    ATTEMPT=1
    until $PRISMA_CMD migrate deploy; do
      if [ "$ATTEMPT" -ge "$MAX_RETRIES" ]; then
        echo "❌ [Docker Entrypoint] Prisma migrate deploy failed after $MAX_RETRIES attempts!"
        exit 1
      fi
      echo "⚠️ [Docker Entrypoint] Database not ready yet (attempt $ATTEMPT/$MAX_RETRIES). Retrying in ${RETRY_DELAY}s..."
      ATTEMPT=$((ATTEMPT + 1))
      sleep "$RETRY_DELAY"
    done
  fi

  echo "✅ [Docker Entrypoint] Database schema synchronized successfully."
else
  echo "⏩ [Docker Entrypoint] Skipping database migration/synchronization (SKIP_MIGRATIONS=true)."
fi

# Execute the container's main command (node dist/main.js)
exec "$@"
