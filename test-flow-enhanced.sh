#!/bin/bash

API_URL="https://teachmeai-agent-service-584680412286.us-central1.run.app/quizGuide"
SUPERVISOR_URL="https://teachmeai-agent-service-584680412286.us-central1.run.app/supervisorFlow"

echo "🧪 Enhanced Agent Flow Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SESSION_ID="test_$(date +%s)"
STATE_FILE="/tmp/state_${SESSION_ID}.json"

# Initialize state
cat > "$STATE_FILE" <<EOF
{
  "sessionId": "$SESSION_ID",
  "activeAgent": "guide",
  "turnCount": 0,
  "fields": {
    "role_raw": {"value": "Product Manager", "status": "prefilled"},
    "goal_raw": {"value": "Learn AI for PRDs", "status": "prefilled"}
  },
  "metadata": {"startTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)", "mode": "interview"},
  "isComplete": false
}
EOF

make_turn() {
    local turn=$1
    local msg=$2
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 Turn $turn"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "👤 USER: $msg"
    echo ""
    
    local payload=$(jq -n --arg msg "$msg" --slurpfile state "$STATE_FILE" '{state: $state[0], userMessage: $msg}')
    
    curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d "$payload" > /tmp/response.json
    
    local agent_msg=$(jq -r '.result.message' /tmp/response.json)
    local agent=$(jq -r '.result.state.activeAgent' /tmp/response.json)
    local turn_count=$(jq -r '.result.state.turnCount' /tmp/response.json)
    local progress=$(jq -r '.result.progress' /tmp/response.json)
    local complete=$(jq -r '.result.isComplete' /tmp/response.json)
    
    echo "🤖 AGENT ($agent):"
    echo "$agent_msg" | fold -w 70 -s
    echo ""
    echo "📊 Turn: $turn_count | Progress: $progress% | Complete: $complete"
    echo ""
    
    jq '.result.state' /tmp/response.json > "$STATE_FILE"
    
    echo "$complete"
}

# Run conversation
complete=$(make_turn 1 "Hi, I'm Khalid")
[ "$complete" = "true" ] && exit 0

complete=$(make_turn 2 "khalid@teachmeai.in")
[ "$complete" = "true" ] && exit 0

complete=$(make_turn 3 "Technology")
[ "$complete" = "true" ] && exit 0

complete=$(make_turn 4 "I'm at skill level 3 out of 5")
[ "$complete" = "true" ] && exit 0

complete=$(make_turn 5 "I'm a pragmatist, I learn by doing hands-on projects")
[ "$complete" = "true" ] && exit 0

complete=$(make_turn 6 "I have a clear vision to become an AI-powered PM in 6 months")
[ "$complete" = "true" ] && exit 0

complete=$(make_turn 7 "I can dedicate 300 minutes per week, about 5 hours")
[ "$complete" = "true" ] && exit 0

# Trigger supervisor analysis
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧠 Triggering AI Analysis"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build intake data from state
jq '{
    data: {
        name: .fields.name.value,
        email: .fields.email.value,
        currentRoles: [(.fields.role_category.value | if . then . else .fields.role_raw.value end)],
        primaryGoal: (if .fields.goal_calibrated.value then .fields.goal_calibrated.value else .fields.goal_raw.value end),
        skillStage: .fields.skill_stage.value,
        learnerType: .fields.learner_type.value,
        timePerWeekMins: .fields.time_per_week_mins.value,
        sessionId: .sessionId,
        goalSettingConfidence: 3,
        newApproachesFrequency: 3,
        reflectionFrequency: 3,
        aiToolsConfidence: 3,
        resilienceLevel: 3,
        clearCareerVision: (if .fields.vision_clarity.value then .fields.vision_clarity.value else 3 end),
        successDescription: 3,
        learningForChallenge: 3,
        outcomeDrivenLearning: 3,
        timeBarrier: 3,
        currentFrustrations: "Time management",
        varkPreferences: {visual: 3, audio: 3, readingWriting: 3, kinesthetic: 4},
        concreteBenefits: "Save time on PRDs",
        shortTermApplication: "Use AI for product specs",
        timestamp: .metadata.startTime
    },
    sessionId: .sessionId,
    intakeState: .
}' "$STATE_FILE" > /tmp/supervisor_payload.json

curl -s -X POST "$SUPERVISOR_URL" -H "Content-Type: application/json" -d @/tmp/supervisor_payload.json > /tmp/supervisor_response.json

echo "✅ Analysis complete!"
echo ""

# Check if response is valid
if ! jq empty /tmp/supervisor_response.json 2>/dev/null; then
    echo "❌ Supervisor response invalid JSON"
    cat /tmp/supervisor_response.json
    exit 1
fi

# Display results
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 CONVERSATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Session: $SESSION_ID"
echo "Turns: $(jq -r '.turnCount' "$STATE_FILE")"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 COLLECTED DATA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
jq -r '.fields | to_entries[] | select(.value.value != null) | "\(.key): \(.value.value)"' "$STATE_FILE"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 AI ANALYSIS REPORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "👤 LEARNER PROFILE:"
jq -r '.result.learnerProfile // "N/A"' /tmp/supervisor_response.json | fold -w 70 -s
echo ""

echo "🎯 IMPACT STRATEGY:"
echo ""
echo "Identify:"
jq -r '.result.Identify // "N/A"' /tmp/supervisor_response.json | fold -w 70 -s
echo ""
echo "Motivate:"
jq -r '.result.Motivate // "N/A"' /tmp/supervisor_response.json | fold -w 70 -s
echo ""
echo "Plan:"
jq -r '.result.Plan // "N/A"' /tmp/supervisor_response.json | fold -w 70 -s
echo ""
echo "Act:"
jq -r '.result.Act // "N/A"' /tmp/supervisor_response.json | fold -w 70 -s
echo ""
echo "Check:"
jq -r '.result.Check // "N/A"' /tmp/supervisor_response.json | fold -w 70 -s
echo ""
echo "Transform:"
jq -r '.result.Transform // "N/A"' /tmp/supervisor_response.json | fold -w 70 -s
echo ""

echo "🛠️ ACTIONABLE TACTICS:"
jq -r '.result.recommendations[]? // empty' /tmp/supervisor_response.json | nl
echo ""

echo "📌 NEXT STEPS:"
jq -r '.result.nextSteps[]? // empty' /tmp/supervisor_response.json | nl
echo ""

echo "🎯 TOP AI OPPORTUNITIES:"
jq -r '.result.research.topPriorities[]? | "\(.name): \(.quickWin)"' /tmp/supervisor_response.json | nl
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TEST COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Cleanup
# rm -f "$STATE_FILE" /tmp/response.json /tmp/supervisor_payload.json /tmp/supervisor_response.json
echo ""
echo "Debug files saved in /tmp/supervisor_response.json"
