param(
  [int]$RunNumber,
  [string]$OutDir = "artifacts/run-$RunNumber",
  [int]$PollIntervalSeconds = 10
)

if (-not $RunNumber) { Write-Error "RunNumber is required"; exit 2 }

Write-Output ("[waitdl] waiting for run {0} to finish and then download artifacts to {1}" -f $RunNumber, $OutDir)

while ($true) {
  $infoJson = & gh run view $RunNumber --json status,conclusion 2>$null
  try { $info = $infoJson | ConvertFrom-Json } catch { $info = $null }
  if ($info -and $info.conclusion) {
    Write-Output ("[waitdl] run {0} finished with conclusion {1}" -f $RunNumber, $info.conclusion)
    break
  }
  Start-Sleep -Seconds $PollIntervalSeconds
}

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
& gh run download $RunNumber --dir $OutDir --limit 20
if ($LASTEXITCODE -ne 0) {
  Write-Output "[waitdl] limited download failed, retrying full download"
  & gh run download $RunNumber --dir $OutDir
}
Write-Output ("[waitdl] artifacts available in {0}" -f $OutDir)
