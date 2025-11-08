@echo off
REM =========================================================================
REM SCRIPT: Lihat Database - Quick Commands
REM =========================================================================

echo.
echo ========================================
echo   PRO LIVECHAT - DATABASE VIEWER
echo ========================================
echo.

:menu
echo Pilih cara melihat database:
echo.
echo [1] Lihat semua tables
echo [2] Lihat semua indexes (BUKTI OPTIMASI!)
echo [3] Lihat struktur table Messages
echo [4] Lihat struktur table Conversations
echo [5] Hitung total messages
echo [6] Hitung total conversations
echo [7] Lihat 10 messages terakhir
echo [8] Lihat open conversations
echo [9] Test query speed (dengan timing)
echo [0] Exit
echo.
set /p choice="Pilih (0-9): "

if "%choice%"=="1" goto show_tables
if "%choice%"=="2" goto show_indexes
if "%choice%"=="3" goto show_messages_structure
if "%choice%"=="4" goto show_conversations_structure
if "%choice%"=="5" goto count_messages
if "%choice%"=="6" goto count_conversations
if "%choice%"=="7" goto show_recent_messages
if "%choice%"=="8" goto show_open_conversations
if "%choice%"=="9" goto test_speed
if "%choice%"=="0" goto end
goto menu

:show_tables
echo.
echo ========================================
echo DAFTAR TABLES:
echo ========================================
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "\dt"
echo.
pause
goto menu

:show_indexes
echo.
echo ========================================
echo DAFTAR INDEXES (BUKTI OPTIMASI!):
echo ========================================
echo Cari indexes dengan nama "idx_" - ini hasil migration kita!
echo.
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "\di"
echo.
echo ✅ Kalau ada 15+ indexes dengan nama "idx_messages_..." dan "idx_conversations_..."
echo    berarti OPTIMASI BERHASIL!
echo.
pause
goto menu

:show_messages_structure
echo.
echo ========================================
echo STRUKTUR TABLE MESSAGES:
echo ========================================
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "\d Messages"
echo.
echo ✅ Cek ada kolom "deletedAt" di bagian bawah = soft delete berhasil!
echo ✅ Cek "Indexes:" section = harus ada banyak indexes baru!
echo.
pause
goto menu

:show_conversations_structure
echo.
echo ========================================
echo STRUKTUR TABLE CONVERSATIONS:
echo ========================================
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "\d Conversations"
echo.
pause
goto menu

:count_messages
echo.
echo ========================================
echo TOTAL MESSAGES:
echo ========================================
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "SELECT COUNT(*) as total_messages FROM \"Messages\";"
echo.
pause
goto menu

:count_conversations
echo.
echo ========================================
echo TOTAL CONVERSATIONS:
echo ========================================
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "SELECT COUNT(*) as total_conversations FROM \"Conversations\";"
echo.
pause
goto menu

:show_recent_messages
echo.
echo ========================================
echo 10 MESSAGES TERAKHIR:
echo ========================================
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "SELECT id, \"senderType\", content, \"createdAt\" FROM \"Messages\" ORDER BY \"createdAt\" DESC LIMIT 10;"
echo.
pause
goto menu

:show_open_conversations
echo.
echo ========================================
echo OPEN CONVERSATIONS:
echo ========================================
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "SELECT id, status, \"isAiActive\", \"createdAt\" FROM \"Conversations\" WHERE status = 'open';"
echo.
pause
goto menu

:test_speed
echo.
echo ========================================
echo TEST QUERY SPEED (BUKTI CEPAT!):
echo ========================================
echo.
echo Query 1: Count messages (dengan index)
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "\timing" -c "SELECT COUNT(*) FROM \"Messages\";"
echo.
echo Query 2: Get recent messages (dengan index di createdAt)
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "\timing" -c "SELECT * FROM \"Messages\" ORDER BY \"createdAt\" DESC LIMIT 100;"
echo.
echo Query 3: Count unread messages (dengan index di isRead)
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "\timing" -c "SELECT COUNT(*) FROM \"Messages\" WHERE \"isRead\" = false;"
echo.
echo ✅ Kalau waktu eksekusi ^< 10ms = CEPAT! (tanpa index: 100-500ms)
echo.
pause
goto menu

:end
echo.
echo ========================================
echo Terima kasih! 
echo.
echo Tips: Install pgAdmin untuk visual database viewer
echo Download: https://www.pgadmin.org/download/
echo ========================================
echo.
exit /b 0
