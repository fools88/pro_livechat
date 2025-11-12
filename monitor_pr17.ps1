$repo='fools88/pro_livechat'
$pr=17
Write-Host "Starting PR checks monitor for $repo PR#$pr"
while ($true) {
  try {
    $out = gh pr view $pr --repo $repo --json statusCheckRollup 2>$null
  } catch {
    Write-Host "Error fetching PR checks: $_"; Start-Sleep -Seconds 15; continue
  }
  if (-not $out) { Write-Host 'No data yet'; Start-Sleep -Seconds 10; continue }
  $j = $out | ConvertFrom-Json
  if (-not $j.statusCheckRollup) { Write-Host 'No statusCheckRollup'; Start-Sleep -Seconds 10; continue }
  $checks = $j.statusCheckRollup
  $total = $checks.Count
  $succ = ($checks | Where-Object { $_.conclusion -eq 'SUCCESS' }).Count
  $fail = ($checks | Where-Object { $_.conclusion -eq 'FAILURE' }).Count
  $pend = ($checks | Where-Object { $_.status -ne 'COMPLETED' -or $_.conclusion -eq $null }).Count
  $time=(Get-Date).ToString('u')
  Write-Host "[$time] total=$total success=$succ fail=$fail pending=$pend"
  if ($pend -eq 0) {
    Write-Host 'All checks completed; printing summary:'
    foreach ($c in $checks) { Write-Host "$($c.workflowName) | $($c.name) | status=$($c.status) | conclusion=$($c.conclusion) | url=$($c.detailsUrl)" }
    break
  }
  Start-Sleep -Seconds 20
}
