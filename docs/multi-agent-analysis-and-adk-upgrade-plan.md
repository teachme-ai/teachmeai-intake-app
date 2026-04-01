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

**Effort**: Low | **Impact**: High

Right now, the dossier builder extracts field values but discards the conversation. Add a `conversationTranscript` field to `LearnerDossier` containing the raw Q&A pairs. Feed this to the Strategist and Personalizer — they'll generate dramatically richer, more empathetic output because they can reference the user's own words.

**Implementation**:
- Accumulate `{ agent, question, answer }` tuples in `IntakeState`
- Add `conversationTranscript` to `LearnerDossier`
- Inject into Strategist and Personalizer prompts as additional context

### Priority 2: Implement Validator → Strategy Feedback Loop

**Effort**: Medium | **Impact**: High

Using ADK's LoopAgent pattern (or just a `while` loop in current Genkit code), let the validator's corrections feed back into a second strategist pass. Cap at 2 iterations. This catches the "suggests CLI tools for a non-technical user" class of errors automatically.

**Implementation**:
```typescript
let isValid = false;
let iterations = 0;
let corrections: any[] = [];

while (!isValid && iterations < 2) {
    const strategy = await strategistFlow({ ...input, corrections });
    const tactics = await tacticianFlow({ strategy, ...constraints });
    const validation = await validatorFlow({ ...tactics, ...constraints });

    isValid = validation.isValid;
    corrections = validation.corrections;
    iterations++;
}
```

### Priority 3: Fix Cross-Agent Context in Interview Phase

**Effort**: Low | **Impact**: Medium

The Strategist in `composer.ts:58-59` receives hardcoded placeholder data instead of actual profiler results. Wire the real `state.fields` data (skill_stage, learner_type, VARK) into the Strategist and Tactician prompts. **This is a bug, not a feature request.**

**Fix**:
```typescript
systemPrompt = getStrategistPrompt({
    profile: {
        skillStage: state.fields.skill_stage?.value,
        learnerType: state.fields.learner_type?.value,
        varkPrimary: state.fields.vark_primary?.value,
        timeBarrier: state.fields.time_barrier?.value,
    },
    professionalRoles: [state.fields.role_raw?.value || 'Professional'],
    primaryGoal: state.fields.goal_raw?.value,
});
```

### Priority 4: Enrich Deep Research with Psychographic Context

**Effort**: Low | **Impact**: Medium

Pass the derived psychographic profile (decision style, cognitive load tolerance, VARK) to the Deep Research agent. A visual learner with low cognitive load tolerance should get research emphasizing GUI tools and dashboards, not CLI pipelines and API integrations.

**Implementation**: Extend `DeepResearchInputSchema` to include `cognitiveLoadTolerance`, `varkPrimary`, and `decisionStyle`. Update the prompt to use these signals for filtering recommendations.

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
