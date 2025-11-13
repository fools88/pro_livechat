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

  # ask for databaseId too so we can query artifact metadata if needed
  $runsJson = & gh run list --workflow=$Workflow --branch $Branch --json number,conclusion,createdAt,databaseId -L 20 2>$null
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

        # run failed -> download artifacts robustly
        $outdir = "artifacts/run-$runNumber"
        New-Item -ItemType Directory -Path $outdir -Force | Out-Null

        # try gh run download first (works for many versions)
        & gh run download $runNumber --dir $outdir 2>$null
        if ($LASTEXITCODE -eq 0) {
          Write-Output ("[monitor] artifacts downloaded to {0} via gh run download" -f $outdir)
          exit 1
        }

        Write-Output "[monitor] gh run download failed or not supported - falling back to API artifact download"

        # determine repository name (owner/repo)
        try {
          $repo = & gh repo view --json nameWithOwner --jq .nameWithOwner 2>$null
          $repo = $repo.Trim()
        } catch { $repo = $null }

        if (-not $repo) {
          Write-Output "[monitor] cannot determine repo name via 'gh repo view' - aborting artifact fallback"
          exit 1
        }

        # Use the workflow run databaseId (if present) to list artifacts via the REST API
        $runDbId = $candidate.databaseId
        if (-not $runDbId) { $runDbId = $runNumber }

        $artifactsJson = & gh api repos/$repo/actions/runs/$runDbId/artifacts 2>$null
        try { $artifacts = $artifactsJson | ConvertFrom-Json } catch { $artifacts = $null }

        if (-not $artifacts -or -not $artifacts.artifacts) {
          Write-Output "[monitor] no artifacts metadata found for run $runNumber"
          exit 1
        }

        $token = (& gh auth token).Trim()
        foreach ($a in $artifacts.artifacts) {
          $name = $a.name
          $url = $a.archive_download_url
          if (-not $url) { continue }
          $zipPath = Join-Path $outdir ("{0}.zip" -f $name)
          Write-Output ("[monitor] downloading artifact '{0}' ({1} bytes) to {2}" -f $name, $a.size_in_bytes, $zipPath)
          try {
            Invoke-WebRequest -Uri $url -Headers @{ Authorization = "token $token"; Accept = 'application/octet-stream' } -OutFile $zipPath -UseBasicParsing -ErrorAction Stop
            # Extract
            try { Expand-Archive -Path $zipPath -DestinationPath $outdir -Force -ErrorAction Stop } catch { Write-Output ("[monitor] warning: failed to expand {0}: {1}" -f $zipPath, $_.Exception.Message) }
          } catch {
            Write-Output ("[monitor] failed to download artifact {0}: {1}" -f $name, $_.Exception.Message)
          }
        }

        Write-Output ("[monitor] artifacts downloaded/extracted to {0}" -f $outdir)
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
