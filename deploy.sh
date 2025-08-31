#!/bin/bash

# Pet Hero AI Deployment Script

echo "🚀 Starting Pet Hero AI deployment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
firebase login --reauth

# Build and deploy Cloud Functions
echo "📦 Building Cloud Functions..."
cd functions
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Functions build failed"
    exit 1
fi

echo "☁️ Deploying Cloud Functions..."
firebase deploy --only functions

if [ $? -ne 0 ]; then
    echo "❌ Functions deployment failed"
    exit 1
fi

cd ..

# Deploy Firestore rules and indexes
echo "🔒 Deploying Firestore rules..."
firebase deploy --only firestore:rules

echo "📊 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

# Deploy Storage rules
echo "💾 Deploying Storage rules..."
firebase deploy --only storage

echo "✅ Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update your mobile app with the latest Firebase config"
echo "2. Test the complete user flow"
echo "3. Submit your app to app stores"
echo ""
echo "🎉 Pet Hero AI is ready to transform pets into heroes!"