#!/usr/bin/env bash
set -euo pipefail

# Simple smoke test for server/ci/ci-initdb.sh
# Runs an ephemeral Postgres container with the init script mounted and an output mount,
# waits for the marker file /ci-out/ci-initdb-done to appear, then prints psql -l and exits.

WORKDIR=$(pwd)
OUT_DIR="$WORKDIR/server/ci/out"
SCRIPT_HOST_PATH="$WORKDIR/server/ci/ci-initdb.sh"
CONTAINER_NAME="ci-initdb-smoke-test" 

echo "Smoke test: using init script: $SCRIPT_HOST_PATH"
if [ ! -f "$SCRIPT_HOST_PATH" ]; then
  echo "ERROR: init script not found at $SCRIPT_HOST_PATH" >&2
  exit 2
fi

mkdir -p "$OUT_DIR"
chmod -R 0777 "$OUT_DIR" || true
rm -f "$OUT_DIR/ci-initdb-done" || true

echo "Starting Postgres container with mounted init script and /ci-out"
docker run -d --name "$CONTAINER_NAME" \
  -e POSTGRES_PASSWORD=ci_test_pw \
  -e POSTGRES_USER=prochatadmin \
  -e POSTGRES_DB=prochatadmin \
  -v "$SCRIPT_HOST_PATH":/docker-entrypoint-initdb.d/ci-initdb.sh:ro \
  -v "$OUT_DIR":/ci-out:rw \
  postgres:15-alpine >/dev/null

echo "Waiting up to 60s for marker file $OUT_DIR/ci-initdb-done"
for i in $(seq 1 60); do
  if [ -f "$OUT_DIR/ci-initdb-done" ]; then
    echo "Marker found after $i seconds"
    cat "$OUT_DIR/ci-initdb-done" || true
    break
  fi
  sleep 1
done

if [ ! -f "$OUT_DIR/ci-initdb-done" ]; then
  echo "Marker not found; dumping container logs for debugging"
  docker logs "$CONTAINER_NAME" || true
  docker rm -f "$CONTAINER_NAME" || true
  exit 3
fi

echo "Listing databases inside container (psql -l)"
docker exec -u postgres "$CONTAINER_NAME" psql -U prochatadmin -c "\l" || true

echo "Cleaning up container"
docker rm -f "$CONTAINER_NAME" >/dev/null || true

echo "Smoke test succeeded"
exit 0
