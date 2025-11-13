# rotate_minio.ps1 - stop current minio container and start a new one using existing volume with new root password
$line = Select-String -Path .\tmp_new_secrets.txt -Pattern '^MINIO_ROOT_PASSWORD='
if (-not $line) { Write-Error 'MINIO_ROOT_PASSWORD not found in tmp_new_secrets.txt'; exit 1 }
$minio = $line.Line -replace '^MINIO_ROOT_PASSWORD=', ''
# get current user from running container env
try {
    $envText = docker-compose exec -T minio env 2>$null
    $userLine = ($envText | Select-String -Pattern 'MINIO_ROOT_USER=') -replace 'MINIO_ROOT_USER=',''
    $user = $userLine.Trim()
} catch {
    Write-Host 'Could not read MINIO_ROOT_USER from running container; defaulting to "minioadmin"'
    $user = 'minioadmin'
}
Write-Host 'Stopping existing minio container (if running)...'
docker-compose stop minio
Write-Host 'Removing old container (if exists)...'
docker rm -f prochat-minio 2>$null
Write-Host 'Starting new minio container with preserved volume and new root password...'
# build docker run command args
$runCmd = @(
    'run', '-d', '--name', 'prochat-minio', '-p', '9000:9000', '-p', '9001:9001',
    '-e', "MINIO_ROOT_USER=$user", '-e', "MINIO_ROOT_PASSWORD=$minio",
    '-v', 'pro_livechat_minio-data:/data', 'minio/minio', 'server', '/data', '--console-address', ':9001'
)
# Start the container
& docker @runCmd
Start-Sleep -Seconds 5
Write-Host 'New minio container status:'
docker ps --filter name=prochat-minio --format "{{.Names}} {{.Status}}"
exit 0
