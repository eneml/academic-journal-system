# Tiny image for the cron-driven Postgres backup. Only carries pg_dump
# (matched to the production server's major version) + the AWS CLI.
FROM postgres:17-alpine
RUN apk add --no-cache aws-cli ca-certificates tzdata
COPY backup-postgres.sh /usr/local/bin/backup-postgres
RUN chmod +x /usr/local/bin/backup-postgres
ENTRYPOINT ["/usr/local/bin/backup-postgres"]
