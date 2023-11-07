@echo off
set "executable_name=autorun.bat"
set "current_dir=%cd%"
set "executable_path=%current_dir%\%executable_name%"

set "autorun_name="Billboard""

reg.exe add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "%autorun_name%" /d "%executable_path%" /f
%executable_path%
pause