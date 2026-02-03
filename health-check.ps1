#!/usr/bin/env powershell

# Mirmaia POS System - Quick Health Check
# This script checks if the system is running properly

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Mirmaia POS System - Health Check" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()

# Check Docker
Write-Host "[*] Checking Docker..." -ForegroundColor Yellow
$dockerVersion = docker --version 2>$null
if ($dockerVersion) {
    Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Docker: Not installed" -ForegroundColor Red
    $issues += "Docker is not installed"
}

# Check Docker Compose
Write-Host "[*] Checking Docker Compose..." -ForegroundColor Yellow
$composeVersion = docker-compose --version 2>$null
if ($composeVersion) {
    Write-Host "✅ Docker Compose: $composeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Docker Compose: Not installed" -ForegroundColor Red
    $issues += "Docker Compose is not installed"
}

# Check if running
Write-Host "[*] Checking running containers..." -ForegroundColor Yellow
$running = docker-compose ps --services --filter "status=running" 2>$null | Measure-Object -Line
if ($running.Lines -gt 0) {
    Write-Host "✅ Containers running: $($running.Lines) services" -ForegroundColor Green
} else {
    Write-Host "⚠️  No containers are running" -ForegroundColor Yellow
}

# Check Backend
Write-Host "[*] Checking Backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend API: Running on port 3000" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend API: Not responding" -ForegroundColor Red
    $issues += "Backend API is not responding"
}

# Check Frontend
Write-Host "[*] Checking Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend: Running on port 3001" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Frontend: Not responding (normal if not started)" -ForegroundColor Yellow
}

# Check MySQL
Write-Host "[*] Checking MySQL Database..." -ForegroundColor Yellow
try {
    $result = docker-compose exec mysql mysql -u root -proot -e "SELECT VERSION();" 2>&1
    if ($result) {
        Write-Host "✅ MySQL: Connected" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  MySQL: Not accessible (Docker may not be running)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan

if ($issues.Count -eq 0) {
    Write-Host "  ✅ All systems operational!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Access the application:" -ForegroundColor Green
    Write-Host "    🌐 Frontend: http://localhost:3001" -ForegroundColor Green
    Write-Host "    🔌 Backend:  http://localhost:3000/api" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Found $($issues.Count) issue(s):" -ForegroundColor Yellow
    Write-Host ""
    foreach ($issue in $issues) {
        Write-Host "    • $issue" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "  Run: docker-compose up --build" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
