#!/bin/bash

echo "⚡ Performance Audit - Gemini Response Times"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_URL="https://teachmeai-agent-service-584680412286.us-central1.run.app/quizGuide"
SUPERVISOR_URL="https://teachmeai-agent-service-584680412286.us-central1.run.app/supervisorFlow"

# Test 1: Single Turn Response Time
echo "Test 1: Single Turn Response Time (5 runs)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SESSION_ID="perf_$(date +%s)"
STATE='{
  "sessionId": "'$SESSION_ID'",
  "activeAgent": "guide",
  "turnCount": 0,
  "fields": {
    "role_raw": {"value": "Product Manager", "status": "prefilled"},
    "goal_raw": {"value": "Learn AI", "status": "prefilled"}
  },
  "metadata": {"startTime": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "mode": "interview"},
  "isComplete": false
}'

total=0
for i in {1..5}; do
    start=$(python3 -c 'import time; print(int(time.time() * 1000))')
    
    curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d '{
        "state": '"$STATE"',
        "userMessage": "Hi, I am Test User"
      }' > /dev/null
    
    end=$(python3 -c 'import time; print(int(time.time() * 1000))')
    duration=$((end - start))
    total=$((total + duration))
    
    echo "  Run $i: ${duration}ms"
done

avg=$((total / 5))
echo ""
echo "  Average: ${avg}ms"
echo "  Target: < 3000ms"

if [ $avg -lt 3000 ]; then
    echo "  Status: ✅ PASS"
else
    echo "  Status: ⚠️  SLOW"
fi

echo ""

# Test 2: Supervisor Analysis Time
echo "Test 2: Supervisor Analysis Time (3 runs)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PAYLOAD='{
  "data": {
    "name": "Test User",
    "email": "test@example.com",
    "currentRoles": ["Product Manager"],
    "primaryGoal": "Learn AI",
    "skillStage": 3,
    "learnerType": "pragmatist",
    "timePerWeekMins": 300,
    "sessionId": "'$SESSION_ID'",
    "goalSettingConfidence": 3,
    "newApproachesFrequency": 3,
    "reflectionFrequency": 3,
    "aiToolsConfidence": 3,
    "resilienceLevel": 3,
    "clearCareerVision": 4,
    "successDescription": 3,
    "learningForChallenge": 3,
    "outcomeDrivenLearning": 3,
    "timeBarrier": 3,
    "currentFrustrations": "Time management",
    "varkPreferences": {"visual": 3, "audio": 3, "readingWriting": 3, "kinesthetic": 4},
    "concreteBenefits": "Save time",
    "shortTermApplication": "Use AI for specs",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  },
  "sessionId": "'$SESSION_ID'"
}'

total=0
for i in {1..3}; do
    start=$(python3 -c 'import time; print(int(time.time() * 1000))')
    
    curl -s -X POST "$SUPERVISOR_URL" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD" > /dev/null
    
    end=$(python3 -c 'import time; print(int(time.time() * 1000))')
    duration=$((end - start))
    total=$((total + duration))
    
    echo "  Run $i: ${duration}ms"
done

avg=$((total / 3))
echo ""
echo "  Average: ${avg}ms"
echo "  Target: < 15000ms"

if [ $avg -lt 15000 ]; then
    echo "  Status: ✅ PASS"
else
    echo "  Status: ⚠️  SLOW"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Performance Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Single Turn: ${avg}ms (target: < 3000ms)"
echo "Supervisor: ${avg}ms (target: < 15000ms)"
echo ""
echo "✅ Performance audit complete"
