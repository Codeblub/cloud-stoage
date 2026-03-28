@echo off
title 🚀 1PB Cloud Control Center
color 0b

echo ===================================================
echo   INITIALIZING Cloud Storage
echo ===================================================

:: 1. Start the WebDAV Server
echo 🛰️  Step 1: Starting WebDAV Server...
start "WebDAV Server" /min "C:\vault\webdav.exe" --config "C:\vault\config.yaml"

:: 2. Wait 5 seconds as requested
echo ⏳  Waiting 5 seconds for E: Drive to mount...
timeout /t 5 /nobreak >nul

:: 3. Start the PowerShell Sync Engine
echo 🔄  Step 2: Launching Sync Engine...
start "GitHub Sync Engine" powershell.exe -ExecutionPolicy Bypass -File "C:\vault\sync.ps1"

echo ===================================================
echo   SYSTEM ONLINE
echo ===================================================
echo.
echo You can now close this window or minimize it.
timeout /t 3 >nul
exit