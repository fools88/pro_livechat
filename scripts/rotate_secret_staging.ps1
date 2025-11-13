<#
PowerShell helper to perform a dry-run of secret rotation on staging.
This script does NOT perform the rotation automatically. It:
 - shows the steps to run interactively
 - validates access to required CLIs: gh, docker, mc
 - optionally updates GitHub secrets (if --apply provided)

Usage (dry-run):
  pwsh .\scripts\rotate_secret_staging.ps1

Apply (careful):
  pwsh .\scripts\rotate_secret_staging.ps1 --apply

#>
param(
  [switch]$Apply = $false
)

function Check-CLI([string]$cmd) {
  $p = Get-Command $cmd -ErrorAction SilentlyContinue
  if (-not $p) { Write-Host "MISSING: $cmd" -ForegroundColor Yellow; return $false }
  Write-Host "OK: $cmd -> $($p.Source)"
  return $true
}

Write-Host "Rotate secret staging dry-run"
Check-CLI gh | Out-Null
Check-CLI docker | Out-Null
Check-CLI mc | Out-Null

if (-not $Apply) {
  Write-Host "\nThis is a dry-run. The script will not change secrets unless run with --apply." -ForegroundColor Cyan
}

# Steps to perform (manual)
$steps = @(
  "1) Generate new secrets securely and store in vault/password manager",
  "2) Verify staging backups and notify team; maintenance window",
  "3) (Optional) Change DB password in Postgres via psql: ALTER USER prochatadmin WITH PASSWORD '<NEW>'",
  "4) Test connect using PGPASSWORD and psql (do not restart app yet)",
  "5) Update GitHub Actions secret 'CI_DB_PASSWORD' in repo Settings or via 'gh secret set'",
  "6) Update MINIO_ROOT_USER / MINIO_ROOT_PASSWORD in repo secrets if needed",
  "7) Trigger redeploy of staging or restart service container",
  "8) Run verification: curl /ready, perform MinIO upload/download, check logs",
  "9) If all OK: record entry into docs/ROTATION_LOG.md and notify stakeholders",
  "10) If failure: revert secrets to previous values and redeploy immediately"
)

Write-Host "\nChecklist (manual)"
foreach ($s in $steps) { Write-Host " - $s" }

if ($Apply) {
  Write-Host "\nAPPLY MODE: will attempt to update GitHub secrets (gh) and trigger a redeploy." -ForegroundColor Red
  $confirm = Read-Host "Type 'CONFIRM' to proceed"
  if ($confirm -ne 'CONFIRM') { Write-Host "Aborted by user."; exit 1 }

  # Example of setting a secret via gh (uncomment and adapt)
  # echo -n 'NEW_PASSWORD' | gh secret set CI_DB_PASSWORD --body -
  Write-Host "(This script is intentionally conservative. Please run the gh commands shown above manually or adapt this script.)"
}

Write-Host "\nDry-run complete. Review the checklist and proceed with caution."