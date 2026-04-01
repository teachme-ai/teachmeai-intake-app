# TeachMeAI Intake App: Multi-Agent Architecture Analysis & ADK Upgrade Plan

**Date**: 2026-03-31
**Scope**: Full analysis of current multi-agent orchestration + Google ADK/A2A upgrade opportunities

---

## Table of Contents

1. [Current Architecture Overview](#current-architecture-overview)
2. [Phase 1: Interview Orchestration](#phase-1-interview-orchestration)
3. [Phase 2: Analysis Pipeline](#phase-2-analysis-pipeline)
4. [Strengths of Current Implementation](#strengths-of-current-implementation)
5. [Gaps & Improvement Opportunities](#gaps--improvement-opportunities)
6. [ADK + A2A Features You Can Leverage](#adk--a2a-features-you-can-leverage)
7. [Concrete High-Impact Suggestions](#concrete-high-impact-suggestions-priority-order)
8. [Sources](#sources)

---

## Current Architecture Overview

The intake app has a **two-phase multi-agent system** built on **Genkit + Gemini**:

- **Phase 1** — Interview orchestration (Next.js frontend, 4 sequential agents collecting data via chat)
- **Phase 2** — Analysis pipeline (Cloud Run agent-service, supervisor orchestrates 6 agents to produce IMPACT report)

Tech stack: Next.js + Genkit + Gemini 2.0 Flash (intake) / Gemini 1.5 Pro (reports) + Zod schemas + Cloud Run

---

## Phase 1: Interview Orchestration

A sequential pipeline of 4 agents collecting data from the user:

| Agent | Role | Owned Fields | Exit Criteria |
|-------|------|-------------|---------------|
| **Guide** | First touchpoint, collects identity | `name`, `email` | email filled |
| **Profiler** | Educational psychologist, learning style | `skill_stage`, `time_barrier`, `learner_type`, `vark_primary`, `vark_ranked`, `srl_goal_setting`, `srl_adaptability`, `tech_confidence` | skill + learner type filled |
| **Strategist** | Career alignment, motivation | `industry_vertical`, `industry`, `role_category`, `seniority`, `goal_calibrated`, `motivation_type`, `vision_clarity`, `benefits`, `application_context` | vertical + role + goal filled |
| **Tactician** | Execution logistics, pain points | `time_per_week_mins`, `constraints`, `current_tools`, `frustrations` | time commitment filled |

### Orchestration Flow (interviewEngine.ts)

The engine is a **deterministic state machine** with 3 phases per user turn:

```
User Message
    │
    ▼
┌─────────────────────┐
│  PHASE 1: EXTRACT   │  ← LLM extracts structured fields from natural language
│  (runs once)        │  ← Also has cheap deterministic parsing (e.g., "3 hours" → 180 mins)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  PHASE 2: DECIDE    │  ← Internal loop (max 2 iterations)
│  - Check exit       │  ← If agent's exit criteria met → advance to next agent
│  - Find next field  │  ← First missing owned field becomes the target
│  - Repetition guard │  ← Escalate: rephrase → MCQ → force-skip
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  PHASE 3: COMPOSE   │  ← LLM generates the next question
│  - Agent prompt     │  ← Each agent has a distinct system prompt/persona
│  - Question mode    │  ← MCQ / scale / numeric / list / free_text
│  - Persist state    │  ← Save to Firestore
└─────────────────────┘
```

### Agent Prompt Architecture

Each agent has a dedicated system prompt file defining:
- **Persona** (e.g., "Educational Psychologist", "Agile Coach")
- **Rules** (one question per turn, no repeats, accept response)
- **Allowed fields** (strict ownership boundaries)
- **Output format** (JSON with extractedData, nextQuestion, targetField, done)

---

## Phase 2: Analysis Pipeline

The `supervisorFlow` (Cloud Run agent-service) orchestrates a **sequential-then-parallel** pipeline:

```
IntakeState (from interview)
    │
    ▼
┌────────────────────────┐
│  Dossier Builder       │  ← Transforms flat IntakeState into dimensional LearnerDossier
│  (deterministic)       │  ← Preserves 30+ fields across 7 dimensions
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│  Phase 1: Profile      │  ← Rule-based psychographic derivation (NO LLM)
│  (profile-deriver.ts)  │  ← Maps SRL/learner dimensions → decisionStyle, cognitiveLoad, etc.
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│  Phase 2: Deep Research│  ← LLM generates AI opportunity map for role+industry
│  (deep-research.ts)    │  ← Output: aiOpportunityMap, topPriorities, risksAndGuardrails
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│  Phase 3: Strategist   │  ← LLM generates IMPACT framework (Identify/Motivate/Plan)
│  (strategist.ts)       │  ← Uses profile + research + all learner dimensions
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│  Phase 4: Tactician    │  ← LLM generates Act/Check/Transform
│  (tactician.ts)        │  ← Uses strategy + constraints + VARK + motivation
└────────────┬───────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Phase 5+6: PARALLEL (Promise.all)     │
│  ┌──────────────┐  ┌────────────────┐  │
│  │  Validator    │  │  Personalizer  │  │
│  │  Cross-checks │  │  Writes exec   │  │
│  │  plan vs      │  │  summary with  │  │
│  │  constraints  │  │  empathy+tone  │  │
│  └──────────────┘  └────────────────┘  │
└────────────────────┬───────────────────┘
                     │
                     ▼
┌────────────────────────┐
│  Phase 7: Assembly     │  ← Combines all outputs into final IMPACTAnalysis
└────────────────────────┘
```

### Key Data Structures

**LearnerDossier** (7 dimensions):
- `identity` — name, email, role, industry, goal
- `srl` — goalSetting, adaptability, reflection
- `motivation` — type, visionClarity, successClarity1yr
- `preferences` — learnerType, varkPrimary, varkRanked
- `readiness` — skillStage, techConfidence, resilience, digitalSkills
- `constraints` — timeBarrier, timePerWeekMins, blockers, frustrations, currentTools
- `context` — applicationContext, benefits, shortTermApplication

**PsychographicProfile** (derived rule-based):
- `decisionStyle` — Intuitive / Analytical / Hybrid
- `uncertaintyHandling` — Paralyzed / Checklist-Driven / Experimenter
- `changePreference` — 1-10 scale
- `socialEntanglement` — Solitary / Social
- `cognitiveLoadTolerance` — Low / Medium / High

---

## Strengths of Current Implementation

1. **Structured data extraction** with Zod schemas and typed field statuses (`candidate`/`confirmed`)
2. **Repetition guardrails** that escalate from rephrase → MCQ → force-skip
3. **Rule-based profile derivation** — deterministic, fast, no LLM cost for psychographic mapping
4. **LLM resilience wrapper** with retry logic on the analysis pipeline
5. **Rich dossier builder** that preserves 30+ fields in dimensional structure
6. **Parallel execution** of validator + personalizer in the final phase
7. **Question mode system** — automatically selects MCQ/scale/numeric/list/free_text per field type
8. **Evidence tracking** — each field records whether it was `response_to_question` or `spontaneous`
9. **Clean agent ownership** — each agent has strict field boundaries preventing overlap

---

## Gaps & Improvement Opportunities

### Gap 1: Conversational Context is Discarded

**Problem**: The interview agents extract field values, but the **conversational context** — the user's exact words, tone, hesitations, and spontaneous mentions — is discarded. Only extracted field values reach the analysis pipeline via the dossier builder.

**What's lost**:
- User's natural language describing their frustrations (richer than a single `frustrations` string)
- Implicit signals like confidence in answers, backtracking, enthusiasm
- Cross-agent context (e.g., something said to the Profiler that's relevant to the Strategist)
- Qualitative nuances that don't fit into enum/scale fields

### Gap 2: Agents Don't Share Context Across Boundaries

The Strategist in `composer.ts:58-59` receives **hardcoded placeholder data** instead of actual profiler results:

```typescript
// BUG: Hardcoded values instead of actual profiler data
systemPrompt = getStrategistPrompt({
    profile: { psychologicalProfile: { motivationType: 'growth' }, learningGlobal: {} },
    professionalRoles: [state.fields.role_raw?.value || 'Professional'],
    primaryGoal: state.fields.goal_raw?.value,
});
```

The Tactician similarly gets minimal context (`strategy: { focus: "Immediate Implementation" }`). Each agent operates in near-isolation during the interview phase.

### Gap 3: No Feedback Loop from Validator Back to Plan

The validator identifies issues (e.g., "plan suggests CLI tools but digitalSkills=2"), but corrections are logged and returned as `validationNotes` — they **never actually modify** the Act/Check/Transform outputs. It's observe-only, not corrective.

### Gap 4: Single-Pass Analysis (No Iteration)

The analysis pipeline is strictly one-shot: Research → Strategy → Tactics → Done. There's no loop where the Tactician can say "this strategy is infeasible given the constraints" and send it back to the Strategist for revision.

### Gap 5: Deep Research is Generic

The deep research agent gets role+goal+industry but doesn't leverage the rich psychographic profile, VARK preferences, or SRL dimensions. A visual learner who's an activist gets the same research output as a kinesthetic theorist.

---

## ADK + A2A Features You Can Leverage

### Feature 1: LoopAgent for Iterative Refinement

**What it is**: ADK's built-in `LoopAgent` runs sub-agents in sequence and repeats until a condition is met (`max_iterations` or `exit_loop` tool call).

**Your use**: Wrap Strategist → Tactician → Validator in a `LoopAgent`. If the validator flags issues, the loop re-runs with corrections injected into the strategist's context. This replaces the single-pass pipeline with **iterative refinement**.

```
LoopAgent(max_iterations=2):
  SequentialAgent:
    → StrategistAgent
    → TacticianAgent
    → ValidatorAgent (calls exit_loop if isValid=true)
```

### Feature 2: ParallelAgent for Concurrent Analysis

**What it is**: ADK's `ParallelAgent` runs sub-agents concurrently with shared session state, proper error isolation, and observability via OpenTelemetry traces.

**Your use**: Replace `Promise.all` for validator+personalizer with `ParallelAgent`. You could also parallelize Deep Research + Profile Derivation (they're independent). ADK gives you **shared session state** with unique keys per agent plus full trace visibility.

### Feature 3: ADK Session State for Cross-Agent Context Sharing

**What it is**: ADK's State system provides `session.state` with prefixed scoping (`app:`, `user:`, `temp:`).

**Your use**: Replace the manual `IntakeState` plumbing. Each interview agent writes to shared state (`state["profiler:skill_stage"] = 4`). The analysis agents read from the same state without needing explicit dossier-building. The **conversation history** stays in the session — meaning downstream agents can reference what the user actually said, not just extracted values.

### Feature 4: ADK Memory Service for Long-Term Knowledge

**What it is**: ADK's `MemoryService` ingests completed sessions into a searchable long-term store.

**Your use**: After each completed intake, store the full dossier + analysis in memory. Future intakes for the same user (or similar profiles) can **search past sessions** to provide benchmarks: "Professionals in your role typically achieve X within 3 months." This turns your one-shot analysis into a **learning system**.

### Feature 5: A2A Protocol for Modular Agent Deployment

**What it is**: A2A on Cloud Run lets each agent expose an Agent Card (JSON metadata at `/.well-known/agent.json`) and communicate via JSON-RPC/HTTP with streaming (SSE).

**Your use**: Deploy Deep Research, Strategist, Tactician, and Validator as **independent A2A agents on Cloud Run**. The supervisor becomes an A2A client that discovers and orchestrates them.

Benefits:
- **Independent scaling** — Deep Research (heavy) can scale separately from Validator (light)
- **Language flexibility** — could rewrite Deep Research in Python for better ML library access
- **Reusability** — the same Deep Research agent could serve other apps (e.g., booking app)
- **Discoverability** — Agent Cards describe capabilities for dynamic composition

### Feature 6: ADK Evaluation Framework for Quality Measurement

**What it is**: ADK's evaluation criteria include `final_response_match_v2` (LLM-as-judge), `hallucinations_v1` (grounding check), tool trajectory evaluation, and rubric-based scoring.

**Your use**: Define evaluation datasets with expected outputs for known personas. Run `hallucinations_v1` on Deep Research output to check grounding. Use tool trajectory evaluation to verify the interview engine follows the expected agent sequence. This gives you **quantitative quality metrics** instead of relying on manual review.

### Feature 7: Gemini Live API for Voice-Based Intake

**What it is**: ADK's Gemini Live API Toolkit enables bidirectional voice/video with tool calling, automatic reconnection, and typed events.

**Your use**: Offer a voice-based intake interview. The conversational nature of your interview (one question at a time, MCQ options, scale ratings) maps perfectly to voice. Users could complete the intake in a 3-minute voice conversation instead of typing.

---

## Concrete High-Impact Suggestions (Priority Order)

### Priority 1: Pass Full Conversation Transcript to Analysis Agents

**Effort**: Low | **Impact**: High | **Cost**: $0 (no additional LLM calls)

Right now, the dossier builder extracts field values but discards the conversation. Add a `conversationTranscript` field to `LearnerDossier` containing the raw Q&A pairs. Feed this to the Strategist and Personalizer — they'll generate dramatically richer, more empathetic output because they can reference the user's own words.

**Implementation Details**:

#### Step 1: Extend `LearnerDossier` type (`agent-service/src/types.ts`)
Add a new top-level field:
```typescript
conversationTranscript: z.array(z.object({
    turn: z.number(),
    agent: z.string(),
    question: z.string(),
    answer: z.string(),
    field: z.string()
})).optional()
```

#### Step 2: Wire transcript in `dossier-builder.ts`
The `buildLearnerDossier()` function already receives the full `IntakeState`, which now contains `state.transcript` (an array of `{ turn, user, agent, field }` tuples — confirmed in the live logs). Map this directly:
```typescript
conversationTranscript: state.transcript?.map(t => ({
    turn: t.turn,
    agent: t.field, // the agent that asked
    question: t.agent, // the question text
    answer: t.user,   // the user's raw answer
    field: t.field
})) || []
```

#### Step 3: Inject into Strategist and Personalizer prompts
In `strategist.ts` and `personalizer.ts`, append the transcript as additional context:
```
## User's Own Words (Interview Transcript)
${dossier.conversationTranscript.map(t => `Q: ${t.question}\nA: ${t.answer}`).join('\n\n')}
```

**Expected Outcome**: The Personalizer will quote the user's exact phrases (e.g., "you mentioned your biggest concern is *client data privacy*") rather than using generic phrasing. The Strategist can tailor IMPACT sections based on the emotional weight the user placed on specific answers.

---

### Priority 3: Fix Cross-Agent Context in Interview Phase

**Effort**: Low | **Impact**: Medium | **Cost**: $0 (bug fix)

The Strategist in `composer.ts:58-59` receives hardcoded placeholder data instead of actual profiler results. Wire the real `state.fields` data (skill_stage, learner_type, VARK) into the Strategist and Tactician prompts. **This is a bug, not a feature request.**

**Implementation Details**:

#### Step 1: Locate the bug (`agent-service/src/intake/composer.ts`)
Find the section where the Strategist system prompt is constructed. Currently:
```typescript
// BUG: Hardcoded values instead of actual profiler data
systemPrompt = getStrategistPrompt({
    profile: { psychologicalProfile: { motivationType: 'growth' }, learningGlobal: {} },
    professionalRoles: [state.fields.role_raw?.value || 'Professional'],
    primaryGoal: state.fields.goal_raw?.value,
});
```

#### Step 2: Wire real profiler data
Replace with:
```typescript
systemPrompt = getStrategistPrompt({
    profile: {
        skillStage: state.fields.skill_stage?.value,
        learnerType: state.fields.learner_type?.value,
        varkPrimary: state.fields.vark_primary?.value,
        motivationType: state.fields.motivation_type?.value,
        srlGoalSetting: state.fields.srl_goal_setting?.value,
    },
    professionalRoles: [state.fields.role_category?.value || state.fields.role_raw?.value || 'Professional'],
    primaryGoal: state.fields.goal_calibrated?.value || state.fields.goal_raw?.value,
});
```

#### Step 3: Apply same fix to Tactician prompt
Wire `state.fields.time_per_week_mins`, `state.fields.constraints`, and `state.fields.current_tools` into the Tactician's system prompt instead of the current minimal `{ focus: "Immediate Implementation" }`.

**Expected Outcome**: During the interview, later agents will ask smarter follow-up questions because they know what the earlier agents already learned. E.g., the Tactician will already know the user is a "pragmatist" and tailor time-management questions accordingly.

---

### Priority 4: Enrich Deep Research with Psychographic Context

**Effort**: Low | **Impact**: Medium | **Cost**: $0 (same LLM calls, richer prompt)

Pass the derived psychographic profile (decision style, cognitive load tolerance, VARK) to the Deep Research agent. A visual learner with low cognitive load tolerance should get research emphasizing GUI tools and dashboards, not CLI pipelines and API integrations.

**Implementation Details**:

#### Step 1: Extend `DeepResearchInputSchema` (`agent-service/src/agents/deep-research.ts`)
Add these fields to the input schema:
```typescript
cognitiveLoadTolerance: z.string().optional(),  // "Low" | "Medium" | "High"
varkPrimary: z.string().optional(),             // "visual" | "auditory" | "reading" | "kinesthetic"
decisionStyle: z.string().optional(),           // "Intuitive" | "Analytical" | "Hybrid"
motivationType: z.string().optional(),          // "outcome" | "growth" | "social" | "challenge"
```

#### Step 2: Pass from supervisor (`agent-service/src/agents/supervisor.ts`)
The supervisor already has `dossier.preferences.varkPrimary` and `profile.cognitiveLoadTolerance`. Simply add them to the `deepResearchFlow()` input call (lines 44-56).

#### Step 3: Update the Deep Research prompt
Add a filtering instruction to the system prompt:
```
## Learner Context (use to filter recommendations)
- VARK Primary: ${varkPrimary || 'unknown'} — prefer tools matching this modality
- Cognitive Load: ${cognitiveLoadTolerance || 'Medium'} — if Low, avoid CLI/API tools; prefer GUI
- Decision Style: ${decisionStyle || 'Hybrid'} — if Intuitive, prefer quick-start tools; if Analytical, include comparison matrices
- Motivation: ${motivationType || 'growth'} — align opportunity framing to this drive
```

**Expected Outcome**: A visual learner with low cognitive load tolerance will get recommendations like "Canva AI for presentation design" instead of "Python scripts for data visualization". The research output becomes psychographically personalized rather than role-generic.

### Priority 5: Migrate to ADK for Observability

**Effort**: Medium | **Impact**: Medium

ADK's native OpenTelemetry integration gives you structured traces for every model call and tool execution. Right now you have custom `logger.info` calls — migrating to ADK would give you end-to-end trace visualization in Cloud Trace, making debugging the multi-agent pipeline far easier.

### Priority 6: Add ADK Evaluation Suite

**Effort**: Medium | **Impact**: High (long-term)

Create 10-15 golden test personas with expected analysis outputs. Run ADK's hallucination detection on Deep Research and rubric-based evaluation on the full IMPACT output. This gives you a regression suite you can run before every deployment.

**Golden personas to create**:
- Beginner marketer, time-constrained, visual learner
- Senior engineer, high SRL, kinesthetic pragmatist
- Mid-career product manager, career switcher, low tech confidence
- Educator exploring AI for curriculum, theorist
- Sales professional, outcome-driven, high resilience

---

## Migration Path Summary

```
Current (Genkit + Manual Orchestration)
    │
    ├── Quick Wins (no framework change needed)
    │   ├── Fix cross-agent context bug (Priority 3)
    │   ├── Add conversation transcript passthrough (Priority 1)
    │   ├── Enrich Deep Research inputs (Priority 4)
    │   └── Add validator feedback loop (Priority 2)
    │
    ├── Medium-Term (ADK migration)
    │   ├── Replace manual state machine with ADK SequentialAgent + LoopAgent
    │   ├── Replace Promise.all with ADK ParallelAgent
    │   ├── Adopt ADK Session State for cross-agent context
    │   ├── Add OpenTelemetry observability
    │   └── Build evaluation suite with ADK criteria
    │
    └── Long-Term (A2A + Advanced)
        ├── Deploy agents as independent A2A services on Cloud Run
        ├── Add ADK MemoryService for cross-session learning
        ├── Implement Gemini Live voice-based intake
        └── Agent Cards for dynamic discovery and composition
```

---

## Appendix A: Stabilized MVP Execution Profile (Baseline)

Before beginning the ADK Upgrade, the following end-to-end trace sequence was established as the baseline for a functionally complete session (verified via logs and frontend report).

### 1. Interview Orchestration (Turns 1-9)
The `quizGuideFlow` successfully iterates 9 times, demonstrating strict field enforcement and conversational transitions between the 4 intake agents:
- **Strategist (Turns 1-2):** Extracts `current_tools` and `role_category`.
- **Profiler (Turns 3-6):** Extracts `skill_stage`, `learner_type`, `motivation_type`, `srl_goal_setting`. (Note: The `vark_primary` dimension requirement was successfully triggered and enforced behind the scenes).
- **Tactician (Turns 7-9):** Extracts `time_per_week_mins` and `constraints` (e.g., "client data privacy concerns").

At Turn 9, the Tactician registers `shouldExit: true` and the `quizGuideFlow` terminates gracefully.

### 2. Supervisor Flow Orchestration
The resulting `IntakeState` is passed to the `supervisorFlow` backend which executes the 6-phase analysis:
- **Phase 1: Profile (0ms)**: Synchronous deterministic rules map the parsed dimensions to a derived profile: `Intuitive / Checklist-Driven / Solitary / Medium Cognitive Load`.
- **Phase 2: Deep Research (19s)**: The research agent pulls the user's role ("Business strategy") and generates customized AI Opportunities (e.g., "Automated Market & Competitor Intelligence" and "Scenario Planning").
- **Phase 3: Strategist (24s)**: Generates the core IMPACT strategy tailored to a "pragmatist" learner type.
- **Phase 4: Tactician (19s)**: Creates actionable `Act/Check/Transform` phases.
- **Phase 5+6: Validator & Personalizer (15s, Parallel)**: 
  - The **Personalizer** crafts a rich, empathetic introductory summary based on the exact user details.
  - The **Validator** audits the strategy and correctly notes: _"The plan effectively addresses the 'client data privacy concerns' blocker with the 'Pilot with Public Data First' study rule."_

### 3. Frontend Rendering
The Next.js UI successfully unpacks the complex `IMPACTAnalysis` JSON into distinct, visually compelling components:
- **Radar Charts**: accurately reflect 60% AI Maturity and profile bounds.
- **Introductory Summary**: displayed elegantly at the top of the "Targeted AI Strategy".
- **Mastery Rules**: visually separated with contextual icons.
- **AI Assessor Notes**: The Deep Research "Profiling Assumptions" and the Validator's "Validation Audits" are displayed at the bottom of the profile section to provide transparency into the AI's reasoning.

**Conclusion**: The Genkit-based manual orchestration is currently highly stable and accurate. Any ADK upgrades must guarantee this exact level of data fidelity and pipeline execution logic, while introducing cross-agent context sharing and iterative looping.

---

## Sources

- [ADK Documentation - Multi-Agent Systems](https://google.github.io/adk-docs/agents/multi-agents/)
- [ADK Parallel Agents](https://google.github.io/adk-docs/agents/workflow-agents/parallel-agents/)
- [ADK Session, State, and Memory](https://google.github.io/adk-docs/sessions/)
- [ADK Memory Service](https://google.github.io/adk-docs/sessions/memory/)
- [ADK with A2A Protocol](https://google.github.io/adk-docs/a2a/)
- [Deploy A2A Agents to Cloud Run](https://docs.google.com/run/docs/deploy-a2a-agents)
- [ADK Evaluation Criteria](https://google.github.io/adk-docs/evaluate/criteria/)
- [ADK Gemini Live API Toolkit](https://google.github.io/adk-docs/streaming/)
- [Build Multi-Agentic Systems Using Google ADK](https://cloud.google.com/blog/products/ai-machine-learning/build-multi-agentic-systems-using-google-adk)
- [A2A Protocol Upgrade Blog](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade)
- [ADK Go 1.0 Blog](https://developers.googleblog.com/adk-go-10-arrives/)
- [ADK Java 1.0 Blog](https://developers.googleblog.com/announcing-adk-for-java-100-building-the-future-of-ai-agents-in-java/)
- [Developer's Guide to Multi-Agent Patterns in ADK](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/)
