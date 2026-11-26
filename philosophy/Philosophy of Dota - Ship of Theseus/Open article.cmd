@echo off
rem Opens the article through a tiny local web server.
rem Opening the .html file directly works too, except for the YouTube embed:
rem YouTube refuses to play inside pages that have no http:// address.
cd /d "%~dp0"
set PORT=8780

set PY=python
where %PY% >nul 2>nul || set PY=py
where %PY% >nul 2>nul || (
  echo Python was not found. Install it from https://www.python.org/ and try again.
  pause
  exit /b 1
)

echo Serving the article at http://localhost:%PORT%/
echo Close this window (or press any key) to stop.
echo.
start "" /b %PY% -m http.server %PORT% --bind 127.0.0.1
timeout /t 1 /nobreak >nul
start "" "http://localhost:%PORT%/Ship%%20of%%20Theseus%%20demo.html"
pause >nul
