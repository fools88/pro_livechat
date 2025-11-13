#!/usr/bin/env bash
set -euo pipefail
# Wait for Postgres and Redis to be reachable over TCP
# Usage: scripts/ci/wait-for-ready.sh [PGHOST] [PGPORT] [REDIS_HOST] [REDIS_PORT] [MAX_RETRIES]

PGHOST=${1:-127.0.0.1}
PGPORT=${2:-5432}
REDIS_HOST=${3:-127.0.0.1}
REDIS_PORT=${4:-6379}
MAX_RETRIES=${5:-60}

echo "[wait-for-ready] checking Postgres at ${PGHOST}:${PGPORT} (max ${MAX_RETRIES} tries)"
for i in $(seq 1 ${MAX_RETRIES}); do
  if command -v pg_isready >/dev/null 2>&1; then
    if pg_isready -h ${PGHOST} -p ${PGPORT} >/dev/null 2>&1; then
      echo "[wait-for-ready] Postgres ready (attempt ${i})"; break
    fi
  else
    # try psql as fallback
    if psql -h ${PGHOST} -p ${PGPORT} -c '\l' >/dev/null 2>&1; then
      echo "[wait-for-ready] Postgres reachable via psql (attempt ${i})"; break
    fi
  fi
  echo "[wait-for-ready] Postgres not ready yet (attempt ${i}), sleeping 1s..."
  sleep 1
done

echo "[wait-for-ready] checking Redis at ${REDIS_HOST}:${REDIS_PORT} (max ${MAX_RETRIES} tries)"
if command -v redis-cli >/dev/null 2>&1; then
  for i in $(seq 1 ${MAX_RETRIES}); do
    if redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT} ping >/dev/null 2>&1; then
      echo "[wait-for-ready] Redis ready (attempt ${i})"; break
    fi
    echo "[wait-for-ready] Redis not ready yet (attempt ${i}), sleeping 1s..."
    sleep 1
  done
else
  echo "[wait-for-ready] redis-cli not available on runner; skipping Redis check"
fi

echo "[wait-for-ready] done"
