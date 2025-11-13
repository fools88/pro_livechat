# test_db_conn.ps1 - test DB connection using new POSTGRES_PASSWORD
$line = Select-String -Path .\tmp_new_secrets.txt -Pattern '^POSTGRES_PASSWORD=' -Quiet
if (-not $line) { Write-Error 'POSTGRES_PASSWORD not found'; exit 1 }
$pg = (Select-String -Path .\tmp_new_secrets.txt -Pattern '^POSTGRES_PASSWORD=').Line -replace '^POSTGRES_PASSWORD=', ''
Write-Host 'Testing DB connection to prochat_db as prochatadmin...'
# Use docker-compose exec with env var
$envArgs = "-e PGPASSWORD=$pg"
# Use docker exec via container name to avoid quoting issues
$container = 'prochat-db'
# Run psql inside container
 $cmd = 'psql -U prochatadmin -d prochat_db -c "select 1 as ok;"'
# Execute
docker exec -i $container bash -lc "PGPASSWORD='$pg' $cmd"
exit $LASTEXITCODE
