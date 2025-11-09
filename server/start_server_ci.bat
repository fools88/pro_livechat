@echo off
rem Start server for CI/local with MOCK flags and log to server-ci.log
set DB_USER=postgres
set DB_PASSWORD=postgres
set DB_NAME=prochat_db
set DB_HOST=127.0.0.1
set DB_PORT=5432
set MOCK_AI=true
set MOCK_VECTOR=true
set LOG_LEVEL=debug
start "prochat-server" /B node src/index.js > server-ci.log 2>&1
echo Server started (background). Logs: %~dp0server-ci.log
