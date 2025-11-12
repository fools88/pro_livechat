$repo='fools88/pro_livechat'
$workflow='ci-e2e-clean.yml'
$max=120
for ($i=0; $i -lt $max; $i++) {
  $attempt = $i + 1
  $r = gh api repos/$repo/actions/workflows/$workflow/runs --jq '.workflow_runs[0] | {id:.id, status:.status, conclusion:.conclusion, updated_at:.updated_at}' 2>$null
  if (-not $r) { Write-Host "no runs found yet (attempt $attempt)"; Start-Sleep -Seconds 15; continue }
  $obj = $r | ConvertFrom-Json
  Write-Host "latest run id=$($obj.id) status=$($obj.status) conclusion=$($obj.conclusion) updated=$($obj.updated_at)"
  if ($obj.status -eq 'completed') {
    Write-Host 'Run completed; attempting artifact download...'
    gh run download $obj.id --repo $repo -n server-ci-logs --dir ".\artifacts\$($obj.id)" 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host 'Artifact download attempted'; } else { Write-Host 'No server-ci-logs artifact found or download failed'; }
    exit 0
  }
  Start-Sleep -Seconds 15
}
Write-Host 'Max attempts reached, stopping.'
exit 1
