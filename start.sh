#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting PostgreSQL and Redis..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" up -d postgres redis

echo "Waiting for PostgreSQL to be healthy..."
until docker inspect --format='{{.State.Health.Status}}' accounting_postgres 2>/dev/null | grep -q "healthy"; do
  sleep 2
done
echo "PostgreSQL is ready."

echo "Starting backend..."
cd "$PROJECT_DIR/backend"
mvn spring-boot:run > /tmp/backend.log 2>&1 &
echo $! > /tmp/hoopoe_backend.pid

echo "Waiting for backend to start..."
until curl -s http://localhost:8080/api/actuator/health | grep -q "UP"; do
  sleep 3
done
echo "Backend is up."

echo "Starting frontend..."
cd "$PROJECT_DIR/frontend"
npm start > /tmp/frontend.log 2>&1 &
echo $! > /tmp/hoopoe_frontend.pid

echo ""
echo "All services running:"
echo "  Frontend  -> http://localhost:4200"
echo "  Backend   -> http://localhost:8080/api"
echo "  Logs      -> /tmp/backend.log | /tmp/frontend.log"
