#!/bin/bash
# AILOS Production Database Backup Script
# Created: 2026-07-28T11:29:53.367237
# Purpose: Full PostgreSQL dump for disaster recovery

BACKUP_DIR="/www/xuewaiyu-backend/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ailos_backup_$TIMESTAMP.sql.gz"

# Load env
set -a
source /www/xuewaiyu-backend/.env.production
set +a

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting AILOS database backup..."

# Extract connection params from DATABASE_URL
# Format: postgresql://user:pass@host:port/db
DB_URL="$DATABASE_URL"

pg_dump "$DB_URL" --no-owner --no-acl 2>&1 | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    FILE_SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE" 2>/dev/null)
    echo "[$(date)] Backup successful: $BACKUP_FILE ($FILE_SIZE bytes)"
    
    # Clean old backups
    find "$BACKUP_DIR" -name "ailos_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "[$(date)] Cleaned backups older than $RETENTION_DAYS days"
else
    echo "[$(date)] ERROR: Backup failed!"
    exit 1
fi

echo "[$(date)] Backup complete. Files in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR" | tail -5
