# Postgres backup

A small cron-driven Postgres dump uploaded to an S3-compatible bucket
(AWS S3, Cloudflare R2, MinIO, etc).

## Files

| Path | Purpose |
|------|---------|
| `backup-postgres.sh` | The dump-and-upload script. Idempotent, exits non-zero on failure. |
| `Dockerfile` | Wraps the script in an image with `pg_dump` + `aws-cli`. |

## How it works

```
pg_dump (plain SQL) → gzip → aws s3 cp → optional retention prune
```

Each run creates a file named `ajs-<UTC-timestamp>.sql.gz` under the
configured prefix. Files older than `BACKUP_RETENTION_DAYS` (default 30)
are pruned at the end of every run.

## Required env vars

| Variable | Notes |
|----------|-------|
| `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD` | Postgres connection. `pg_dump` reads these directly. |
| `BACKUP_S3_BUCKET` | Target bucket (no `s3://` prefix). |
| `BACKUP_S3_PREFIX` | Optional path prefix; defaults to `ajs/postgres`. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | S3 credentials (or use IAM role / OIDC on the runtime). |
| `AWS_DEFAULT_REGION` | Required by `aws-cli`. |
| `BACKUP_S3_ENDPOINT_URL` | Set when using R2 / MinIO instead of AWS. |
| `BACKUP_RETENTION_DAYS` | Default 30. Set to 0 to skip pruning. |

## Running

### Ad-hoc

```sh
./backup-postgres.sh
```

### Cron on a host

```cron
# top of every day at 03:15 UTC
15 3 * * * /usr/local/bin/backup-postgres >> /var/log/ajs-backup.log 2>&1
```

### Docker compose (sidecar pattern)

Add to your `docker-compose.prod.yml`:

```yaml
  backup:
    build: ./infra/backup
    image: ajs-backup:latest
    restart: "no"
    profiles: [backup]
    environment:
      PGHOST: postgres
      PGUSER: ${DB_USERNAME:-journal}
      PGPASSWORD: ${DB_PASSWORD}
      PGDATABASE: ${DB_NAME:-academic_journal}
      BACKUP_S3_BUCKET: ${BACKUP_S3_BUCKET}
      BACKUP_S3_PREFIX: ${BACKUP_S3_PREFIX:-ajs/postgres}
      AWS_ACCESS_KEY_ID: ${BACKUP_AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${BACKUP_AWS_SECRET_ACCESS_KEY}
      AWS_DEFAULT_REGION: ${BACKUP_AWS_REGION:-auto}
      BACKUP_S3_ENDPOINT_URL: ${BACKUP_S3_ENDPOINT_URL:-}
    depends_on:
      postgres:
        condition: service_healthy
```

Then schedule it externally — host crontab, Kubernetes CronJob, or
GitHub Actions on a schedule:

```yaml
# .github/workflows/backup.yml (sketch)
on:
  schedule:
    - cron: "15 3 * * *"
jobs:
  backup:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - run: docker compose -f docker-compose.prod.yml --profile backup run --rm backup
        env: ...
```

## Restore

The dump is plain `psql`-compatible SQL, gzip-compressed:

```sh
aws s3 cp s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/ajs-2026-05-04T03-15-00Z.sql.gz - \
    | gunzip \
    | psql "postgres://journal:$PGPASSWORD@$PGHOST/academic_journal"
```

For point-in-time recovery beyond what these snapshots give you, run a
streaming replica with WAL archiving — out of scope for this script.
