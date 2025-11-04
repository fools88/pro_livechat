@echo off
set DB_USER=prochatadmin
set DB_PASSWORD=prochatpassword123
set DB_HOST=127.0.0.1
set DB_NAME=prochat_db
set PORT=8081
set REQUIRE_WIDGET_TOKEN=true
set JWT_SECRET=prochat-rahasia
set MOCK_AI=true
set MOCK_VECTOR=true

node ..\run_server_local.js > ..\server-ci.log 2>&1
