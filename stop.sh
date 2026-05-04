#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Stopping frontend..."
if [ -f /tmp/hoopoe_frontend.pid ]; then
  kill $(cat /tmp/hoopoe_frontend.pid) 2>/dev/null
  rm /tmp/hoopoe_frontend.pid
fi
pkill -f "ng serve" 2>/dev/null

echo "Stopping backend..."
if [ -f /tmp/hoopoe_backend.pid ]; then
  kill $(cat /tmp/hoopoe_backend.pid) 2>/dev/null
  rm /tmp/hoopoe_backend.pid
fi
pkill -f "spring-boot:run" 2>/dev/null

echo "Stopping Docker containers..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" down

echo "All services stopped."
