#!/usr/bin/env bash
OUTFILE="$(pwd)/tmp/debug_bundle.txt"
mkdir -p "$(pwd)/tmp"
echo "===== Debug bundle generated at $(date -u)" > "$OUTFILE"
if [ -f "$(pwd)/tmp/server_started.txt" ]; then
  echo "--- server_started.txt ---" >> "$OUTFILE"
  tail -n +1 "$(pwd)/tmp/server_started.txt" >> "$OUTFILE"
fi
if [ -f "$(pwd)/tmp/self_ready.log" ]; then
  echo "--- self_ready.log (last 200 lines) ---" >> "$OUTFILE"
  tail -n 200 "$(pwd)/tmp/self_ready.log" >> "$OUTFILE"
fi
if [ -f "$(pwd)/tmp/ready_checks.log" ]; then
  echo "--- ready_checks.log (last 200 lines) ---" >> "$OUTFILE"
  tail -n 200 "$(pwd)/tmp/ready_checks.log" >> "$OUTFILE"
fi
if [ -f "$(pwd)/server/server-ci.log" ]; then
  echo "--- server-ci.log (last 500 lines) ---" >> "$OUTFILE"
  tail -n 500 "$(pwd)/server/server-ci.log" >> "$OUTFILE"
fi
echo "Debug bundle written to $OUTFILE"
