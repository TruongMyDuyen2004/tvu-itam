@echo off
chcp 65001 >nul
title TVU-ITAM
cd /d "%~dp0"

echo Dang tat cac tien trinh cu...
for /f "tokens=2" %%a in ('tasklist ^| findstr /i "node.exe"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=2" %%a in ('tasklist ^| findstr /i "ngrok.exe"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=2" %%a in ('tasklist ^| findstr /i "mysqld.exe"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 3 /nobreak >nul

:: 1. Start MySQL
echo [1/3] Dang khoi dong MySQL...
start "MySQL" "C:\xamppduyen1\mysql\bin\mysqld.exe" --defaults-file="C:\xamppduyen1\mysql\bin\my.ini"
timeout /t 5 /nobreak >nul

:: 2. Start Node.js server
echo [2/3] Dang khoi dong Node.js server...
start "Node Server" cmd /c "node backend/server.js"
timeout /t 3 /nobreak >nul

:: 3. Start ngrok
echo [3/3] Dang khoi dong ngrok...
start "ngrok" cmd /c "D:\ngrok\ngrok.exe http 5000"

echo.
echo ====================================
echo  PC:     http://tvuitam.com:5000
echo  Phone:  http://192.168.1.113:5000
echo  QR URL se tu dong cap nhat tu ngrok
echo ====================================
echo.
pause
