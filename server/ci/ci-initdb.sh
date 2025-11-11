
#!/bin/sh
set -e
# CI init script to ensure required DBs exist. Placed in /docker-entrypoint-initdb.d/
# This script runs as part of Postgres container initialization (docker-entrypoint).

echo "[ci-initdb] Running CI init script: ensure databases prochatadmin and prochat_db"

# psql will be available and the entrypoint runs this as the postgres user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-SQL
  CREATE DATABASE IF NOT EXISTS prochatadmin;
  CREATE DATABASE IF NOT EXISTS prochat_db;
SQL

echo "[ci-initdb] Databases ensured"

# Write a marker file to a mounted path so the workflow can detect the init script ran.
# The workflow mounts ./server/ci/out on the host to /ci-out inside the container.
if [ -d /ci-out ] ; then
  echo "[ci-initdb] writing marker /ci-out/ci-initdb-done" >/dev/stderr || true
  mkdir -p /ci-out || true
  echo "ci-initdb: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > /ci-out/ci-initdb-done || true
else
  echo "[ci-initdb] /ci-out not mounted, skipping marker write" >/dev/stderr || true
fi

echo "[ci-initdb] Done"
