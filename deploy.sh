#!/bin/bash

# Faded Skies Admin App - Deployment Script
echo "🚀 Deploying Faded Skies Admin App..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the app
echo "🔨 Building admin app..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Vercel
    echo "🌐 Deploying to Vercel..."
    vercel --prod
    
    echo "🎉 Deployment complete!"
    echo "📱 Your admin app is now live on a web domain!"
    echo "🔗 You can access it from anywhere, not just localhost"
else
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi

