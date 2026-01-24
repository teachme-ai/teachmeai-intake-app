#!/bin/bash

# Helper script to encode Google Service Account JSON to base64
# Usage: ./encode-service-account.sh path/to/service-account.json

if [ -z "$1" ]; then
    echo "❌ Error: Please provide the path to your service account JSON file"
    echo ""
    echo "Usage: ./encode-service-account.sh path/to/service-account.json"
    echo ""
    echo "Example: ./encode-service-account.sh ~/Downloads/my-project-abc123.json"
    exit 1
fi

SERVICE_ACCOUNT_FILE="$1"

if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
    echo "❌ Error: File not found: $SERVICE_ACCOUNT_FILE"
    exit 1
fi

echo "🔐 Encoding service account JSON to base64..."
echo ""

BASE64_ENCODED=$(cat "$SERVICE_ACCOUNT_FILE" | base64)

echo "✅ Success! Copy the value below and add it to Vercel:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment Variable Name: GOOGLE_SERVICE_ACCOUNT_BASE64"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$BASE64_ENCODED"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Steps to add to Vercel:"
echo "  1. Go to your Vercel project → Settings → Environment Variables"
echo "  2. Click 'Add New'"
echo "  3. Name: GOOGLE_SERVICE_ACCOUNT_BASE64"
echo "  4. Value: Paste the base64 string above"
echo "  5. Click 'Save'"
echo "  6. Redeploy your application"
echo ""
echo "✨ This method is more reliable than individual environment variables!"
