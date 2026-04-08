#!/bin/bash
# =============================================================================
# ZFlix - Manual Fallback Deployment Script
# =============================================================================
# Run on the VPS as the deploy user when GitHub Actions is unavailable.
# Usage: ./deploy.sh [image-tag]
#   image-tag defaults to "latest"
# =============================================================================
set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
APP_DIR="/opt/zflix"
GITHUB_USERNAME="${GITHUB_USERNAME:-}"
IMAGE_TAG="${1:-latest}"
MAX_HEALTH_WAIT=120  # seconds

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
info()    { echo "[$(date '+%H:%M:%S')] $*"; }
success() { echo "[$(date '+%H:%M:%S')] OK: $*"; }
error()   { echo "[$(date '+%H:%M:%S')] ERROR: $*" >&2; }

# -----------------------------------------------------------------------------
# Validate environment
# -----------------------------------------------------------------------------
if [ -z "${GITHUB_USERNAME}" ]; then
  # Try to read from .env file
  if [ -f "${APP_DIR}/.env" ]; then
    GITHUB_USERNAME="$(grep -E '^GITHUB_USERNAME=' "${APP_DIR}/.env" | cut -d= -f2 | tr -d '[:space:]' || true)"
  fi
fi

if [ -z "${GITHUB_USERNAME}" ]; then
  error "GITHUB_USERNAME is not set. Export it or add it to ${APP_DIR}/.env"
  exit 1
fi

IMAGE="ghcr.io/${GITHUB_USERNAME}/zflix:${IMAGE_TAG}"

# -----------------------------------------------------------------------------
# Pre-flight checks
# -----------------------------------------------------------------------------
info "Starting manual deployment..."
info "  App directory : ${APP_DIR}"
info "  Image         : ${IMAGE}"
info "  Tag           : ${IMAGE_TAG}"

if [ ! -f "${APP_DIR}/docker-compose.yml" ]; then
  error "docker-compose.yml not found in ${APP_DIR}"
  exit 1
fi

if [ ! -f "${APP_DIR}/.env" ]; then
  error ".env file not found in ${APP_DIR}"
  exit 1
fi

cd "${APP_DIR}"

# -----------------------------------------------------------------------------
# 1. Pull latest image
# -----------------------------------------------------------------------------
info "Pulling image: ${IMAGE}"
docker pull "${IMAGE}"
success "Image pulled."

# -----------------------------------------------------------------------------
# 2. Update image tag in compose if a specific tag was requested
# -----------------------------------------------------------------------------
if [ "${IMAGE_TAG}" != "latest" ]; then
  info "Pinning image to tag '${IMAGE_TAG}' in docker-compose.yml..."
  sed -i "s|image: ghcr.io/${GITHUB_USERNAME}/zflix:.*|image: ${IMAGE}|" docker-compose.yml
  success "docker-compose.yml updated."
fi

# -----------------------------------------------------------------------------
# 3. Start / update app container (leave postgres untouched)
# -----------------------------------------------------------------------------
info "Bringing up app container..."
docker compose up -d app
success "App container started."

# -----------------------------------------------------------------------------
# 4. Wait for health check
# -----------------------------------------------------------------------------
info "Waiting for health check (up to ${MAX_HEALTH_WAIT}s)..."
ELAPSED=0
until docker inspect --format='{{.State.Health.Status}}' zflix-app 2>/dev/null | grep -q "healthy"; do
  if [ "${ELAPSED}" -ge "${MAX_HEALTH_WAIT}" ]; then
    error "Health check timed out after ${MAX_HEALTH_WAIT}s."
    echo ""
    echo "--- Last 50 lines of app logs ---"
    docker logs zflix-app --tail 50
    exit 1
  fi
  echo "  Waiting... (${ELAPSED}s)"
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done
success "Application is healthy."

# -----------------------------------------------------------------------------
# 5. Run Prisma migrations
# -----------------------------------------------------------------------------
info "Running database migrations..."
docker exec zflix-app npx prisma migrate deploy
success "Migrations applied."

# -----------------------------------------------------------------------------
# 6. Prune old images
# -----------------------------------------------------------------------------
info "Pruning dangling images..."
docker image prune -f
success "Cleanup done."

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "  Deployment complete."
echo "  Image   : ${IMAGE}"
echo "  Status  : $(docker inspect --format='{{.State.Status}}' zflix-app)"
echo "============================================================"
