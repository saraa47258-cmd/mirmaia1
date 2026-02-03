@echo off
echo ========================================
echo    Starting MySQL Database Container
echo ========================================
echo.

cd /d "%~dp0"

echo Creating network if not exists...
docker network create mirmaia_network 2>nul

echo.
echo Starting MySQL and phpMyAdmin...
docker-compose up -d

echo.
echo ========================================
echo    MySQL Container Started!
echo ========================================
echo.
echo MySQL:      localhost:3306
echo phpMyAdmin: http://localhost:8080
echo.
echo User: root
echo Password: mirmaia_root_2026
echo.
pause
