#!/bin/bash
# =============================================================================
# ZFlix - PostgreSQL Database Restore Script
# =============================================================================
# Usage: ./restore-db.sh <backup-file.sql.gz>
# =============================================================================
set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
BACKUP_DIR="/opt/zflix/backups"
APP_DIR="/opt/zflix"
DB_CONTAINER="zflix-db"
APP_CONTAINER="zflix-app"
POSTGRES_USER="${POSTGRES_USER:-zflix}"
POSTGRES_DB="${POSTGRES_DB:-zflix}"

# -----------------------------------------------------------------------------
# Validate argument
# -----------------------------------------------------------------------------
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lht "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || echo "  (none found in ${BACKUP_DIR})"
  exit 1
fi

BACKUP_FILE="$1"

# Resolve relative paths
if [[ "${BACKUP_FILE}" != /* ]]; then
  BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "[ERROR] Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

BACKUP_SIZE="$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}")"

# -----------------------------------------------------------------------------
# Confirmation prompt
# -----------------------------------------------------------------------------
echo "============================================================"
echo "  ZFlix Database Restore"
echo "============================================================"
echo ""
echo "  Backup file : ${BACKUP_FILE}"
echo "  File size   : ${BACKUP_SIZE} bytes"
echo "  Target DB   : ${POSTGRES_DB} (container: ${DB_CONTAINER})"
echo ""
echo "  WARNING: This will PERMANENTLY OVERWRITE the current"
echo "  database. The application will be stopped during restore."
echo ""
read -r -p "  Type 'yes' to confirm restore: " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo ""
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting restore..."

# -----------------------------------------------------------------------------
# Stop app container to prevent writes during restore
# -----------------------------------------------------------------------------
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stopping application container..."
cd "${APP_DIR}"
docker compose stop app 2>/dev/null || true

# -----------------------------------------------------------------------------
# Drop and recreate the database
# -----------------------------------------------------------------------------
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Dropping and recreating database '${POSTGRES_DB}'..."
docker exec "${DB_CONTAINER}" \
  psql -U "${POSTGRES_USER}" -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${POSTGRES_DB}' AND pid <> pg_backend_pid();" \
  > /dev/null

docker exec "${DB_CONTAINER}" \
  psql -U "${POSTGRES_USER}" -d postgres -c \
  "DROP DATABASE IF EXISTS ${POSTGRES_DB};" \
  > /dev/null

docker exec "${DB_CONTAINER}" \
  psql -U "${POSTGRES_USER}" -d postgres -c \
  "CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};" \
  > /dev/null

# -----------------------------------------------------------------------------
# Restore from backup
# -----------------------------------------------------------------------------
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restoring from backup (this may take a while)..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${DB_CONTAINER}" \
  psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --quiet

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database restore completed successfully."

# -----------------------------------------------------------------------------
# Restart app
# -----------------------------------------------------------------------------
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restarting application container..."
docker compose start app

echo ""
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restore process finished. Application is restarting."
echo "  Monitor with: docker logs -f ${APP_CONTAINER}"
