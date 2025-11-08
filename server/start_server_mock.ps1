$env:MOCK_AI='true'
$env:MOCK_VECTOR='true'
$env:PORT='8081'
$env:ALLOW_LEGACY_WIDGET_KEY='true'

# Jalankan dari direktori file ini agar path relatif (src/index.js) benar
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Pastikan folder logs ada
if (-not (Test-Path -LiteralPath "$scriptDir\logs")) {
	New-Item -ItemType Directory -Path "$scriptDir\logs" | Out-Null
}

# Start server sebagai proses terpisah dan arahkan log ke file
Start-Process -FilePath 'node' -ArgumentList 'src/index.js' -WorkingDirectory $scriptDir -NoNewWindow -RedirectStandardOutput "$scriptDir\logs\server-foreground.log" -RedirectStandardError "$scriptDir\logs\server-foreground.err"

Write-Output "Server start command executed (mock mode)"
