@echo off
echo ================================================
echo   AI Personal Assistant - Start Dev Server
echo ================================================
echo.
echo Starting backend (FastAPI) in a new window...
start "Backend - FastAPI" cmd /k "cd /d "%~dp0backend" && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo Starting frontend (Vite) in a new window...
start "Frontend - Vite" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers are starting:
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo.
echo Close the opened windows to stop the servers.
pause
