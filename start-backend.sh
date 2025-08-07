#!/bin/bash

# Faded Skies Cannabis Delivery - Backend Start Script

echo "🌿 Starting Faded Skies Backend Server..."

# Navigate to backend directory
cd backend

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Generate Prisma client if needed
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check if database is accessible (optional - for development)
echo "🗄️ Checking database connection..."
if npx prisma db push --accept-data-loss 2>/dev/null; then
    echo "✅ Database schema updated successfully"
else
    echo "⚠️  Warning: Could not connect to database. Using development mode."
fi

# Start the backend server
echo "🚀 Starting backend server on port 3001..."
npm run dev
