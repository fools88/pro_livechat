# Temporary helper to start server for E2E with proper env
$env:DB_USER='prochatadmin'
$env:DB_PASSWORD='prochatpassword123'
$env:DB_NAME='prochat_db'
$env:DB_HOST='127.0.0.1'
$env:DB_PORT='5432'
$env:JWT_SECRET='prochat-rahasia'
$env:REQUIRE_WIDGET_TOKEN='true'
# Ensure server listens on PORT 8081 for CI/E2E expectations
$env:PORT='8081'

# Ensure log dir exists
$log = Join-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Path) -ChildPath 'server-ci.log'
try { New-Item -ItemType File -Path $log -Force | Out-Null } catch {}

# Run node and redirect all output to the log file
node 'server/run_server_local.js' *> $log
