#!/bin/bash

# Enhanced test script for deployed agent service with full output
API_URL="https://teachmeai-agent-service-584680412286.us-central1.run.app/quizGuide"
SUPERVISOR_URL="https://teachmeai-agent-service-584680412286.us-central1.run.app/supervisorFlow"

echo "🧪 Testing Deployed Agent Service (Enhanced)"
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

# Array to store all responses
declare -a TURNS
declare -a AGENTS
declare -a MESSAGES

# Function to make request and extract data
make_turn() {
    local turn_num=$1
    local user_msg=$2
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 Turn $turn_num"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "👤 USER: $user_msg"
    echo ""
    
    RESPONSE=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d '{
        "state": '"$STATE"',
        "userMessage": "'"$user_msg"'"
      }')
    
    # Extract key fields
    local agent_msg=$(echo "$RESPONSE" | jq -r '.result.message')
    local turn_count=$(echo "$RESPONSE" | jq -r '.result.state.turnCount')
    local is_complete=$(echo "$RESPONSE" | jq -r '.result.isComplete')
    local active_agent=$(echo "$RESPONSE" | jq -r '.result.state.activeAgent')
    local progress=$(echo "$RESPONSE" | jq -r '.result.progress')
    local next_field=$(echo "$RESPONSE" | jq -r '.result.action.targetField // "none"')
    
    # Store for summary
    TURNS[$turn_num]=$turn_count
    AGENTS[$turn_num]=$active_agent
    MESSAGES[$turn_num]="$agent_msg"
    
    # Display agent response
    echo "🤖 AGENT ($active_agent):"
    echo "$agent_msg" | fold -w 70 -s
    echo ""
    echo "📊 Status: Turn $turn_count | Progress: $progress% | Next: $next_field | Complete: $is_complete"
    echo ""
    
    # Update state for next turn
    STATE=$(echo "$RESPONSE" | jq -c '.result.state')
    
    # Return completion status
    echo "$is_complete"
}

# Run conversation
IS_COMPLETE=$(make_turn 1 "Hi, I am Khalid")
[ "$IS_COMPLETE" = "true" ] && exit 0

IS_COMPLETE=$(make_turn 2 "khalid@teachmeai.in")
[ "$IS_COMPLETE" = "true" ] && exit 0

IS_COMPLETE=$(make_turn 3 "Technology")
[ "$IS_COMPLETE" = "true" ] && exit 0

IS_COMPLETE=$(make_turn 4 "I am at skill level 3 out of 5")
[ "$IS_COMPLETE" = "true" ] && exit 0

IS_COMPLETE=$(make_turn 5 "I learn best by doing hands-on projects, I'm a pragmatist")
[ "$IS_COMPLETE" = "true" ] && exit 0

IS_COMPLETE=$(make_turn 6 "I have a clear vision - become an AI-powered PM in 6 months")
[ "$IS_COMPLETE" = "true" ] && exit 0

IS_COMPLETE=$(make_turn 7 "I can dedicate 5 hours per week, about 300 minutes")
[ "$IS_COMPLETE" = "true" ] && exit 0

# If still not complete, trigger supervisor analysis
if [ "$IS_COMPLETE" != "true" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🧠 Triggering AI Analysis (Supervisor Flow)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Extract collected data from state
    INTAKE_DATA=$(echo "$STATE" | jq '{
        name: .fields.name.value,
        email: .fields.email.value,
        currentRoles: [.fields.role_raw.value],
        primaryGoal: .fields.goal_raw.value,
        skillStage: .fields.skill_stage.value,
        learnerType: .fields.learner_type.value,
        timePerWeekMins: .fields.time_per_week_mins.value,
        sessionId: .sessionId
    }')
    
    echo "📦 Sending data to supervisor..."
    
    SUPERVISOR_RESPONSE=$(curl -s -X POST "$SUPERVISOR_URL" \
      -H "Content-Type: application/json" \
      -d '{
        "data": '"$INTAKE_DATA"',
        "sessionId": "'$SESSION_ID'",
        "intakeState": '"$STATE"'
      }')
    
    echo "✅ Analysis complete!"
    echo ""
fi

# Final Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 CONVERSATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Session ID: $SESSION_ID"
echo "Total Turns: ${#TURNS[@]}"
echo ""

for i in "${!TURNS[@]}"; do
    echo "Turn $i: ${AGENTS[$i]}"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 COLLECTED DATA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$STATE" | jq -r '.fields | to_entries[] | select(.value.value != null) | "\(.key): \(.value.value)"'

if [ -n "$SUPERVISOR_RESPONSE" ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎯 AI ANALYSIS REPORT"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Extract and display profile
    echo "👤 LEARNER PROFILE:"
    echo "$SUPERVISOR_RESPONSE" | jq -r '.result.profile.summary' | fold -w 70 -s
    echo ""
    
    # Extract and display strategy
    echo "🎯 IMPACT STRATEGY:"
    echo ""
    echo "Identify:"
    echo "$SUPERVISOR_RESPONSE" | jq -r '.result.strategy.identify' | fold -w 70 -s
    echo ""
    echo "Motivate:"
    echo "$SUPERVISOR_RESPONSE" | jq -r '.result.strategy.motivate' | fold -w 70 -s
    echo ""
    echo "Plan:"
    echo "$SUPERVISOR_RESPONSE" | jq -r '.result.strategy.plan' | fold -w 70 -s
    echo ""
    echo "Act:"
    echo "$SUPERVISOR_RESPONSE" | jq -r '.result.strategy.act' | fold -w 70 -s
    echo ""
    echo "Check:"
    echo "$SUPERVISOR_RESPONSE" | jq -r '.result.strategy.check' | fold -w 70 -s
    echo ""
    echo "Transform:"
    echo "$SUPERVISOR_RESPONSE" | jq -r '.result.strategy.transform' | fold -w 70 -s
    echo ""
    
    # Extract and display tactics
    echo "🛠️ ACTIONABLE TACTICS:"
    echo "$SUPERVISOR_RESPONSE" | jq -r '.result.tactics.actions[]' | nl
    echo ""
    
    # Extract and display next steps
    echo "📌 NEXT STEPS:"
    echo "$SUPERVISOR_RESPONSE" | jq -r '.result.tactics.nextSteps[]' | nl
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TEST COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
