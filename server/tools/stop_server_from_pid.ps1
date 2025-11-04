$path = 'server/tmp/server_started.txt'
if (Test-Path $path) {
  Get-Content $path | ForEach-Object {
    $p = $_.Trim()
    if ($p -match '^[0-9]+$') {
      try { Stop-Process -Id [int]$p -Force -ErrorAction SilentlyContinue; Write-Output "Stopped PID $p" } catch { Write-Output "Failed to stop PID $p" }
    } else { Write-Output "Ignored line: '$p'" }
  }
  Remove-Item $path -ErrorAction SilentlyContinue
  Write-Output "Removed $path"
} else { Write-Output "No $path found" }
