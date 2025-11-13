# apply_pg_password2.ps1 - safer script to apply postgres password by creating tmp SQL and piping into container
$line = Select-String -Path .\tmp_new_secrets.txt -Pattern '^POSTGRES_PASSWORD='
if (-not $line) { Write-Error 'POSTGRES_PASSWORD not found in tmp_new_secrets.txt'; exit 1 }
$pg = $line.Line -replace '^POSTGRES_PASSWORD=', ''
$sql = "ALTER USER prochatadmin WITH PASSWORD '$pg';"
Set-Content -Path .\tmp_alter.sql -Value $sql -Encoding ASCII
Write-Host 'Created tmp_alter.sql (will not print its contents).'
# Pipe the SQL into psql inside the container
Write-Host 'Applying SQL inside container (docker-compose exec -T -u postgres db psql -U postgres -d postgres)'
Get-Content .\tmp_alter.sql | docker-compose exec -T -u postgres db psql -U postgres -d postgres
if ($LASTEXITCODE -ne 0) { Write-Error "psql exit code: $LASTEXITCODE"; exit $LASTEXITCODE }
Write-Host 'Password change applied.'
exit 0
