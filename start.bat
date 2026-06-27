@echo off
chcp 65001 >nul
cd /d "%~dp0"
title TVU-ITAM Server

echo Dang giai phong cong 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 3 /nobreak >nul

echo Khoi dong server...
npm start
