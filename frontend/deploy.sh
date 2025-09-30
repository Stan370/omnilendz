#!/bin/bash

# OmniLendZ Frontend Deployment Script
# This script helps deploy the frontend to Vercel

echo "🚀 OmniLendZ Frontend Deployment Script"
echo "======================================"


# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

echo "🌐 Deploying to Vercel..."
vercel --prod

echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set up environment variables in Vercel dashboard:"
echo "   - VITE_OMNI_ADDRESS: Your contract address"
echo "   - VITE_WALLETCONNECT_PROJECT_ID: Your WalletConnect project ID"
echo "2. Redeploy after setting environment variables"
echo ""
echo "For more details, see DEPLOYMENT.md"
