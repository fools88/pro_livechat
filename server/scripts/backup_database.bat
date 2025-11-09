@echo off
REM ############################################################################
REM WINDOWS BATCH VERSION - AUTOMATED DATABASE BACKUP
REM 
REM SETUP:
REM 1. Run this script manually: backup_database.bat
REM 2. Or schedule with Task Scheduler (run daily at 2 AM)
REM 
REM REQUIREMENTS:
REM - Docker Desktop installed and running
REM - prochat-db container running
REM ############################################################################

setlocal enabledelayedexpansion

REM Configuration
set DB_CONTAINER=prochat-db
set DB_USER=prochatadmin
set DB_NAME=prochat_db
set BACKUP_DIR=backups
set RETENTION_DAYS=7

REM Get current date and time
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "DATE=%dt:~0,8%_%dt:~8,6%"
set BACKUP_FILE=backup_%DB_NAME%_%DATE%.sql.gz

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo ============================================
echo Starting database backup...
echo Date: %DATE%
echo Database: %DB_NAME%
echo Container: %DB_CONTAINER%
echo Backup file: %BACKUP_FILE%
echo ============================================
echo.

REM Check if Docker container is running
docker ps | findstr /C:"%DB_CONTAINER%" >nul
if errorlevel 1 (
    echo ERROR: Database container '%DB_CONTAINER%' is not running!
    exit /b 1
)

REM Create backup
echo Creating compressed backup...
docker exec %DB_CONTAINER% pg_dump -U %DB_USER% %DB_NAME% > "%BACKUP_DIR%\temp_backup.sql"

if errorlevel 1 (
    echo ERROR: Backup failed!
    exit /b 1
)

REM Compress using PowerShell (if gzip not available)
echo Compressing backup...
powershell -Command "& {Compress-Archive -Path '%BACKUP_DIR%\temp_backup.sql' -DestinationPath '%BACKUP_DIR%\%BACKUP_FILE%.zip' -Force}"
del "%BACKUP_DIR%\temp_backup.sql"

if exist "%BACKUP_DIR%\%BACKUP_FILE%.zip" (
    echo SUCCESS: Backup created successfully!
    for %%A in ("%BACKUP_DIR%\%BACKUP_FILE%.zip") do echo Backup size: %%~zA bytes
) else (
    echo ERROR: Backup compression failed!
    exit /b 1
)

REM Clean old backups (keep only last N days)
echo.
echo Cleaning old backups (keeping last %RETENTION_DAYS% days)...
forfiles /P "%BACKUP_DIR%" /M backup_*.zip /D -%RETENTION_DAYS% /C "cmd /c del @path" 2>nul

REM List current backups
echo.
echo Current backups:
dir /B "%BACKUP_DIR%\backup_*.zip" 2>nul

echo.
echo ============================================
echo Backup completed successfully!
echo ============================================

endlocal
exit /b 0
