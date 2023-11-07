@echo off
set "current_dir=%~dp0"
echo %current_dir%
npm --prefix %current_dir% start