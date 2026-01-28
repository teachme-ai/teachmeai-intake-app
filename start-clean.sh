#!/bin/bash
export CLEAN_DIR="/Users/khalidirfan/projects/teachmeai-intake-app"
export GEMINI_API_KEY=AIzaSyA0zjle5vVuqS81GIR68vyTF3XNU7HYnxU
# Use valid model for 404 fix
export GENKIT_MODEL=googleai/gemini-2.0-flash
export JWT_SECRET=8fc3db9eca4d2c7cad8e2066985548c2ea8537a9b816f07f02bea261c0f8cd4e
export GOOGLE_SHEET_ID=1-EGTgJfeAAEVwPodDJyFbtleM5ww7qZZHJ9J-GJ4YzM
export AGENT_SERVICE_URL=http://localhost:3400
export npm_config_cache="$CLEAN_DIR/.npm-cache"
mkdir -p "$npm_config_cache"

# Check if Google Credentials exist
if [ -f "$CLEAN_DIR/service-account-key.json" ]; then
    export GOOGLE_APPLICATION_CREDENTIALS="$CLEAN_DIR/service-account-key.json"
else
    echo "⚠️  Google Credentials not found. Sheets logging will be disabled."
fi

# Start Agent Service in the background
echo "🧠 Starting Agent Service..."
cd "$CLEAN_DIR/agent-service" && npm run dev > /tmp/agent-service.log 2>&1 &

# Start Next.js in the foreground (or background with tail)
echo "🌐 Starting Next.js App..."
echo "⏳ Waiting for Agent Service to be ready on port 3400..."
for i in {1..30}; do
    if curl -s http://localhost:3400 > /dev/null; then
        echo "✅ Agent Service is UP!"
        break
    fi
    sleep 1
done

cd "$CLEAN_DIR" && npm run dev
