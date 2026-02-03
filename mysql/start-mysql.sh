#!/bin/bash
echo "========================================"
echo "   Starting MySQL Database Container"
echo "========================================"
echo

cd "$(dirname "$0")"

echo "Creating network if not exists..."
docker network create mirmaia_network 2>/dev/null || true

echo
echo "Starting MySQL and phpMyAdmin..."
docker-compose up -d

echo
echo "========================================"
echo "   MySQL Container Started!"
echo "========================================"
echo
echo "MySQL:      localhost:3306"
echo "phpMyAdmin: http://localhost:8080"
echo
echo "User: root"
echo "Password: mirmaia_root_2026"
