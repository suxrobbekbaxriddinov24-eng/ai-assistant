@echo off
echo ================================================
echo   AI Personal Assistant - Setup Script
echo ================================================
echo.

:: ---- Check Python ----
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Download Python 3.11 from: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python found.

:: ---- Check Node.js ----
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Download Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found.

:: ---- Copy .env files if they don't exist ----
echo.
echo [1/4] Setting up environment files...

if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    echo       Created backend\.env  ^(fill in your API keys^)
) else (
    echo       backend\.env already exists, skipping.
)

if not exist "frontend\.env" (
    copy "frontend\.env.example" "frontend\.env" >nul
    echo       Created frontend\.env  ^(fill in your Supabase keys^)
) else (
    echo       frontend\.env already exists, skipping.
)

:: ---- Python virtual environment + install ----
echo.
echo [2/4] Setting up Python virtual environment...

if not exist "backend\venv" (
    python -m venv backend\venv
    echo       Virtual environment created.
) else (
    echo       Virtual environment already exists, skipping creation.
)

echo.
echo [3/4] Installing Python dependencies (this may take a minute)...
call backend\venv\Scripts\activate.bat
pip install -r backend\requirements.txt --quiet
if errorlevel 1 (
    echo [ERROR] pip install failed. Check your internet connection.
    pause
    exit /b 1
)
echo       Python dependencies installed.

:: ---- npm install ----
echo.
echo [4/4] Installing frontend dependencies (this may take a minute)...
cd frontend
npm install --silent
if errorlevel 1 (
    echo [ERROR] npm install failed. Check your internet connection.
    cd ..
    pause
    exit /b 1
)
cd ..
echo       Frontend dependencies installed.

:: ---- Done ----
echo.
echo ================================================
echo   Setup complete!
echo ================================================
echo.
echo NEXT STEPS:
echo  1. Open backend\.env and fill in your API keys
echo  2. Open frontend\.env and fill in your Supabase keys
echo  3. Run start_dev.bat to launch the app locally
echo.
echo See SETUP.md for the full deployment guide.
echo.
pause
