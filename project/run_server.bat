@echo off
title DataVault - Secure File Access Monitoring System
color 0B
cls
echo ========================================================
echo   DATAVAULT - SECURE FILE ACCESS MONITORING SYSTEM
echo ========================================================
echo.

:: Check if compiled C++ binary exists
if exist "backend\datavault.exe" (
    echo [*] Detected compiled C++ binary backend\datavault.exe
    echo [*] Starting native C++ monitoring engine on port 8000...
    start "" http://127.0.0.1:8000
    backend\datavault.exe 8000
    goto end
)

:: If C++ executable not yet compiled, launch using Node.js backend
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [*] Starting DataVault Backend Server on port 8000...
    echo [*] Opening modern web dashboard in your default browser...
    start "" http://127.0.0.1:8000
    node backend\server.js
    goto end
)

echo [!] Error: Neither backend\datavault.exe nor Node.js runtime was detected.
echo [!] To compile the C++ backend:
echo       g++ -std=c++17 backend\main.cpp -lws2_32 -o backend\datavault.exe
echo [!] Or install Node.js (already installed on this machine) and run:
echo       node backend\server.js
echo.
pause

:end
