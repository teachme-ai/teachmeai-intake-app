#!/bin/bash

# Intake App Frontend Deployment Script
set -e

echo "🚀 Deploying TeachMeAI Intake App (Frontend)"
echo "=========================================="

# 1. Commit changes
echo "📝 Committing changes..."
git add .
if git commit -m "Production deployment $(date +%Y-%m-%d\ %H:%M:%S)"; then
    echo "✅ Changes committed"
else
    echo "ℹ️ No changes to commit"
fi

# 2. Push to GitHub (Triggers Vercel)
echo "📤 Pushing to GitHub..."
git push origin main
echo "✅ Successfully pushed. Check Vercel for build status: https://vercel.com"

echo ""
echo "Next: Don't forget to deploy the Agent Service to Cloud Run!"
