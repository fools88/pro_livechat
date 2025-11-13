param(
  [string]$PgHost = '127.0.0.1',
  [int]$PgPort = 5432,
  [string]$RedisHost = '127.0.0.1',
  [int]$RedisPort = 6379,
  [int]$MaxRetries = 60
)

Write-Output "[wait-for-ready] checking Postgres at $PgHost:$PgPort (max $MaxRetries tries)"
for ($i = 1; $i -le $MaxRetries; $i++) {
  if (Get-Command pg_isready -ErrorAction SilentlyContinue) {
    $res = & pg_isready -h $PgHost -p $PgPort 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Output "[wait-for-ready] Postgres ready (attempt $i)"; break }
  } else {
    try {
      & psql -h $PgHost -p $PgPort -c "\l" > $null 2>&1
      Write-Output "[wait-for-ready] Postgres reachable via psql (attempt $i)"; break
    } catch { }
  }
  Write-Output "[wait-for-ready] Postgres not ready yet (attempt $i), sleeping 1s..."
  Start-Sleep -Seconds 1
}

Write-Output "[wait-for-ready] checking Redis at $RedisHost:$RedisPort (max $MaxRetries tries)"
if (Get-Command redis-cli -ErrorAction SilentlyContinue) {
  for ($i = 1; $i -le $MaxRetries; $i++) {
    try {
      & redis-cli -h $RedisHost -p $RedisPort ping > $null 2>&1
      if ($LASTEXITCODE -eq 0) { Write-Output "[wait-for-ready] Redis ready (attempt $i)"; break }
    } catch { }
    Write-Output "[wait-for-ready] Redis not ready yet (attempt $i), sleeping 1s..."
    Start-Sleep -Seconds 1
  }
} else {
  Write-Output "[wait-for-ready] redis-cli not available on runner; skipping Redis check"
}

Write-Output "[wait-for-ready] done"
