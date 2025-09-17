#!/bin/bash

# Quick Start Script for Development Environment
# This script helps developers get started quickly with the Dockerized Neon setup

set -e

echo "🚀 Starting Dockerized Application with Neon Database (Development)"
echo "================================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if environment file exists
if [ ! -f ".env.development.local" ]; then
    echo "⚠️  Environment file .env.development.local not found!"
    echo "📝 Creating template from .env.development..."
    cp .env.development .env.development.local
    echo ""
    echo "🔧 Please edit .env.development.local with your Neon credentials:"
    echo "   - NEON_API_KEY (from Neon Console)"
    echo "   - NEON_PROJECT_ID (from Neon Console)"  
    echo "   - PARENT_BRANCH_ID (usually 'br-main-xxxxx')"
    echo ""
    read -p "Press Enter after updating the environment file..."
fi

echo "🏗️  Building and starting development environment..."

# Pull latest Neon Local image
echo "📦 Pulling latest Neon Local image..."
docker pull neondatabase/neon_local:latest

# Build and start services
docker-compose -f docker-compose.dev.yml --env-file .env.development.local up -d

echo ""
echo "⏳ Waiting for services to be healthy..."

# Wait for services to be healthy
timeout=60
elapsed=0

while [ $elapsed -lt $timeout ]; do
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up (healthy)"; then
        echo "✅ Services are healthy!"
        break
    fi
    echo "   Waiting... ($elapsed/${timeout}s)"
    sleep 3
    elapsed=$((elapsed + 3))
done

if [ $elapsed -ge $timeout ]; then
    echo "⚠️  Services are taking longer than expected to start."
    echo "📋 Check service status:"
    docker-compose -f docker-compose.dev.yml ps
    echo ""
    echo "📋 Check logs for issues:"
    echo "   docker-compose -f docker-compose.dev.yml logs"
    exit 1
fi

echo ""
echo "🎉 Development environment is ready!"
echo "🌐 Application: http://localhost:3000"
echo "🗄️  Database: postgres://user:password@localhost:5432/dbname"
echo ""
echo "📋 Useful commands:"
echo "   📜 View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "   🛑 Stop: docker-compose -f docker-compose.dev.yml down"
echo "   🔄 Restart: docker-compose -f docker-compose.dev.yml restart app"
echo ""

# Show running services
echo "📊 Service Status:"
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "🔗 Opening application in browser..."
if command -v open > /dev/null; then
    open http://localhost:3000
elif command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000
else
    echo "   Please open http://localhost:3000 in your browser"
fi