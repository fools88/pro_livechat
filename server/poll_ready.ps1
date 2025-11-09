$max = 60
for ($i=0; $i -lt $max; $i++) {
  try {
    $r = Invoke-RestMethod -Uri 'http://127.0.0.1:8080/ready' -TimeoutSec 2
  } catch {
    $r = $null
  }
  if ($r -and $r.overall -eq 'ok') {
    Write-Host "READY_OK"
    $r | ConvertTo-Json -Depth 5
    exit 0
  }
  Start-Sleep -Seconds 1
}
Write-Host 'READY_TIMEOUT'
exit 1
