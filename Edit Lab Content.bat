@echo off
REM Launches the local-only content editor. Keep this file in the repository root.
cd /d "%~dp0"

set PORT=8787
set URL=http://localhost:%PORT%/local-editor/admin.html

if not exist content.json (
  echo content.json not found. Move this launcher into the repository root ^(next to content.json^) and try again.
  pause
  exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
  echo Python is not installed. Install it from python.org, then run this again.
  pause
  exit /b 1
)

echo Serving %CD% at http://localhost:%PORT%
start "" /min python -m http.server %PORT% --bind 127.0.0.1
timeout /t 2 >nul
start "" "%URL%"

echo.
echo Editor open in your browser.
echo LEAVE THIS WINDOW OPEN while you work.
echo Close it when you are done.
pause >nul
