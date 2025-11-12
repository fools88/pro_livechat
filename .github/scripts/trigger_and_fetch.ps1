# Trigger and fetch artifacts for CI workflow (PowerShell script)
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .github\scripts\trigger_and_fetch.ps1

$ErrorActionPreference = 'Stop'
$repo = 'fools88/pro_livechat'
$workflowId = 205254183
$branch = 'test/bundle-analyze-run'
$timeoutMinutes = 10

Write-Host "Repo: $repo"
Write-Host "Branch: $branch"

try {
    Write-Host "Creating empty commit to trigger workflow..."
    git commit --allow-empty -m 'ci: trigger diagnostic run (ps1)' 2>$null
} catch {
    Write-Host "git commit returned non-zero or no changes; continuing"
}

Write-Host "Pushing branch to origin..."
git push origin HEAD:refs/heads/$branch

# wait a short moment for GH to register run
Start-Sleep -Seconds 3

Write-Host "Querying latest run for workflow id $workflowId on branch $branch..."
$runList = gh run list --repo $repo --workflow $workflowId --branch $branch --limit 1 --json databaseId 2>&1
Write-Host "gh run list output:`n$runList"

if ($runList -match '\[\]' -or -not ($runList -match '\S')) {
    Write-Host "No run found in response. Exiting with code 2."; exit 2
}

# Try to parse JSON
try {
    $json = $runList | ConvertFrom-Json
    if ($null -eq $json -or $json.Count -eq 0) { Write-Host 'No runs in parsed JSON'; exit 2 }
    $runId = $json[0].databaseId
} catch {
    Write-Host 'Failed to parse gh run list JSON. Raw output:'
    Write-Host $runList
    exit 3
}

Write-Host "Found run databaseId: $runId"

# Poll status
$deadline = (Get-Date).AddMinutes($timeoutMinutes)
while ((Get-Date) -lt $deadline) {
    Write-Host "Checking status of run $runId..."
    $status = gh run view $runId --repo $repo --json status --jq '.status' 2>&1
    Write-Host "gh run view returned: $status"
    if ($status -eq 'completed') { break }
    Start-Sleep -Seconds 6
}

# Final status
try {
    $final = gh run view $runId --repo $repo --json status,conclusion --jq '.status + " " + .conclusion'
    Write-Host "Final run status/conclusion: $final"
} catch {
    Write-Host "Failed to fetch final status: $_"
}

# Attempt to download artifacts
$dst = Join-Path -Path (Get-Location) -ChildPath ("artifacts/run-$runId")
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Write-Host "Attempting to download artifacts to: $dst"
try {
    gh run download $runId --repo $repo --dir $dst 2>&1 | Write-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Host "gh run download returned non-zero exit code: $LASTEXITCODE"
        throw "download-failed"
    }
    Write-Host "Artifacts downloaded to $dst"
} catch {
    Write-Host "Artifacts download failed or none present. Saving full run log to $dst/run_$runId.log"
    try {
        gh run view $runId --repo $repo --log > (Join-Path $dst ("run_$runId.log"))
        Write-Host "Saved run log to $dst/run_$runId.log"
    } catch {
        Write-Host "Failed to save run log: $_"
    }
}

Write-Host "Script completed."