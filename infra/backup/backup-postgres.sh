#!/usr/bin/env sh
# Snapshot the journal's Postgres database and upload the dump to an
# S3-compatible bucket. Designed to be run on a cron — exits non-zero on
# any step that fails so the cron supervisor can alert.
#
# Required env vars:
#   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
#   BACKUP_S3_BUCKET            target bucket (no s3:// prefix)
#   BACKUP_S3_PREFIX            optional path prefix, e.g. "ajs/postgres"
#   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
#   BACKUP_RETENTION_DAYS       prune dumps older than N days (default 30)
#
# Optional:
#   BACKUP_S3_ENDPOINT_URL      use a non-AWS S3 endpoint (R2, MinIO)
#
# Usage:
#   ./backup-postgres.sh
#
# Restore (one-liner — adjust the dump filename):
#   aws s3 cp s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/ajs-2026-05-04T03-00-00Z.sql.gz - \
#     | gunzip | psql "$PG_DSN"

set -eu

: "${PGHOST:?PGHOST required}"
: "${PGUSER:?PGUSER required}"
: "${PGDATABASE:?PGDATABASE required}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET required}"

PREFIX="${BACKUP_S3_PREFIX:-ajs/postgres}"
RETENTION="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
DUMP_FILE="ajs-${TIMESTAMP}.sql.gz"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo "[$(date -u +%FT%TZ)] dumping $PGDATABASE from $PGHOST..."
pg_dump --no-owner --no-acl --format=plain "$PGDATABASE" \
    | gzip --best > "$TMP_DIR/$DUMP_FILE"

SIZE=$(wc -c < "$TMP_DIR/$DUMP_FILE")
echo "[$(date -u +%FT%TZ)] dump size: $SIZE bytes"

S3_URL="s3://${BACKUP_S3_BUCKET}/${PREFIX}/${DUMP_FILE}"
S3_OPTS=""
if [ -n "${BACKUP_S3_ENDPOINT_URL:-}" ]; then
    S3_OPTS="--endpoint-url $BACKUP_S3_ENDPOINT_URL"
fi

echo "[$(date -u +%FT%TZ)] uploading to $S3_URL..."
aws s3 cp $S3_OPTS \
    --storage-class STANDARD_IA \
    --metadata "source=ajs-backup-script,db=$PGDATABASE" \
    "$TMP_DIR/$DUMP_FILE" "$S3_URL"

if [ "$RETENTION" -gt 0 ]; then
    echo "[$(date -u +%FT%TZ)] pruning dumps older than $RETENTION days..."
    CUTOFF=$(date -u -d "-${RETENTION} days" +"%Y-%m-%d" 2>/dev/null \
        || date -u -v-${RETENTION}d +"%Y-%m-%d")
    aws s3 ls $S3_OPTS "s3://${BACKUP_S3_BUCKET}/${PREFIX}/" \
        | awk '{print $4}' \
        | grep -E '^ajs-[0-9]{4}-[0-9]{2}-[0-9]{2}T' \
        | while read -r KEY; do
            STAMP=$(echo "$KEY" | sed 's/^ajs-//; s/T.*$//')
            if [ "$STAMP" \< "$CUTOFF" ]; then
                aws s3 rm $S3_OPTS "s3://${BACKUP_S3_BUCKET}/${PREFIX}/${KEY}" || true
            fi
        done
fi

echo "[$(date -u +%FT%TZ)] backup complete: $DUMP_FILE"
