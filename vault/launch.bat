@echo off
title 1PB Cloud Launcher
echo Starting WebDAV Server...
start "" "C:\vault\webdav.exe" --config "C:\vault\config.yaml"

echo Waiting 2 seconds for server to stabilize...
timeout /t 2 /nobreak >nul

echo Starting PowerShell Sync Engine...
start powershell.exe -ExecutionPolicy Bypass -File "C:\vault\sync.ps1"

echo.
echo  Both engines are running! You can minimize these windows.
pause