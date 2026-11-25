@echo off
setlocal
title BuildBrief - publish to the App Store
cd /d "%~dp0"

echo.
echo   ==============================================
echo     BuildBrief - build and send to the App Store
echo   ==============================================
echo.
echo   You'll need: an Apple Developer account, your Apple ID password,
echo   and your phone nearby for the Apple sign-in code.
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js isn't installed. Get the LTS version from https://nodejs.org
  pause
  exit /b 1
)

node scripts\doctor.mjs --fix
if errorlevel 1 (
  echo   Fix the item marked above, then double-click this file again.
  pause
  exit /b 1
)

rem This folder isn't a Git repository (it came from a ZIP), so tell EAS.
set EAS_NO_VCS=1

echo   Checking your Expo sign-in...
call npx --yes eas-cli@latest whoami >nul 2>nul
if errorlevel 1 call npx --yes eas-cli@latest login

echo.
echo   Building in the cloud and sending to App Store Connect.
echo   Answer "Y" when it asks to create the project or log in to Apple.
echo   The build takes about 15-25 minutes. You can watch it on expo.dev.
echo.
call npx --yes eas-cli@latest build --platform ios --profile production --auto-submit

echo.
pause
