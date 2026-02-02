#!/bin/bash

# Test script for deployed agent service
API_URL="https://teachmeai-agent-service-584680412286.us-central1.run.app/quizGuide"

echo "🧪 Testing Deployed Agent Service"
echo "URL: $API_URL"
echo ""

# Generate session ID
SESSION_ID="test_$(date +%s)"

# Initialize state
STATE='{
  "sessionId": "'$SESSION_ID'",
  "activeAgent": "guide",
  "turnCount": 0,
  "fields": {
    "role_raw": {"value": "Product Manager", "status": "prefilled"},
    "goal_raw": {"value": "Learn AI for PRDs", "status": "prefilled"}
  },
  "metadata": {"startTime": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "mode": "interview"},
  "isComplete": false
}'

# Test Turn 1: Name
echo "📝 Turn 1: Providing name..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "state": '"$STATE"',
    "userMessage": "Hi, I am Khalid"
  }')

echo "$RESPONSE" | jq -r '.result.message' | head -3
TURN_COUNT=$(echo "$RESPONSE" | jq -r '.result.state.turnCount')
IS_COMPLETE=$(echo "$RESPONSE" | jq -r '.result.isComplete')
echo "Turn: $TURN_COUNT | Complete: $IS_COMPLETE"
echo ""

# Update state
STATE=$(echo "$RESPONSE" | jq -c '.result.state')

# Test Turn 2: Email
echo "📝 Turn 2: Providing email..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "state": '"$STATE"',
    "userMessage": "khalid@teachmeai.in"
  }')

echo "$RESPONSE" | jq -r '.result.message' | head -3
TURN_COUNT=$(echo "$RESPONSE" | jq -r '.result.state.turnCount')
IS_COMPLETE=$(echo "$RESPONSE" | jq -r '.result.isComplete')
ACTIVE_AGENT=$(echo "$RESPONSE" | jq -r '.result.state.activeAgent')
echo "Turn: $TURN_COUNT | Agent: $ACTIVE_AGENT | Complete: $IS_COMPLETE"
echo ""

# Update state
STATE=$(echo "$RESPONSE" | jq -c '.result.state')

# Test Turn 3: Skill level
echo "📝 Turn 3: Providing skill level..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "state": '"$STATE"',
    "userMessage": "I would say I am at level 3 out of 5"
  }')

echo "$RESPONSE" | jq -r '.result.message' | head -3
TURN_COUNT=$(echo "$RESPONSE" | jq -r '.result.state.turnCount')
IS_COMPLETE=$(echo "$RESPONSE" | jq -r '.result.isComplete')
ACTIVE_AGENT=$(echo "$RESPONSE" | jq -r '.result.state.activeAgent')
echo "Turn: $TURN_COUNT | Agent: $ACTIVE_AGENT | Complete: $IS_COMPLETE"
echo ""

# Update state
STATE=$(echo "$RESPONSE" | jq -c '.result.state')

# Test Turn 4: Learning preference
echo "📝 Turn 4: Providing learning preference..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "state": '"$STATE"',
    "userMessage": "I learn best by doing hands-on projects"
  }')

echo "$RESPONSE" | jq -r '.result.message' | head -3
TURN_COUNT=$(echo "$RESPONSE" | jq -r '.result.state.turnCount')
IS_COMPLETE=$(echo "$RESPONSE" | jq -r '.result.isComplete')
ACTIVE_AGENT=$(echo "$RESPONSE" | jq -r '.result.state.activeAgent')
echo "Turn: $TURN_COUNT | Agent: $ACTIVE_AGENT | Complete: $IS_COMPLETE"
echo ""

# Update state
STATE=$(echo "$RESPONSE" | jq -c '.result.state')

# Test Turn 5: Motivation/Vision
echo "📝 Turn 5: Providing motivation..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "state": '"$STATE"',
    "userMessage": "I have a clear vision - I want to become an AI-powered PM within 6 months"
  }')

echo "$RESPONSE" | jq -r '.result.message' | head -3
TURN_COUNT=$(echo "$RESPONSE" | jq -r '.result.state.turnCount')
IS_COMPLETE=$(echo "$RESPONSE" | jq -r '.result.isComplete')
ACTIVE_AGENT=$(echo "$RESPONSE" | jq -r '.result.state.activeAgent')
echo "Turn: $TURN_COUNT | Agent: $ACTIVE_AGENT | Complete: $IS_COMPLETE"
echo ""

# Update state
STATE=$(echo "$RESPONSE" | jq -c '.result.state')

# Test Turn 6: Time commitment
echo "📝 Turn 6: Providing time commitment..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "state": '"$STATE"',
    "userMessage": "I can dedicate 5 hours per week"
  }')

echo "$RESPONSE" | jq -r '.result.message' | head -3
TURN_COUNT=$(echo "$RESPONSE" | jq -r '.result.state.turnCount')
IS_COMPLETE=$(echo "$RESPONSE" | jq -r '.result.isComplete')
ACTIVE_AGENT=$(echo "$RESPONSE" | jq -r '.result.state.activeAgent')
echo "Turn: $TURN_COUNT | Agent: $ACTIVE_AGENT | Complete: $IS_COMPLETE"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Session ID: $SESSION_ID"
echo "Total Turns: $TURN_COUNT"
echo "Final Agent: $ACTIVE_AGENT"
echo "Complete: $IS_COMPLETE"
echo ""

if [ "$IS_COMPLETE" = "true" ]; then
    echo "✅ Interview completed successfully!"
elif [ "$TURN_COUNT" -ge "4" ]; then
    echo "✅ Fix verified: Interview progressed through multiple turns (expected 4-6)"
else
    echo "❌ Issue: Interview ended prematurely at turn $TURN_COUNT"
fi
