@echo off
:: Antigravity Auto Accept Launcher
:: This script launches Antigravity with the required CDP port for the Auto Accept extension.

set "IDE_PATH=e:\New folder\Antigravity.exe"

if exist "%IDE_PATH%" (
    echo [INFO] Launching Antigravity with Remote Debugging on Port 9000...
    start "" "%IDE_PATH%" --remote-debugging-port=9000
    echo [SUCCESS] Antigravity is starting. The Auto Accept extension should now be active.
) else (
    echo [ERROR] Antigravity.exe not found at: %IDE_PATH%
    echo Please check the path and update this batch file if necessary.
    pause
)
