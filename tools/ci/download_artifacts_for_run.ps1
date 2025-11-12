param(
  [Parameter(Mandatory=$true)][int]$RunNumber,
  [string]$OutDir = "artifacts/run-$RunNumber"
)

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

Write-Output ("[dlrun] attempting gh run download for run {0}" -f $RunNumber)
& gh run download $RunNumber --dir $OutDir --limit 20
if ($LASTEXITCODE -ne 0) {
  Write-Output "[dlrun] limited download failed; fetching artifact list via API"
  $artifactsJson = & gh api repos/:owner/:repo/actions/runs/$RunNumber/artifacts --jq .artifacts -q 2>$null
  try { $artifacts = $artifactsJson | ConvertFrom-Json } catch { $artifacts = @() }
  foreach ($a in $artifacts) {
    $id = $a.id
    $name = $a.name
    $archiveUrl = $a.archive_download_url
    Write-Output ("[dlrun] artifact id={0} name={1} url={2}" -f $id, $name, $archiveUrl)
    ./download_artifact_by_url.ps1 -ArtifactUrl $archiveUrl -OutDir (Join-Path $OutDir $name)
  }
}

Write-Output ("[dlrun] done. artifacts in {0}" -f $OutDir)
