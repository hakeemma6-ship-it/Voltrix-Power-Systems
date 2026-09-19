#!/bin/bash
# Voltrix Power Systems - Automatic Database & App Configuration Backup Script
set -e

# Configuration
BACKUP_DIR="/var/backups/voltrix"
RETENTION_DAYS=14
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="voltrix_backup_${TIMESTAMP}"
TEMP_DIR="/tmp/${BACKUP_NAME}"

echo "[ Voltrix Backup System Starting at $(date) ]"

# Create directories
mkdir -p "${BACKUP_DIR}"
mkdir -p "${TEMP_DIR}"

# 1. Export MongoDB if configuration is available in env
if [ -n "$MONGOURI" ]; then
    echo "Dumping MongoDB Database..."
    mongodump --uri="$MONGOURI" --out="${TEMP_DIR}/mongodb"
else
    echo "MONGOURI not set. Attempting to clone local files/in-memory seeds..."
fi

# 2. Backup env assets & dynamic content
echo "Staging environment config and files..."
if [ -f "/app/.env" ]; then
    cp "/app/.env" "${TEMP_DIR}/system.env"
fi

# 3. Compress snapshot
echo "Creating compressed tarball..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "/tmp" "${BACKUP_NAME}"

# Clean temp directory
rm -rf "${TEMP_DIR}"

# 4. Prune older backups beyond retention
echo "Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "voltrix_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "[ Backup Completed Successfully: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz ]"
