#!/bin/bash

echo "🚀 Starting Faded Skies Development Environment..."
echo ""

# Check if backend is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "📡 Starting Backend Server..."
    cd backend && npm run dev &
    cd ..
    sleep 3
else
    echo "✅ Backend Server already running"
fi

echo ""
echo "🌿 Starting User App (Port 3000)..."
cd user-app && npm run dev &
cd ..

echo "🚚 Starting Driver App (Port 3001)..."
cd driver-app && npm run dev &
cd ..

echo "📊 Starting Admin App (Port 3002)..."
cd admin-app && npm run dev &
cd ..

echo ""
echo "🎉 All apps starting up!"
echo ""
echo "📱 User App: http://localhost:3000"
echo "🚚 Driver App: http://localhost:3001" 
echo "📊 Admin Panel: http://localhost:3002"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for all background processes
wait
