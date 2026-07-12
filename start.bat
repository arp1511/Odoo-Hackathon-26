@echo off
title TransitOps — Dev Startup
color 0A

echo.
echo  ======================================
echo   TransitOps Fleet Management Platform
echo   Starting Development Environment...
echo  ======================================
echo.

REM ── Check if Java is installed ──────────────────────────────────────────────
where java >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Java not found! Please install Java 17+.
    echo  Download from: https://adoptium.net/
    pause
    exit /b 1
)
echo  [OK] Java found

REM ── Check if Node.js is installed ────────────────────────────────────────────
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Node.js not found! Please install Node.js 18+.
    echo  Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo  [OK] Node.js found

REM ── Check if frontend node_modules exist ─────────────────────────────────────
if not exist "frontend\node_modules\" (
    echo.
    echo  [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo  [OK] Dependencies installed
)

echo.
echo  ─────────────────────────────────────────────
echo   Starting Backend (Spring Boot on port 8080)
echo  ─────────────────────────────────────────────

REM ── Start Backend in a new terminal window ────────────────────────────────────
start "TransitOps Backend" cmd /k "cd /d %~dp0backend && echo [Backend] Starting Spring Boot... && mvnw.cmd spring-boot:run"

echo  [INFO] Backend window opened. Waiting 15 seconds for it to start...
timeout /t 15 /nobreak >nul

echo.
echo  ─────────────────────────────────────────────
echo   Starting Frontend (React on port 3000)
echo  ─────────────────────────────────────────────

REM ── Start Frontend in a new terminal window ───────────────────────────────────
start "TransitOps Frontend" cmd /k "cd /d %~dp0frontend && echo [Frontend] Starting Vite dev server... && npm run dev"

echo  [INFO] Frontend starting...
timeout /t 5 /nobreak >nul

echo.
echo  ======================================
echo   All services starting!
echo.
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8080
echo   Swagger  : http://localhost:8080/swagger-ui.html
echo  ======================================
echo.

REM ── Open browser ─────────────────────────────────────────────────────────────
echo  [INFO] Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo  Both services are running in their own windows.
echo  Close those windows to stop the services.
echo.
pause
