@echo off

set "downloads_dir=%USERPROFILE%\Downloads"
set "billboard_videos_dir=%downloads_dir%\BillboardClientVideos"

REM Check if BillboardClientVideos directory exists
if not exist "%billboard_videos_dir%" (
  echo Creating BillboardClientVideos directory...
  mkdir "%billboard_videos_dir%"
  echo Directory created successfully.
) else (
  echo BillboardClientVideos directory already exists.
)

echo Initializing npm packages... Please wait!
npm install
timeout 2 > nul

pause