param(
  [Parameter(Mandatory=$true)][string]$ArtifactUrl,
  [string]$OutDir = "artifacts/manual-download",
  [string]$TokenEnvVar = 'GITHUB_TOKEN'
)

if (-not $env:$TokenEnvVar) { Write-Error "Environment variable $TokenEnvVar is required with a GitHub token."; exit 2 }

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$headers = @{ Authorization = "token $($env:$TokenEnvVar)" }
Write-Output ("[dl] fetching artifact archive from {0} to {1}" -f $ArtifactUrl, $OutDir)

try {
  $tmpZip = Join-Path $OutDir "artifact.zip"
  Invoke-RestMethod -Uri $ArtifactUrl -Headers $headers -OutFile $tmpZip
  Write-Output "[dl] downloaded archive, extracting..."
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::ExtractToDirectory($tmpZip, $OutDir, $true)
  Remove-Item $tmpZip -Force
  Write-Output "[dl] extracted to $OutDir"
} catch {
  Write-Error "[dl] failed: $_"
  exit 3
}
