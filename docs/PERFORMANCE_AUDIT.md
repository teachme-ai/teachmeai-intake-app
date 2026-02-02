# ⚡ Performance Audit - Gemini Response Times

**Test Date**: February 2, 2026  
**Status**: ⏳ Ready for testing

---

## Objectives

1. Measure Gemini API response times
2. Identify bottlenecks in agent flow
3. Optimize slow operations
4. Set performance baselines

---

## Test Scenarios

### Scenario 1: Single Turn Response Time

**Endpoint**: `/quizGuide`  
**Metric**: Time from request to response  
**Target**: < 3 seconds average

### Scenario 2: Complete Interview Duration

**Flow**: 7 turns (guide → strategist → learner_dimensions → tactician)  
**Metric**: Total time for complete interview  
**Target**: < 25 seconds total

### Scenario 3: Supervisor Analysis Time

**Endpoint**: `/supervisorFlow`  
**Metric**: Time for IMPACT analysis generation  
**Target**: < 15 seconds

---

## Performance Test Script

```bash
#!/bin/bash

echo "⚡ Performance Audit - Gemini Response Times"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_URL="https://teachmeai-agent-service-584680412286.us-central1.run.app/quizGuide"
SUPERVISOR_URL="https://teachmeai-agent-service-584680412286.us-central1.run.app/supervisorFlow"

# Test 1: Single Turn Response Time
echo "Test 1: Single Turn Response Time"
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

for i in {1..5}; do
    start=$(date +%s%3N)
    
    curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d '{
        "state": '"$STATE"',
        "userMessage": "Hi, I am Test User"
      }' > /dev/null
    
    end=$(date +%s%3N)
    duration=$((end - start))
    
    echo "  Turn $i: ${duration}ms"
done

echo ""

# Test 2: Supervisor Analysis Time
echo "Test 2: Supervisor Analysis Time"
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

for i in {1..3}; do
    start=$(date +%s%3N)
    
    curl -s -X POST "$SUPERVISOR_URL" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD" > /dev/null
    
    end=$(date +%s%3N)
    duration=$((end - start))
    
    echo "  Analysis $i: ${duration}ms"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Performance audit complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

---

## Baseline Metrics (Expected)

### Single Turn Response
- **Cold Start**: 2000-3000ms (first request)
- **Warm**: 1000-2000ms (subsequent requests)
- **Target**: < 3000ms average

### Complete Interview (7 turns)
- **Total Duration**: 15-25 seconds
- **Per Turn Average**: 2-3 seconds
- **Target**: < 30 seconds total

### Supervisor Analysis
- **Profiler**: 2-3 seconds
- **Deep Research**: 5-7 seconds
- **Strategist**: 3-4 seconds
- **Tactician**: 2-3 seconds
- **Total**: 12-17 seconds
- **Target**: < 20 seconds

---

## Bottleneck Analysis

### Potential Bottlenecks

1. **Gemini API Latency**
   - Network round-trip time
   - Model inference time
   - Token generation time

2. **Agent Orchestration**
   - State serialization/deserialization
   - Field extraction logic
   - Agent handoff overhead

3. **Google Sheets Writes**
   - API call latency
   - Data formatting
   - Network overhead

4. **Cold Start (Cloud Run)**
   - Container initialization
   - Dependency loading
   - First request penalty

---

## Optimization Strategies

### If Response Time > 3s

**Option 1: Parallel Processing**
```typescript
// Run extraction and composition in parallel
const [extracted, composed] = await Promise.all([
    extractFields(userMessage, state),
    composeQuestion(state)
]);
```

**Option 2: Caching**
```typescript
// Cache common responses
const cache = new Map();
if (cache.has(questionKey)) {
    return cache.get(questionKey);
}
```

**Option 3: Streaming**
```typescript
// Stream responses instead of waiting for complete
const stream = await gemini.generateContentStream(prompt);
for await (const chunk of stream) {
    yield chunk.text();
}
```

**Option 4: Model Selection**
```typescript
// Use faster model for simple questions
const model = isComplexQuestion 
    ? 'gemini-2.0-flash-thinking-exp'
    : 'gemini-2.0-flash';
```

---

## Performance Monitoring

### Cloud Run Metrics

```bash
# View latency metrics
gcloud run services describe teachmeai-agent-service \
  --region=us-central1 \
  --format="value(status.latestReadyRevisionName)"

# View request metrics
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_latencies"'
```

### Application Logs

```bash
# Check response times in logs
gcloud run logs read teachmeai-agent-service \
  --region=us-central1 \
  --limit=100 | grep "duration"
```

---

## Test Results

### Single Turn Response Time

| Run | Duration (ms) | Status |
|-----|---------------|--------|
| 1   | ⏳            | Pending |
| 2   | ⏳            | Pending |
| 3   | ⏳            | Pending |
| 4   | ⏳            | Pending |
| 5   | ⏳            | Pending |
| **Avg** | **⏳**    | **Pending** |

**Target**: < 3000ms  
**Result**: ⏳ Pending

---

### Supervisor Analysis Time

| Run | Duration (ms) | Status |
|-----|---------------|--------|
| 1   | ⏳            | Pending |
| 2   | ⏳            | Pending |
| 3   | ⏳            | Pending |
| **Avg** | **⏳**    | **Pending** |

**Target**: < 15000ms  
**Result**: ⏳ Pending

---

## Recommendations

### If Performance is Acceptable (< 3s)
- ✅ No action needed
- Monitor in production
- Set up alerts for degradation

### If Performance is Slow (> 3s)
1. Implement caching for common questions
2. Use parallel processing where possible
3. Consider faster Gemini model
4. Optimize state serialization
5. Add request timeout handling

### If Performance is Critical (> 5s)
1. Implement streaming responses
2. Add loading indicators
3. Show partial results
4. Consider alternative AI providers
5. Implement request queuing

---

## Sign-off

- [ ] Performance tests executed
- [ ] Metrics documented
- [ ] Bottlenecks identified
- [ ] Optimizations implemented (if needed)
- [ ] Monitoring configured

**Tested by**: _____________  
**Date**: _____________  
**Average Response Time**: _____________ms  
**Status**: ⏳ Pending
