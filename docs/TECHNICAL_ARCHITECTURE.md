# 🏗️ Technical Architecture Documentation

**TeachMeAI Intake App - Cloud Run Agent Service**  
**Version**: 1.0.0  
**Last Updated**: January 24, 2026

---

## 📋 Table of Contents

1. [Agent System Overview](#agent-system-overview)
2. [Technology Stack](#technology-stack)
3. [AI Agents in Detail](#ai-agents-in-detail)
4. [APIs & SDKs](#apis--sdks)
5. [Limitations & Constraints](#limitations--constraints)
6. [Performance Characteristics](#performance-characteristics)
7. [Cost Considerations](#cost-considerations)

---

## 🤖 Agent System Overview

### Multi-Agent Architecture

Your Cloud Run service implements a **4-agent workflow** using the **IMPACT framework**:

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPERVISOR AGENT                          │
│                  (Orchestrator & Assembler)                  │
│                                                              │
│  Input: Learner Intake Data                                │
│  Output: Complete IMPACT Analysis                          │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├──────► PHASE 1: PROFILER AGENT
               │         • Analyzes learner psychology
               │         • Assesses learning styles
               │         • Creates detailed profile
               │
               ├──────► PHASE 2: STRATEGIST AGENT
               │         • Develops IMPACT strategy
               │         • Plans learning approach
               │         • Aligns with career goals
               │
               ├──────► PHASE 3: TACTICIAN AGENT
               │         • Creates action steps
               │         • Considers constraints
               │         • Generates recommendations
               │
               └──────► PHASE 4: ASSEMBLY
                        • Combines all agent outputs
                        • Formats IMPACT framework
                        • Returns final analysis
```

---

## 🛠️ Technology Stack

### Core Framework: **Google Firebase Genkit**

**Genkit** is an AI application framework that simplifies building with AI models and flows.

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **AI Framework** | Firebase Genkit | 1.28.0 | Agent orchestration & workflows |
| **Language** | TypeScript | 5.4.3 | Type-safe development |
| **Runtime** | Node.js | ≥18 | Serverless execution |
| **AI Model** | Google Gemini 2.0 Flash | Latest | Large language model |
| **API Server** | Express.js | 4.19.2 | HTTP endpoint handling |
| **Validation** | Zod | 3.23.8 | Schema validation |
| **Deployment** | Google Cloud Run | - | Serverless containers |

### Dependencies

```json
{
  "@genkit-ai/ai": "latest",           // Core AI capabilities
  "@genkit-ai/core": "latest",         // Genkit core functionality
  "@genkit-ai/flow": "latest",         // Flow/workflow management
  "@genkit-ai/googleai": "latest",     // Google AI integration
  "@genkit-ai/vertexai": "latest",     // Vertex AI support
  "genkit": "^1.28.0",                 // Main Genkit SDK
  "express": "^4.19.2",                // Web server
  "cors": "^2.8.5",                    // Cross-origin requests
  "dotenv": "^16.4.5",                 // Environment variables
  "zod": "^3.23.8"                     // Schema validation
}
```

---

## 🤖 AI Agents in Detail

### 1️⃣ **Supervisor Agent** (`supervisor.ts`)

**Role**: Orchestrator & Flow Manager

**Responsibilities**:
- Coordinates the entire analysis workflow
- Calls each agent in sequence
- Assembles final IMPACT analysis
- Returns complete results to frontend

**Input**: Raw intake form data  
**Output**: Complete IMPACT analysis with recommendations

**Key Code**:
```typescript
export const supervisorFlow = ai.defineFlow({
  name: 'supervisorFlow',
  inputSchema: IntakeResponseSchema,
  outputSchema: IMPACTAnalysisSchema,
}, async (intake) => {
  // Phase 1: Profiling
  const profile = await profilerFlow(intake);
  
  // Phase 2: Strategy
  const strategy = await strategistFlow({
    profile,
    professionalRoles: intake.currentRoles,
    careerVision: "Implicit based on intake"
  });
  
  // Phase 3: Tactics
  const tactics = await tacticianFlow({
    strategy,
    constraints: {
      timeBarrier: intake.timeBarrier,
      skillStage: intake.skillStage
    }
  });
  
  // Phase 4: Assembly
  return { /* IMPACT framework object */ };
});
```

---

### 2️⃣ **Profiler Agent** (`profiler.ts`)

**Role**: Educational Psychologist & Learner Analyst

**AI Model**: Gemini 2.0 Flash  
**Framework Used**: 
- Self-Regulated Learning (SRL)
- Motivation Theory
- Psychological Capital (PsyCap)
- Learning Styles (Kolb/VARK/Dreyfus)

**Responsibilities**:
- Analyzes psychological traits
- Assesses learning preferences
- Determines motivation type
- Creates structured learner profile

**Input**: Intake response data  
**Output**: Detailed psychological and learning profile

**Prompt Strategy**:
```typescript
const prompt = `
You are an Expert Educational Psychologist and Learner Profiler.
Analyze the following learner intake data using these frameworks:
1. Self-Regulated Learning (SRL): Assess goal setting, monitoring, reflection.
2. Motivation Theory: Determine if driven by intrinsic curiosity or extrinsic outcomes.
3. Psychological Capital (PsyCap): Assess resilience and confidence.
4. Learning Styles: Synthesize Kolb/VARK/Dreyfus inputs.

Data: ${JSON.stringify(input, null, 2)}

Output a structured profile containing their psychological traits and specific learning preferences.
`;
```

---

### 3️⃣ **Strategist Agent** (`strategist.ts`)

**Role**: Career Strategist & Knowledge Management Expert

**AI Model**: Gemini 2.0 Flash  
**Framework**: IMPACT (Identify, Motivate, Plan phases)

**Responsibilities**:
- Identifies focus areas aligned with career
- Creates motivational strategy
- Develops high-level learning plan
- Applies Personal Knowledge Management (PKM) principles

**Input**: Learner profile + career context  
**Output**: Strategic plan (Identify, Motivate, Plan)

**Frameworks Applied**:
- IMPACT framework (I, M, P phases)
- PARA method (Projects, Areas, Resources, Archives)
- Second Brain principles

**Prompt Strategy**:
```typescript
const prompt = `
You are a Senior Career Strategist and Knowledge Management Expert.
Using the IMPACT framework (specifically phases Identify, Motivate, Plan), 
map out a strategy for this learner.

Tasks:
1. Identify: Re-state the top focus areas in the context of their career.
2. Motivate: Leverage their ${motivationType} motivation.
3. Plan: Create a high-level strategy using PKM principles (PARA, Second Brain).
`;
```

---

### 4️⃣ **Tactician Agent** (`tactician.ts`)

**Role**: Agile Coach & Execution Planner

**AI Model**: Gemini 2.0 Flash  
**Framework**: IMPACT (Act, Check, Transform phases)

**Responsibilities**:
- Converts strategy into executable actions
- Adapts to constraints (time, skill level)
- Creates concrete next steps
- Generates specific recommendations

**Input**: Strategy + constraints (time barrier, skill stage)  
**Output**: Action plan (Act, Check, Transform) + recommendations

**Adaptive Logic**:
- High time barrier → Micro-learning suggestions
- Low skill stage → Structured, rule-based practice
- Considers constraints to make realistic plans

**Prompt Strategy**:
```typescript
const prompt = `
You are an Agile Coach and Mentor (The Tactician).
Your goal is to turn a high-level strategy into an executable plan 
(IMPACT Phases: Act, Check, Transform).

Constraints:
- Time Barrier Level: ${timeBarrier}/5
- Skill Stage: ${skillStage}/5

If time barrier is high, suggest micro-learning. 
If skill stage is low, suggest structured, rule-based practice.
`;
```

---

## 📡 APIs & SDKs

### Google AI APIs

#### **Gemini API** (via `@genkit-ai/googleai`)

**What it does**: Provides access to Google's Gemini 2.0 Flash model

**Model Used**: `gemini-2.0-flash-exp`
- Latest experimental version
- Fast inference
- Good quality for reasoning tasks

**Authentication**: API Key (GOOGLE_GENAI_API_KEY)

**SDK**: `@genkit-ai/googleai`
```typescript
import { gemini20Flash } from '@genkit-ai/googleai';

const { output } = await ai.generate({
  model: gemini20Flash,
  prompt: prompt,
  output: { schema: OutputSchema }
});
```

#### **Vertex AI** (optional, via `@genkit-ai/vertexai`)

**Included but not currently active**
- Can switch to Vertex AI for production enterprise use
- Would require Google Cloud authentication
- Provides better SLAs and quotas

---

### Firebase Genkit SDK

#### **Core Capabilities**

1. **Flow Definition** (`ai.defineFlow`)
   - Type-safe input/output schemas
   - Automatic error handling
   - Built-in telemetry

2. **AI Generation** (`ai.generate`)
   - Structured output with Zod schemas
   - Automatic retries
   - Streaming support (not currently used)

3. **Schema Validation** (Zod integration)
   - Runtime type checking
   - Compile-time type safety
   - Automatic error messages

**Example Usage**:
```typescript
export const profilerFlow = ai.defineFlow(
  {
    name: 'profilerFlow',
    inputSchema: IntakeResponseSchema,    // Zod schema
    outputSchema: LearnerProfileSchema,   // Zod schema
  },
  async (input) => {
    const { output } = await ai.generate({
      model: gemini20Flash,
      prompt: prompt,
      output: { schema: LearnerProfileSchema }
    });
    return output;
  }
);
```

---

### HTTP API (Express.js)

**Endpoint**: `POST /supervisorFlow`

**Request Format**:
```json
{
  "goalSettingConfidence": 4,
  "learnerType": "explorer",
  "varkPreferences": {
    "visual": 4,
    "auditory": 3,
    "reading": 5,
    "kinesthetic": 2
  },
  "currentRoles": ["developer", "student"],
  "timeBarrier": 3,
  "skillStage": 2,
  // ... additional fields
}
```

**Response Format**:
```json
{
  "Identify": "...",
  "Motivate": "...",
  "Plan": "...",
  "Act": "...",
  "Check": "...",
  "Transform": "...",
  "nextSteps": ["...", "..."],
  "learnerProfile": "{ psychological profile JSON }",
  "recommendations": ["...", "..."]
}
```

---

## ⚠️ Limitations & Constraints

### 1. **Google Cloud Run Limits**

| Limit Type | Default | Impact |
|------------|---------|--------|
| **Max Request Time** | 300 seconds (5 min) | Timeout if AI takes too long |
| **Memory** | 512 MB (configurable) | May need increase for complex processing |
| **CPU** | 1 vCPU | Sequential AI calls can be slow |
| **Concurrent Requests** | Auto-scaling | Cost increases with traffic |
| **Cold Start** | 2-3 seconds | First request after idle is slower |
| **Max Instances** | 100 (configurable) | Can limit concurrent capacity |

**Current Configuration**:
```
Resource: 512 MB RAM, 1 CPU
Timeout: 300 seconds
Min Instances: 0 (scales to zero)
Max Instances: 100
```

### 2. **Gemini API Limits**

#### Free Tier (if using API key):
- **Requests per minute (RPM)**: 15
- **Tokens per minute (TPM)**: 1 million
- **Requests per day (RPD)**: 1,500

#### Paid Tier:
- **RPM**: 360 (Pay-as-you-go)
- **TPM**: Higher limits
- **Cost**: ~$0.075 per 1K characters input + $0.30 per 1K output

**Impact on Your App**:
- With 4 AI calls per submission (Profiler, Strategist, Tactician + potential supervisor reasoning)
- Free tier: ~375 submissions per day max
- Paid tier: Much higher capacity

### 3. **Sequential Processing Limitation**

**Current Design**: Agents run sequentially
```
Profiler (3-5s) → Strategist (3-5s) → Tactician (3-5s) = 10-15s total
```

**Why Sequential**:
- Each agent depends on previous output
- Supervisor orchestrates the flow
- Can't parallelize due to dependencies

**Potential Optimization**:
- Cache common profiles
- Use lighter prompts for faster responses
- Consider async background processing

### 4. **Cost Considerations**

**Per Submission Cost** (approximate):

| Component | Cost |
|-----------|------|
| Gemini API (4 calls) | $0.03 - $0.08 |
| Cloud Run (vCPU-seconds) | $0.0001 - $0.0002 |
| Cloud Run (memory) | $0.00001 |
| Google Sheets API | Free |
| **Total per submission** | **~$0.03 - $0.10** |

**Monthly Estimates**:
- 100 submissions/day = $90-300/month
- 1000 submissions/day = $900-3000/month

### 5. **Type Safety & Validation**

**Zod Schemas** enforce strict typing:

**Pros**:
- ✅ Catches errors at runtime
- ✅ Prevents malformed data
- ✅ Self-documenting

**Limitation**:
- ❌ AI output must match schema exactly
- ❌ Can fail if AI generates unexpected format
- ❌ Requires error handling for schema mismatches

### 6. **Google Sheets as Database**

**Current Setup**: Google Sheets for data storage

**Limitations**:
- **Max Cells**: 10 million cells per spreadsheet
- **API Quota**: 300 requests per minute per project
- **Write Speed**: ~1-2 seconds per write
- **Concurrent Writes**: Limited (can cause conflicts)
- **Query Performance**: Slow for large datasets
- **No Relationships**: Flat data structure

**Recommendations**:
- ✅ Fine for <1000 submissions/day
- ⚠️ Consider database for >5000 submissions/day
- ⚠️ Add caching layer for reads

### 7. **Error Handling**

**Current Approach**:
```typescript
if (!output) {
  throw new Error("Agent failed to generate output");
}
```

**Limitations**:
- Basic error messages
- No automatic retries (Genkit provides some)
- Frontend gets generic 500 errors
- Limited debugging information in production

---

## 📊 Performance Characteristics

### Response Time Breakdown

**Typical Request** (15 seconds total):

```
User submits form
    ↓ [100ms]
Vercel frontend validation
    ↓ [200ms]
POST to Cloud Run
    ↓ [2s cold start OR 100ms warm]
Supervisor starts
    ↓ [3-5s]
Profiler Agent (Gemini API call)
    ↓ [3-5s]
Strategist Agent (Gemini API call)
    ↓ [3-5s]
Tactician Agent (Gemini API call)
    ↓ [500ms]
Response assembly
    ↓ [200ms]
Save to Google Sheets
    ↓ [100ms]
Return to frontend
```

**Optimization Opportunities**:
1. Keep Cloud Run warm (min instances = 1)
2. Optimize prompts for faster AI responses
3. Implement caching for common scenarios
4. Async Google Sheets write (don't wait for confirmation)

---

## 🔄 Scalability & Reliability

### Auto-Scaling

**Cloud Run** automatically scales based on:
- Request volume
- CPU utilization
- Memory usage

**Configuration**:
```yaml
Min instances: 0 (scales to zero when idle)
Max instances: 100
Concurrency: 80 requests per instance
```

### Reliability

**Built-in Features**:
- ✅ Automatic instance health checks
- ✅ Request retries from Vercel
- ✅ Genkit error handling
- ✅ Graceful degradation (Sheets errors don't fail request)

**Missing**:
- ❌ Circuit breakers
- ❌ Rate limiting per user
- ❌ Request queuing
- ❌ Dead letter queue for failed requests

---

## 🎯 Recommendations for Production

### Immediate (v1.x)
1. **Monitor Gemini API usage** - Track costs and quota
2. **Set up alerting** - Cloud Run errors, high latency
3. **Implement rate limiting** - Prevent abuse
4. **Add request logging** - Better debugging

### Short-term (v2.x)
1. **Migrate to database** - PostgreSQL or Firestore
2. **Add caching layer** - Redis for common profiles
3. **Implement async processing** - Queue system for heavy loads
4. **Switch to Vertex AI** - Better SLAs and quotas

### Long-term (v3.x)
1. **Multi-region deployment** - Lower latency globally
2. **Agent optimization** - Fine-tuned models
3. **Parallel processing** - Where possible
4. **Cost optimization** - Batch processing, prompt engineering

---

## 📚 Additional Resources

### Documentation Links
- [Firebase Genkit Docs](https://firebase.google.com/docs/genkit)
- [Google Gemini API](https://ai.google.dev/docs)
- [Cloud Run Docs](https://cloud.google.com/run/docs)
- [Zod Documentation](https://zod.dev/)

### Your Code Files
- `agent-service/src/agents/supervisor.ts` - Main orchestrator
- `agent-service/src/agents/profiler.ts` - Learner analysis
- `agent-service/src/agents/strategist.ts` - Strategy planning
- `agent-service/src/agents/tactician.ts` - Action planning
- `agent-service/src/genkit.ts` - Genkit configuration

---

**Last Updated**: January 24, 2026  
**Version**: 1.0.0  
**Status**: Production
