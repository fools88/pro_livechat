# apply_pg_password.ps1
$line = Select-String -Path .\tmp_new_secrets.txt -Pattern '^POSTGRES_PASSWORD=' -SimpleMatch
if (-not $line) { Write-Error 'POSTGRES_PASSWORD not found in tmp_new_secrets.txt'; exit 1 }
$pg = $line.Line -replace '^POSTGRES_PASSWORD=', ''
Write-Host 'Altering postgres password for user prochatadmin (this will run psql inside container)'
$escaped = $pg.Replace("'", "''")
$cmd = "psql -c \"ALTER USER prochatadmin WITH PASSWORD '$escaped';\""
docker-compose exec -u postgres db bash -lc $cmd
exit $LASTEXITCODE
