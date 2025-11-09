#!/bin/bash

###############################################################################
# AUTOMATED DATABASE BACKUP SCRIPT
# 
# WHAT IT DOES:
# 1. Create compressed backup of PostgreSQL database
# 2. Upload to MinIO (local object storage - GRATIS!)
# 3. Keep only 7 latest backups (hemat storage)
# 4. Send notification if backup fails
# 
# SETUP:
# 1. chmod +x backup_database.sh
# 2. Add to crontab: 0 2 * * * /path/to/backup_database.sh
#    (Runs every day at 2 AM)
# 
# DISASTER RECOVERY:
# - Restore: gunakan script restore_database.sh
# - RTO: < 30 minutes (waktu restore)
# - RPO: < 24 hours (daily backup)
# 
# COST: $0 (semua tools gratis!)
###############################################################################

# Load environment variables
source .env 2>/dev/null || true

# Configuration
DB_CONTAINER="${DB_CONTAINER:-prochat-db}"
DB_USER="${DB_USER:-prochatadmin}"
DB_NAME="${DB_NAME:-prochat_db}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DB_NAME}_${DATE}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Check if Docker container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    log_error "Database container '$DB_CONTAINER' is not running!"
    exit 1
fi

log "Starting database backup..."
log "Database: $DB_NAME"
log "Container: $DB_CONTAINER"
log "Backup file: $BACKUP_FILE"

# Create backup
log "Creating compressed backup..."
if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    log_success "Backup created successfully! Size: $BACKUP_SIZE"
else
    log_error "Backup failed!"
    exit 1
fi

# Verify backup integrity
log "Verifying backup integrity..."
if gunzip -t "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null; then
    log_success "Backup integrity verified"
else
    log_error "Backup file is corrupted!"
    exit 1
fi

# Upload to MinIO (optional - if MinIO is configured)
if command -v mc &> /dev/null; then
    log "Uploading to MinIO..."
    if mc cp "${BACKUP_DIR}/${BACKUP_FILE}" minio/prochat-backups/ 2>/dev/null; then
        log_success "Backup uploaded to MinIO"
    else
        log_warning "MinIO upload failed (skipping)"
    fi
fi

# Clean old backups (keep only last N days)
log "Cleaning old backups (keeping last ${RETENTION_DAYS} days)..."
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS)

if [ -n "$OLD_BACKUPS" ]; then
    DELETED_COUNT=$(echo "$OLD_BACKUPS" | wc -l)
    echo "$OLD_BACKUPS" | xargs rm -f
    log_success "Deleted $DELETED_COUNT old backup(s)"
else
    log "No old backups to delete"
fi

# List current backups
log "Current backups:"
ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}' | tee -a "$LOG_FILE"

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Total backup size: $TOTAL_SIZE"

log_success "Backup completed successfully!"
log "=========================================="

exit 0
