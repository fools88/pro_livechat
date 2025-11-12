
#!/bin/sh
set -e
# CI init script to ensure required DBs exist. Placed in /docker-entrypoint-initdb.d/
# This script runs as part of Postgres container initialization (docker-entrypoint).

echo "[ci-initdb] Running CI init script: ensure databases prochatadmin and prochat_db"

# psql will be available and the entrypoint runs this as the postgres user
# Postgres doesn't support CREATE DATABASE IF NOT EXISTS, so check and create.
echo "[ci-initdb] Ensuring databases exist using safe checks"
psql --username "$POSTGRES_USER" -t -c "SELECT 1 FROM pg_database WHERE datname='prochatadmin'" | grep -q 1 || psql --username "$POSTGRES_USER" -c "CREATE DATABASE prochatadmin"
psql --username "$POSTGRES_USER" -t -c "SELECT 1 FROM pg_database WHERE datname='prochat_db'" | grep -q 1 || psql --username "$POSTGRES_USER" -c "CREATE DATABASE prochat_db"
echo "[ci-initdb] Databases ensured (checks complete)"

# Write a marker file to a mounted path so the workflow can detect the init script ran.
# The workflow mounts ./server/ci/out on the host to /ci-out inside the container.
if [ -d /ci-out ] ; then
  # write status to stderr portably
  echo "[ci-initdb] writing marker /ci-out/ci-initdb-done" >&2 || true
  mkdir -p /ci-out || true
  echo "ci-initdb: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > /ci-out/ci-initdb-done || true
else
  echo "[ci-initdb] /ci-out not mounted, skipping marker write" >&2 || true
fi

echo "[ci-initdb] Done"
