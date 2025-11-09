@echo off
REM Collect key debug files into .\tmp\debug_bundle.txt
setlocal
set OUTFILE=..\tmp\debug_bundle.txt
echo ===== Debug bundle generated at %DATE% %TIME% > %OUTFILE%
if exist ..\tmp\server_started.txt (
  echo --- server_started.txt --- >> %OUTFILE%
  type ..\tmp\server_started.txt >> %OUTFILE%
)
if exist ..\tmp\self_ready.log (
  echo --- self_ready.log (last 200 lines) --- >> %OUTFILE%
  powershell -Command "Get-Content ..\tmp\self_ready.log -Tail 200" >> %OUTFILE%
)
if exist ..\tmp\ready_checks.log (
  echo --- ready_checks.log (last 200 lines) --- >> %OUTFILE%
  powershell -Command "Get-Content ..\tmp\ready_checks.log -Tail 200" >> %OUTFILE%
)
if exist server-ci.log (
  echo --- server-ci.log (last 500 lines) --- >> %OUTFILE%
  powershell -Command "Get-Content server-ci.log -Tail 500" >> %OUTFILE%
)
echo Debug bundle written to ..\tmp\debug_bundle.txt
endlocal
pause
