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
