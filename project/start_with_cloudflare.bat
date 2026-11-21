@echo off
title DataVault Enterprise - Cloudflare Tunnel Launcher
color 0B
cls
echo ===================================================================
echo   DATAVAULT - INDUSTRIAL FILE ACCESS MONITORING & STORAGE
echo   WITH CLOUDFLARE PUBLIC TUNNEL
echo ===================================================================
echo.

:: 1. Start Backend Server in a new window
echo [*] Launching DataVault Backend Storage Server on port 8000...
start "DataVault-Server" cmd /c "node backend\server.js"
timeout /t 2 /nobreak >nul

:: 2. Launch Cloudflare Tunnel
echo [*] Launching Cloudflare Tunnel (generating public HTTPS URL)...
echo [*] Anyone with this link worldwide can access the system!
echo.
bin\cloudflared.exe tunnel --url http://127.0.0.1:8000
