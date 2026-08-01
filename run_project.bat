@echo off
title ZeroTrust Engine - Dev Server
echo ==============================================
echo       ZeroTrust Engine Startup Script
echo ==============================================
echo.
echo Checking for Node.js modules...
if not exist "node_modules\" (
    echo Installing dependencies...
    npm install
)

echo.
echo Starting the development server...
echo The application will open in your default browser.
echo.

:: Open the browser slightly delayed so the server has a second to start
start http://localhost:5173

:: Start the Vite server
npm run dev:full

pause
