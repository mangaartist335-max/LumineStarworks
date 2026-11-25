@echo off
setlocal
title BuildBrief phone app
cd /d "%~dp0"

echo.
echo   ==============================================
echo     BuildBrief - starting the phone app
echo   ==============================================

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js isn't installed yet.
  echo   Download the LTS version from https://nodejs.org, install it,
  echo   then double-click this file again.
  echo.
  pause
  exit /b 1
)

node scripts\doctor.mjs --fix
if errorlevel 1 (
  echo   When that's fixed, double-click start-buildbrief.cmd again.
  echo.
  pause
  exit /b 1
)

echo   Scan the QR code below with Expo Go on your phone.
echo   Keep this window open while you use the app.
echo.
call npm exec --no -- expo start --tunnel=ngrok
echo.
pause
