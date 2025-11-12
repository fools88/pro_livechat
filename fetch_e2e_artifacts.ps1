$repo='fools88/pro_livechat'
$pr=17
Write-Host "Fetching statusCheckRollup for PR#$pr"
$out = gh pr view $pr --repo $repo --json statusCheckRollup 2>$null
if (-not $out) { Write-Host 'gh pr view returned no data'; exit 1 }
$j = $out | ConvertFrom-Json
$runs = $j.statusCheckRollup | Where-Object { $_.workflowName -eq 'CI - Server tests + E2E' -and $_.name -like 'Full E2E*' } | Sort-Object startedAt -Descending
if (-not $runs) { Write-Host 'No Full E2E runs found'; exit 0 }
foreach ($r in $runs) {
  $url = $r.detailsUrl
  if ($url -match '/actions/runs/(\d+)') { $runId=$matches[1] } else { $runId='unknown' }
  Write-Host "Found runId=$runId conclusion=$($r.conclusion) startedAt=$($r.startedAt)"
  $outdir = "artifacts\\run-$runId"
  if (Test-Path $outdir) { Write-Host "Artifacts already present at $outdir, skipping download." } else {
    Write-Host "Downloading artifacts for run $runId to $outdir"
    gh run download $runId --repo $repo --name server-logs --dir $outdir || Write-Host "Download failed for run $runId"
  }
  # If logs present, show diagnostics
  $log1 = Join-Path $outdir 'server\ci_server.log'
  $log2dir = Join-Path $outdir 'server\logs'
  if (Test-Path $log1) {
    Write-Host "---- Showing diagnostic lines from $log1 ----"
    Select-String -Path $log1 -Pattern '== DB create:|create prochat|create prochat_db rc|create prochatadmin rc' -SimpleMatch -Context 0,2 | ForEach-Object { $_.Line }
    Write-Host "---- Tail 200 lines of $log1 ----"
    Get-Content $log1 -Tail 200 | ForEach-Object { Write-Host $_ }
  } elseif (Test-Path $log2dir) {
    $files = Get-ChildItem -Path $log2dir -Filter '*.log' -File | Sort-Object LastWriteTime -Descending
    foreach ($f in $files) {
      Write-Host "---- Showing diagnostic lines from $($f.FullName) ----"
      Select-String -Path $f.FullName -Pattern '== DB create:|create prochat|create prochat_db rc|create prochatadmin rc' -SimpleMatch -Context 0,2 | ForEach-Object { $_.Line }
      Write-Host "---- Tail 200 lines of $($f.FullName) ----"
      Get-Content $f.FullName -Tail 200 | ForEach-Object { Write-Host $_ }
    }
  } else {
    Write-Host "No server logs found in $outdir"
  }
}
