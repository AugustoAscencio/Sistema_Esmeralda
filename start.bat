@echo off
title Sistema Esmeralda - Launcher
echo ============================================
echo    SISTEMA ESMERALDA - Iniciando...
echo ============================================
echo.

:: Start backend
echo [1/2] Iniciando Backend (FastAPI)...
cd /d "%~dp0backend"
start "Esmeralda Backend" cmd /k "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul

:: Start frontend
echo [2/2] Iniciando Frontend (Vite)...
cd /d "%~dp0frontend"
start "Esmeralda Frontend" cmd /k "npm run dev -- --host"
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo    SISTEMA ESMERALDA - Activo!
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo ============================================
echo.
echo Presiona cualquier tecla para abrir en navegador...
pause >nul
start http://localhost:5173
