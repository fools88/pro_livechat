#!/bin/bash

###############################################################################
# DATABASE RESTORE SCRIPT
# 
# DISASTER RECOVERY: Restore database from backup
# 
# USAGE:
#   ./restore_database.sh backup_prochat_db_20251106_020000.sql.gz
# 
# WARNING: This will OVERWRITE current database!
# Make sure to backup current database first if needed.
###############################################################################

# Load environment variables
source .env 2>/dev/null || true

# Configuration
DB_CONTAINER="${DB_CONTAINER:-prochat-db}"
DB_USER="${DB_USER:-prochatadmin}"
DB_NAME="${DB_NAME:-prochat_db}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backup file provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: No backup file specified!${NC}"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ] && [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Use full path if only filename provided
if [ ! -f "$BACKUP_FILE" ]; then
    BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
fi

echo -e "${YELLOW}⚠️  WARNING: This will OVERWRITE the current database!${NC}"
echo ""
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo "Starting database restore..."

# Check if container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo -e "${RED}❌ Database container '$DB_CONTAINER' is not running!${NC}"
    exit 1
fi

# Drop existing database (careful!)
echo "Dropping existing database..."
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"

# Create new database
echo "Creating new database..."
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"

# Restore from backup
echo "Restoring from backup..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" "$DB_NAME"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
    echo ""
    echo "Verify with: docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c '\dt'"
else
    echo -e "${RED}❌ Restore failed!${NC}"
    exit 1
fi

exit 0
