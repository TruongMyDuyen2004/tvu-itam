@echo off
echo ========================================
echo  TVU-ITAM - Setup Capacitor Android App
echo ========================================
echo.

echo [1/4] Cai dat dependencies...
call npm install

echo [2/4] Khoi tao Capacitor...
call npx cap init TVU-ITAM edu.tvu.itam --web-dir frontend

echo [3/4] Them Android platform...
call npx cap add android

echo [4/4] Dong bo web code vao Android project...
call npx cap copy android

echo.
echo ========================================
echo  Hoan thanh! Chuan bi build APK:
echo ========================================
echo.
echo  Cach 1: Mo Android Studio va build
echo    npx cap open android
echo.
echo  Cach 2: Build truc tiep bang CLI
echo    cd android
echo    gradlew assembleDebug
echo.
echo  APK se duoc tao o:
echo    android\app\build\outputs\apk\debug\
echo.
pause
