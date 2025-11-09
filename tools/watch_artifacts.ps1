$path = 'c:\Benny\pro_livechat\artifacts'
$seen = @(Get-ChildItem -Path $path -Directory | Select-Object -ExpandProperty Name)
Write-Output "SEEN:$($seen -join ',')"
for ($i=0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 10
    $current = @(Get-ChildItem -Path $path -Directory | Select-Object -ExpandProperty Name)
    $new = $current | Where-Object { $seen -notcontains $_ }
    if ($new -and $new.Count -gt 0) {
        Write-Output ("NEW:" + ($new -join ','))
        exit 0
    } else {
        Write-Output ("CHECK {0}: no new runs" -f $i)
    }
}
Write-Output 'NO_NEW_FOUND'
exit 0
