$max = 30
for ($i=0; $i -lt $max; $i++) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8081/ready' -TimeoutSec 3
    if ($r.StatusCode -eq 200) {
      Write-Output 'READY_OK'
      $r.Content | Out-File -FilePath 'C:\Benny\pro_livechat\tmp\ready_response.txt' -Encoding utf8
      exit 0
    }
  } catch {
    # ignore
  }
  Start-Sleep -Seconds 2
}
Write-Error 'READY_TIMEOUT'
exit 1
