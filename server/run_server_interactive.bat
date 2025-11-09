@echo off
REM Run server with tracing and source maps enabled, redirect output to interactive log
set MOCK_AI=true
set MOCK_VECTOR=true
set NODE_ENV=development
set PORT=8081
cd /d %~dp0
node --trace-warnings --enable-source-maps src\index.js > logs\interactive.log 2>&1
