#!/bin/bash
# =============================================================================
# ZFlix - PostgreSQL Daily Backup Script
# =============================================================================
# Usage: ./backup-db.sh
# Recommended: add to cron — 0 3 * * * /opt/zflix/deploy/backup-db.sh
# =============================================================================
set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
BACKUP_DIR="/opt/zflix/backups"
DB_CONTAINER="zflix-db"
POSTGRES_USER="${POSTGRES_USER:-zflix}"
POSTGRES_DB="${POSTGRES_DB:-zflix}"
RETENTION_DAYS=30
MIN_SIZE_BYTES=1024  # Minimum expected backup size (1 KB) — abort if smaller

# -----------------------------------------------------------------------------
# Timestamp & filename
# -----------------------------------------------------------------------------
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

# -----------------------------------------------------------------------------
# Ensure backup directory exists
# -----------------------------------------------------------------------------
mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup of database '${POSTGRES_DB}'..."

# -----------------------------------------------------------------------------
# Perform pg_dump and compress on the fly
# -----------------------------------------------------------------------------
docker exec "${DB_CONTAINER}" \
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --no-password \
  | gzip -9 > "${BACKUP_FILE}"

# -----------------------------------------------------------------------------
# Size check — fail loudly if backup looks suspiciously small
# -----------------------------------------------------------------------------
ACTUAL_SIZE="$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}")"

if [ "${ACTUAL_SIZE}" -lt "${MIN_SIZE_BYTES}" ]; then
  echo "[ERROR] Backup file is only ${ACTUAL_SIZE} bytes — expected at least ${MIN_SIZE_BYTES} bytes." >&2
  echo "[ERROR] Removing suspicious file: ${BACKUP_FILE}" >&2
  rm -f "${BACKUP_FILE}"
  exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed: ${BACKUP_FILE} (${ACTUAL_SIZE} bytes)"

# -----------------------------------------------------------------------------
# Rotate old backups — delete files older than RETENTION_DAYS
# -----------------------------------------------------------------------------
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Rotating backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "${POSTGRES_DB}_*.sql.gz" -mtime +${RETENTION_DAYS} -print -delete

REMAINING="$(find "${BACKUP_DIR}" -name "${POSTGRES_DB}_*.sql.gz" | wc -l)"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Rotation complete. ${REMAINING} backup(s) retained."

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup process finished successfully."
