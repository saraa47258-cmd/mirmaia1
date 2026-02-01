@echo off
REM Mirmaia POS System - Quick Start Script for Windows

echo.
echo ============================================
echo    Mirmaia POS System - Quick Start
echo ============================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [X] Docker is not installed
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [X] Docker Compose is not installed
    echo Please install Docker Compose
    pause
    exit /b 1
)

echo [+] Docker and Docker Compose are installed
echo.

REM Start all services (MySQL + Backend + Frontend + phpMyAdmin)
echo [*] Starting Mirmaia POS (MySQL, Backend, Frontend, phpMyAdmin)...
echo.

docker-compose up -d --build

REM Print access information after system starts
echo.
echo ============================================
echo    System is ready!
echo ============================================
echo.
echo [+] Application:
echo     Frontend:   http://localhost:3001
echo     Backend:    http://localhost:3000/api
echo     phpMyAdmin: http://localhost:8081
echo.
echo [+] Login (default admin):
echo     Email: admin@mirmaia.com
echo     Password: [check init.sql / env]
echo.
echo [+] Stop: docker-compose down
echo [+] Logs:  docker-compose logs -f
echo.
pause
