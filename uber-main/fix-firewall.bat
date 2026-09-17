@echo off
echo Requesting administrative privileges...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Success: Administrative privileges confirmed.
) else (
    echo Failure: Current permissions inadequate. Please run this script as Administrator.
    pause
    exit /b
)

echo Adding Firewall Rules for Expo...
netsh advfirewall firewall add rule name="Expo Metro 8081" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="Expo 19000" dir=in action=allow protocol=TCP localport=19000
netsh advfirewall firewall add rule name="Expo 19001" dir=in action=allow protocol=TCP localport=19001
netsh advfirewall firewall add rule name="Expo 19002" dir=in action=allow protocol=TCP localport=19002

echo Firewall rules added successfully.
pause
