#!/bin/bash

# Quick Start Script for Production Environment
# This script helps deploy the Dockerized application using Neon Cloud Database

set -e

echo "🚀 Starting Dockerized Application with Neon Database (Production)"
echo "================================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if production environment file exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  Environment file .env.production not found!"
    echo "📝 Creating template from .env.production.example (if exists)..."
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
    else
        echo "❌ No .env.production.example found. Please create .env.production manually."
        exit 1
    fi
    echo ""
    echo "🔧 Please edit .env.production with your Neon Cloud credentials:"
    echo "   - DATABASE_URL (from Neon Console, usually postgresql://...)"
    echo ""
    read -p "Press Enter after updating the environment file..."
fi

echo "🏗️  Building and starting production environment..."

# Build and start services
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

echo ""
echo "⏳ Waiting for services to be healthy..."

timeout=60
elapsed=0

while [ $elapsed -lt $timeout ]; do
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up (healthy)"; then
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
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "📋 Check logs for issues:"
    echo "   docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

echo ""
echo "🎉 Production environment is ready!"
echo "🌐 Application: http://localhost:3000"
echo ""
echo "📋 Useful commands:"
echo "   📜 View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   🛑 Stop: docker-compose -f docker-compose.prod.yml down"
echo "   🔄 Restart: docker-compose -f docker-compose.prod.yml restart app"
echo ""

# Show running services
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔗 Opening application in browser..."
if command -v open > /dev/null; then
    open http://localhost:3000
elif command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000
else
    echo "   Please open http://localhost:3000 in your browser"
fi