# set_repo_secrets.ps1 - read tmp_new_secrets.txt and set repository secrets via gh
param(
    [string]$Repo = 'fools88/pro_livechat'
)
if (-Not (Test-Path .\tmp_new_secrets.txt)) { Write-Error 'tmp_new_secrets.txt not found'; exit 1 }
$lines = Get-Content .\tmp_new_secrets.txt | Where-Object { $_ -match '=' }
foreach ($line in $lines) {
    $parts = $line -split '=',2
    $name = $parts[0].Trim()
    $value = $parts[1]
    Write-Host "Setting secret: $name"
    # Use gh secret set reading from stdin to avoid printing the secret value
    $value | gh secret set $name --repo $Repo
}
# Also set common aliases for DB
# Read POSTGRES_PASSWORD value
$pg = (Select-String -Path .\tmp_new_secrets.txt -Pattern '^POSTGRES_PASSWORD=').Line -replace '^POSTGRES_PASSWORD=',''
if ($pg) {
    Write-Host 'Setting DB_PASSWORD and CI_DB_PASSWORD aliases'
    $pg | gh secret set DB_PASSWORD --repo $Repo
    $pg | gh secret set CI_DB_PASSWORD --repo $Repo
}
# Set JWT_SECRET alias if needed
$jwt = (Select-String -Path .\tmp_new_secrets.txt -Pattern '^CI_JWT_SECRET=').Line -replace '^CI_JWT_SECRET=',''
if ($jwt) {
    $jwt | gh secret set JWT_SECRET --repo $Repo
}
Write-Host 'All secrets set (or attempted).'
exit 0
