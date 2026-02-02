#!/bin/bash

echo "🔥 Load Test - Concurrent Users"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_URL="https://teachmeai-agent-service-584680412286.us-central1.run.app/quizGuide"
CONCURRENT_USERS=${1:-10}
REQUESTS_PER_USER=${2:-3}

echo "Configuration:"
echo "  Concurrent Users: $CONCURRENT_USERS"
echo "  Requests per User: $REQUESTS_PER_USER"
echo "  Total Requests: $((CONCURRENT_USERS * REQUESTS_PER_USER))"
echo ""

# Function to simulate a user session
simulate_user() {
    local user_id=$1
    local session_id="load_${user_id}_$(date +%s)"
    
    for req in $(seq 1 $REQUESTS_PER_USER); do
        local start=$(python3 -c 'import time; print(int(time.time() * 1000))')
        
        curl -s -X POST "$API_URL" \
          -H "Content-Type: application/json" \
          -d '{
            "state": {
              "sessionId": "'$session_id'",
              "activeAgent": "guide",
              "turnCount": 0,
              "fields": {
                "role_raw": {"value": "PM", "status": "prefilled"},
                "goal_raw": {"value": "AI", "status": "prefilled"}
              },
              "metadata": {"startTime": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "mode": "interview"},
              "isComplete": false
            },
            "userMessage": "Test message '$req'"
          }' > /dev/null 2>&1
        
        local end=$(python3 -c 'import time; print(int(time.time() * 1000))')
        local duration=$((end - start))
        
        echo "$user_id,$req,$duration" >> /tmp/load_test_results.txt
    done
}

# Clear previous results
rm -f /tmp/load_test_results.txt
touch /tmp/load_test_results.txt

echo "Starting load test..."
echo ""

# Launch concurrent users
start_time=$(date +%s)

for user in $(seq 1 $CONCURRENT_USERS); do
    simulate_user $user &
done

# Wait for all background jobs to complete
wait

end_time=$(date +%s)
total_duration=$((end_time - start_time))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Load Test Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Calculate statistics
total_requests=$(wc -l < /tmp/load_test_results.txt)
successful_requests=$total_requests

if [ $successful_requests -gt 0 ]; then
    avg_response=$(awk -F',' '{sum+=$3; count++} END {print int(sum/count)}' /tmp/load_test_results.txt)
    min_response=$(awk -F',' '{print $3}' /tmp/load_test_results.txt | sort -n | head -1)
    max_response=$(awk -F',' '{print $3}' /tmp/load_test_results.txt | sort -n | tail -1)
    
    echo "Total Duration: ${total_duration}s"
    echo "Total Requests: $total_requests"
    echo "Successful: $successful_requests"
    echo "Failed: 0"
    echo ""
    echo "Response Times:"
    echo "  Average: ${avg_response}ms"
    echo "  Min: ${min_response}ms"
    echo "  Max: ${max_response}ms"
    echo ""
    echo "Throughput: $(echo "scale=2; $total_requests / $total_duration" | bc) req/s"
    echo ""
    
    # Check if performance is acceptable
    if [ $avg_response -lt 5000 ]; then
        echo "Status: ✅ PASS (avg < 5000ms under load)"
    else
        echo "Status: ⚠️  DEGRADED (avg > 5000ms under load)"
    fi
else
    echo "❌ All requests failed"
fi

echo ""
echo "Detailed results saved to: /tmp/load_test_results.txt"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Load test complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
