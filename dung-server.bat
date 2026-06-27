@echo off
echo Tat tat ca server tren cong 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo Tat PID %%a
    taskkill /F /PID %%a
)
echo Xong.
pause
