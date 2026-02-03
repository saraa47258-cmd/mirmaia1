#!/bin/bash

# Mirmaia POS System - Quick Start Script for Linux/Mac

echo "🎯 Mirmaia POS System - Quick Start"
echo "===================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Start all services (MySQL + Backend + Frontend + phpMyAdmin)
echo ""
echo "🚀 Starting Mirmaia POS (MySQL, Backend, Frontend, phpMyAdmin)..."
docker-compose up -d --build

# Print access information
echo ""
echo "✅ System is ready!"
echo ""
echo "📱 Access:"
echo "   Frontend:   http://localhost:3001"
echo "   Backend:    http://localhost:3000/api"
echo "   phpMyAdmin: http://localhost:8081"
echo ""
echo "🔑 Login (default admin):"
echo "   Email: admin@mirmaia.com"
echo ""
echo "💡 Stop: docker-compose down | Logs: docker-compose logs -f"
