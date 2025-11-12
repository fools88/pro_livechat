param(
  [string]$Branch = 'main',
  [string]$Workflow = 'ci-e2e-clean.yml',
  [int]$MaxPollAttempts = 60,
  [int]$InitialIntervalSeconds = 10,
  [switch]$UseLatestRun
)

# Monitor improvements:
# - Only watch for a run created after this script starts (so we track the run we dispatched)
# - Short initial poll interval with exponential backoff up to 60s
# - Wait for the specific run to complete; on failure download artifacts into artifacts/run-<number>

$startTime = Get-Date
Write-Output ("[monitor] starting at {0}; watching workflow '{1}' branch '{2}'" -f $startTime, $Workflow, $Branch)

$attempt = 0
$interval = $InitialIntervalSeconds

while ($attempt -lt $MaxPollAttempts) {
  $attempt++
  Write-Output ("[monitor] attempt {0}/{1}: listing recent runs... (interval {2}s)" -f $attempt, $MaxPollAttempts, $interval)

  $runsJson = & gh run list --workflow=$Workflow --branch $Branch --json number,conclusion,createdAt -L 20 2>$null
  try { $runs = $runsJson | ConvertFrom-Json } catch { $runs = @() }

  # Normalize to array
  if ($null -ne $runs -and -not ($runs -is [System.Array])) { $runs = @($runs) }

  # find the first run that was created at/after our start time (allow small clock skew)
  $candidate = $null
  if ($UseLatestRun) {
    if ($runs -and $runs.Count -gt 0) { $candidate = $runs[0] }
  } else {
    foreach ($r in $runs) {
      try { $created = [DateTime]::Parse($r.createdAt) } catch { continue }
      if ($created -ge $startTime.AddSeconds(-30)) { $candidate = $r; break }
    }
  }

  if ($null -ne $candidate) {
    $runNumber = $candidate.number
    Write-Output ("[monitor] found run number={0} createdAt={1} conclusion={2}" -f $runNumber, $candidate.createdAt, $candidate.conclusion)

    # Poll until completion
    while ($true) {
      $infoJson = & gh run view $runNumber --json status,conclusion 2>$null
      try { $info = $infoJson | ConvertFrom-Json } catch { $info = $null }

      # If conclusion is non-null the run finished
      if ($info -and $info.conclusion) {
        Write-Output ("[monitor] run {0} finished with conclusion: {1}" -f $runNumber, $info.conclusion)
        if ($info.conclusion -eq 'success') {
          New-Item -ItemType File -Path tmp\ci_monitor_ready.txt -Force | Out-Null
          exit 0
        }

        # run failed -> download artifacts
        $outdir = "artifacts/run-$runNumber"
        New-Item -ItemType Directory -Path $outdir -Force | Out-Null
        & gh run download $runNumber --dir $outdir --limit 10
        if ($LASTEXITCODE -ne 0) {
          Write-Output ("[monitor] limited download failed (exit {0}), retrying full download" -f $LASTEXITCODE)
          & gh run download $runNumber --dir $outdir
        }
        Write-Output ("[monitor] artifacts downloaded to {0}" -f $outdir)
        exit 1
      }

      Start-Sleep -Seconds $interval
      $interval = [Math]::Min(60, [Math]::Round($interval * 1.5))
    }
  } else {
    Write-Output ("[monitor] no run created since {0} found yet; will retry" -f $startTime)
  }

  Start-Sleep -Seconds $interval
  $interval = [Math]::Min(60, [Math]::Round($interval * 1.5))
}

Write-Output ("[monitor] timed out waiting for a new run after {0} attempts" -f $MaxPollAttempts)
exit 2
