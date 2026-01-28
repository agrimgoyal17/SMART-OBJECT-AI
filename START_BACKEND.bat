@echo off
REM Quick Test Script for Voice Command System

echo.
echo ============================================
echo    Smart Object AI - Voice Command Tester
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not installed
    pause
    exit /b 1
)

REM Check if ADB is installed
adb version >nul 2>&1
if errorlevel 1 (
    echo WARNING: ADB not found. Install it first!
    echo Run: choco install adb -y
    echo.
)

echo [1/3] Checking ADB Connection...
adb devices
echo.

REM Check if Flask is installed
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Flask not installed
    echo Run: pip install flask flask-cors
    pause
    exit /b 1
)

echo [2/3] Starting Flask Backend...
echo.
echo Backend starting on http://localhost:5000
echo Press Ctrl+C to stop
echo.

cd /d "%~dp0backend"
python app.py

pause
