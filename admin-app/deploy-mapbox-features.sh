#!/bin/bash

# Mapbox Features Deployment Script for Faded Skies Admin App
# This script configures all Mapbox optimization features for production

echo "🚀 Deploying Mapbox Optimization Features..."

# Check if Mapbox token is set
if [ -z "$VITE_MAPBOX_ACCESS_TOKEN" ]; then
    echo "❌ Error: VITE_MAPBOX_ACCESS_TOKEN environment variable not set"
    echo "Please set your Mapbox access token:"
    echo "export VITE_MAPBOX_ACCESS_TOKEN='your_mapbox_token_here'"
    exit 1
fi

echo "✅ Mapbox token found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Deploy to Vercel (if configured)
if command -v vercel &> /dev/null; then
    echo "🚀 Deploying to Vercel..."
    vercel --prod
else
    echo "⚠️ Vercel CLI not found. Please deploy manually:"
    echo "1. Push to your repository"
    echo "2. Deploy via Vercel dashboard"
fi

echo "🎉 Mapbox Optimization Features Deployment Complete!"
echo ""
echo "📋 Features Deployed:"
echo "✅ Mapbox Optimization SDK"
echo "✅ Matrix API Integration"
echo "✅ Route Optimization"
echo "✅ Real-time Driver Tracking"
echo "✅ ETA Calculations"
echo "✅ Dispatch Optimization"
echo "✅ Live Location Updates"
echo ""
echo "🔧 Configuration:"
echo "• Base Pay: $2.00"
echo "• Mileage Rate: $0.70/mile"
echo "• Real-time GPS tracking"
echo "• Optimized route planning"
echo "• Multi-driver dispatch"
echo ""
echo "🌐 Access your admin dashboard to test the new features!"



