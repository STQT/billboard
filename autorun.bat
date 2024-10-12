@echo off
set "current_dir=%~dp0"
echo %current_dir%

:wait_for_internet
echo Check internet...
ping -n 1 8.8.8.8 >nul 2>&1
if %errorlevel% neq 0 (
    echo Internet wasnt found. Recheck after 10 seconds...
    timeout /t 10 /nobreak >nul
    goto wait_for_internet
)

echo Internet connected. Run npm...

npm --prefix %current_dir% start
