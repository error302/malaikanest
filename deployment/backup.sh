#!/bin/bash
# Basic DB + media backup script
BACKUP_DIR=/var/backups/kenya_baby_ecommerce
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
PG_USER=${1:-kenya_user}
PG_DB=${2:-kenya_ecom}
PG_HOST=localhost

pg_dump -U $PG_USER -h $PG_HOST $PG_DB | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz
rsync -a /opt/kenya_baby_ecommerce/backend/media/ $BACKUP_DIR/media_$TIMESTAMP/
find $BACKUP_DIR -type f -mtime +30 -delete
