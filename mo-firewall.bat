@echo off
echo Mo cong 5000 cho mang noi bo (can quyen Admin)...
netsh advfirewall firewall add rule name="TVU-ITAM Node 5000" dir=in action=allow protocol=TCP localport=5000 profile=private
if %errorlevel%==0 (echo Da mo firewall.) else (echo That bai — chuot phai file nay, chon "Run as administrator")
pause
