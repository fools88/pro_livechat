# generate_and_print_secrets.ps1 - generate secrets and print once to console (no files written)
Add-Type -AssemblyName System.Security
$rand = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32; $rand.GetBytes($bytes); $PG = [Convert]::ToBase64String($bytes)
$bytes = New-Object byte[] 32; $rand.GetBytes($bytes); $MINIO = [Convert]::ToBase64String($bytes)
$bytes = New-Object byte[] 32; $rand.GetBytes($bytes); $JWT = [Convert]::ToBase64String($bytes)
$bytes = New-Object byte[] 48; $rand.GetBytes($bytes); $WIDGET = [Convert]::ToBase64String($bytes)

Write-Host '--- COPY THESE SECRETS ONCE: store in password manager now ---' -ForegroundColor Yellow
Write-Host ''
Write-Host "POSTGRES_PASSWORD=$PG" -ForegroundColor White
Write-Host "MINIO_ROOT_PASSWORD=$MINIO" -ForegroundColor White
Write-Host "CI_JWT_SECRET=$JWT" -ForegroundColor White
Write-Host "WIDGET_SIGNING_KEY=$WIDGET" -ForegroundColor White
Write-Host ''
Write-Host 'After you save them, reply here with: "SAVED"' -ForegroundColor Cyan
