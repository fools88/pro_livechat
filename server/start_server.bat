@echo off
REM Start server with mocks and redirect logs
set MOCK_AI=true
set MOCK_VECTOR=true
set NODE_ENV=development
set PORT=8081
set ALLOW_LEGACY_WIDGET_KEY=true
cd /d %~dp0
node src\index.js > logs\server-foreground.log 2> logs\server-foreground.err
