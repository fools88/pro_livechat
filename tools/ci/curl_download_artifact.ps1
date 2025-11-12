param(
  [Parameter(Mandatory=$true)][string]$ArtifactUrl,
  [string]$OutDir = "artifacts/manual-download",
  [string]$TokenEnvVar = 'GITHUB_TOKEN'
)

if (-not $env:$TokenEnvVar) { Write-Error "Environment variable $TokenEnvVar is required with a GitHub token."; exit 2 }

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$tmpZip = Join-Path $OutDir "artifact.zip"
$token = $env:$TokenEnvVar

Write-Output ("[curl-dl] curling {0} -> {1}" -f $ArtifactUrl, $tmpZip)
& curl -L -H "Authorization: token $token" -o $tmpZip $ArtifactUrl
if ($LASTEXITCODE -ne 0) { Write-Error "curl failed with $LASTEXITCODE"; exit 3 }

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($tmpZip, $OutDir, $true)
Remove-Item $tmpZip -Force
Write-Output ("[curl-dl] extracted to {0}" -f $OutDir)
