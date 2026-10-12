@echo off
cd /d "%~dp0"
echo.
echo ==========================================
echo    Pizza - driver notifications setup
echo ==========================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo [X] Node.js is not installed.
  echo     Download it from https://nodejs.org  ^(LTS^)  then run this file again.
  start https://nodejs.org
  pause
  exit /b
)
echo [1/3] Installing...
cd functions
call npm install --no-fund --no-audit
cd ..
echo.
echo [2/3] Login to Google...
call npx -y firebase-tools login
echo.
echo [3/3] Uploading to Firebase... (2-5 minutes)
set FUNCTIONS_DISCOVERY_TIMEOUT=180
call npx -y firebase-tools deploy --only functions --project pizza-um-elfahem --force
echo.
echo ==========================================
echo    DONE - if you see "Deploy complete!" above, it worked.
echo ==========================================
pause
