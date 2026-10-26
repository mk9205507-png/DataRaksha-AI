@echo off
echo ========================================================
echo   Starting DataRaksha AI - Full Stack Development Servers
echo ========================================================
echo.

echo [1/2] Starting Python FastAPI Backend on http://0.0.0.0:8000 ...
start "DataRaksha Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --port 8000 --host 0.0.0.0"

echo [2/2] Starting React Frontend on http://localhost:5173 ...
start "DataRaksha Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers are launching in their own terminal windows.
echo - Frontend: http://localhost:5173
echo - Backend API & Docs: http://localhost:8000/docs
echo.
