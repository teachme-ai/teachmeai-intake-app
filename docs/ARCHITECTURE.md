# TeachMeAI: Final Architecture & Implementation Plan

**Version**: 2.0 (Free AI Hook → Paid Human Consulting Model)  
**Last Updated**: January 24, 2026  
**Status**: Ready for Implementation

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Business Model](#business-model)
3. [System Architecture](#system-architecture)
4. [Technical Components](#technical-components)
5. [Phased Implementation Plan](#phased-implementation-plan)
6. [Cost & Revenue Projections](#cost--revenue-projections)

---

## Executive Summary

### **The Strategy**
Use AI to **demonstrate capability** (free 3-page analysis), then convert to **paid human consulting** (₹2,600-₹12,100 programs).

### **Core Insight**
"Show, don't tell" - Let users experience AI output quality for free, then position 1:1 consulting as "AI + 19 years of expertise."

### **Key Metrics Target**
- Email list growth: 100 leads/month
- Free → Paid conversion: 20%
- Average order value: ₹4,000
- Monthly revenue: ₹80,000+ (from 100 quiz takers)

---

## Business Model

### **Funnel Architecture**

```
┌─────────────────────────────────────────────┐
│  HOOK: Free AI Learner Analysis            │
│  - 3-page PDF report                        │
│  - Delivered in 2 minutes                   │
│  - Shows IMPACT framework, learning style   │
│  - Automated 100%                           │
└──────────────┬──────────────────────────────┘
               │ Email delivered with CTA
               ↓
┌─────────────────────────────────────────────┐
│  CORE OFFER: 70-Min Clarity Call            │
│  - Price: ₹2,600                            │
│  - Human expertise + AI insights            │
│  - Personalized action sheet                │
│  - 20% conversion from free reports         │
└──────────────┬──────────────────────────────┘
               │ Natural upsell during call
               ↓
┌─────────────────────────────────────────────┐
│  PREMIUM: Deep Dive Package                 │
│  - Price: ₹6,000                            │
│  - 10-page Deep Research Report             │
│  - Clarity Call + 1 Follow-up               │
│  - 25% of call attendees upgrade            │
└──────────────┬──────────────────────────────┘
               │ Long-term engagement
               ↓
┌─────────────────────────────────────────────┐
│  ONGOING: Starter / Growth Programs         │
│  - Prices: ₹8,600 / ₹12,100                 │
│  - Weekly check-ins + mentorship            │
│  - 40% of call attendees enroll             │
└─────────────────────────────────────────────┘
```

---

## System Architecture

### **High-Level Data Flow**

```
┌────────────────────────────────────────────────────────┐
│  teachmeai.in (Next.js - Vercel)                       │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │  Hero Section                                 │     │
│  │  Primary CTA: "Get Free AI Analysis"         │     │
│  │  Secondary CTA: "Skip to Clarity Call"       │     │
│  └────────────────┬─────────────────────────────┘     │
│                   │                                     │
│  ┌────────────────▼─────────────────────────────┐     │
│  │  AI ChatUI Quiz (2-3 min conversation)       │     │
│  │  - Natural language collection via Gemini    │     │
│  │  - Collects: Name, Email, Role, Goal         │     │
│  │  - Validates in real-time                    │     │
│  │  - Sends email with intake link (JWT token)  │     │
│  └────────────────┬─────────────────────────────┘     │
│                   │ Email with link to intake app      │
└───────────────────┼─────────────────────────────────────┘
                    │
                    ↓
┌───────────────────────────────────────────────────────┐
│  User Receives Email & Clicks Link                    │
│  - Link: intake.teachmeai.in?token=xxx                │
│  - Token contains pre-collected data                  │
└───────────────────┼─────────────────────────────────────┘
                    │
                    ↓
┌────────────────────────────────────────────────────────┐
│  teachmeai-intake-app (Vercel)                         │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │  Intake Form Page (?token=xxx)                │     │
│  │  - Decodes JWT token from ChatUI              │     │
│  │  - Pre-fills: Name, Email, Role, Goal         │     │
│  │  - Collects: VARK, Experience, Details        │     │
│  │  - Submits complete data to orchestration     │     │
│  └────────────────┬─────────────────────────────┘     │
│                   │                                     │
│  ┌────────────────▼─────────────────────────────┐     │
│  │  /api/submit-intake                           │     │
│  │  - Receives ChatUI data + Intake form data    │     │
│  │  - Triggers Orchestration Agent               │     │
│  │  - Routes to specialized agents               │     │
│  │  - Generates comprehensive report             │     │
│  │  - Sends email via Resend                     │     │
│  │  - Saves to Google Sheets                     │     │
│  └────────────────┬─────────────────────────────┘     │
│                   │                                     │
│  ┌────────────────▼─────────────────────────────┐     │
│  │  Free Report Agent (Gemini 2.5 Flash)        │     │
│  │  - Analyzes learner profile                  │     │
│  │  - Generates IMPACT summary                  │     │
│  │  - Creates 3 quick-win recommendations       │     │
│  │  Cost: ₹0.015 per report                     │     │
│  └────────────────┬─────────────────────────────┘     │
│                   │                                     │
│  ┌────────────────▼─────────────────────────────┐     │
│  │  PDF Generator (pdfkit)                      │     │
│  │  - Branded 3-page template                   │     │
│  │  - Includes CTA to book call                 │     │
│  │  - Saves to Cloud Storage                    │     │
│  └────────────────┬─────────────────────────────┘     │
│                   │                                     │
└───────────────────┼─────────────────────────────────────┘
                    │
                    ↓
┌────────────────────────────────────────────────────────┐
│  Email Delivery (Resend)                               │
│  - Subject: "Your AI Analysis is Ready"                │
│  - Body: Report value + limitations + CTA              │
│  - Attachment: 3-page PDF                              │
│  - CTA: "Book Clarity Call - ₹2,600"                   │
└─────────────────────────────────────────────────────────┘
```

---

### **Premium Path (Optional Deep Dive)**

For users who purchase ₹6,000 Deep Dive Package:

```
Topmate Payment Success Webhook
    ↓
/api/topmate-webhook
    ↓
Deep Research Agent (Gemini 2.5 Flash Thinking)
    ├─ Industry-specific AI research
    ├─ Peer-reviewed pedagogical papers
    ├─ Custom learning roadmap generation
    └─ Visual skill trees (code execution)
    ↓
10-Page PDF Generator
    ↓
Email with download link + Calendly for call booking
```

---

## Technical Components

### **Component 1: Free Report Agent**

**Location**: `/agent-service/src/agents/free-report.ts`

**Purpose**: Generate lightweight 3-page analysis in <5 minutes

**Frameworks Used**:
- **SRL (Self-Regulated Learning)**: Assess goal-setting patterns
- **VARK**: Visual/Auditory/Reading/Kinesthetic preferences
- **Kolb Learning Styles**: Theorist/Activist/Reflector/Pragmatist
- **IMPACT Framework**: Structure the output

**Technology**:
- Model: Gemini 2.5 Flash (cost: ₹0.015/report)
- Response time: 2-5 seconds
- Output format: JSON → templatized PDF

**Schema**:
```typescript
FreeReportSchema = {
  learnerProfile: {
    learningStyle: 'pragmatist',
    motivationType: 'intrinsic',
    srlLevel: 'high',
    varkScores: { visual: 80, auditory: 40, ... }
  },
  impactSummary: {
    identify: 'Top 3 focus areas',
    motivate: 'Personal drivers',
    plan: '30-day roadmap'
  },
  quickWins: ['Action 1', 'Action 2', 'Action 3'],
  nextSteps: 'CTA to book call'
}
```

---

### **Component 2: Deep Research Agent**

**Location**: `/agent-service/src/agents/deep-research.ts`

**Purpose**: Generate comprehensive 10-page dossier (premium tier only)

**Features**:
- **Google Search Grounding**: Real-time industry data
- **Deep Research Mode**: Autonomous web browsing for citations
- **Code Execution**: Generate visual roadmaps, skill trees
- **Thinking Mode**: Show reasoning process

**Technology**:
- Model: Gemini 2.5 Flash Thinking
- Response time: 15-30 minutes (async)
- Cost: ₹0.30-0.50/report

**Output Includes**:
1. Comprehensive learner psychometric profile
2. Industry-specific AI use cases (BFSI, Manufacturing, etc.)
3. Research-backed learning strategies (with citations)
4. Visual learning pathway (generated images)
5. Week-by-week implementation plan
6. Tool stack recommendations
7. ROI projection for AI adoption
8. Common pitfalls + mitigation strategies

---

### **Component 3: PDF Generation Pipeline**

**Libraries**:
- `pdfkit` (Node.js PDF generation)
- Cloud Storage for hosting

**Templates**:
1. **Free Report Template** (3 pages, 500KB)
   - Branded header with logo
   - Page 1: Learner profile card
   - Page 2: IMPACT summary
   - Page 3: Quick wins + CTA
   
2. **Premium Report Template** (10 pages, 2-3MB)
   - Full branding package
   - Charts and visualizations
   - Clickable table of contents
   - References section

**Delivery**:
- Upload to Cloud Storage (`gs://teachmeai-reports/`)
- Generate signed URL (7-day expiry for free, permanent for paid)
- Email link to user

---

### **Component 4: Email System**

**Provider**: Resend (free tier: 3,000 emails/month)

**Email Sequences**:

**Sequence 1: Free Report Delivery** (immediate)
- Subject: "Your AI Analysis is Ready"
- Content: Report attachment + "What AI can't do" section
- CTA: Book Clarity Call

**Sequence 2: Nurture** (3 days later, if no booking)
- Subject: "How [Name from similar industry] used their AI report"
- Content: Case study + testimonial
- CTA: Book call at 20% discount (limited time)

**Sequence 3: Last Touch** (7 days later)
- Subject: "Your AI report in action (+ what you might be missing)"
- Content: Show them advanced insights from Deep Dive package
- CTA: Upgrade to Deep Dive or book simple call

---

## Phased Implementation Plan

### **Phase 0: Immediate Updates (This Weekend - 2 hours)**

**Goal**: Update website messaging to test new funnel concept

**Tasks**:
- [ ] Update hero CTA on teachmeai.in
  - Change "Book Clarity Call" → "Get Free AI Analysis"
  - File: `components/hero.tsx`
  - Effort: 15 mins

- [ ] Build ChatUI quiz component (MVP)
  - Replace static form with conversational AI interface
  - File: `components/chat-quiz.tsx`
  - See: `CHATUI_QUIZ_ARCHITECTURE.md` for details
  - Effort: 2-3 hours (basic version)

- [ ] Update programs section copy
  - Add "Free AI Analysis" as first card
  - Reorder: Free → Call → Deep Dive → Starter → Growth
  - File: `components/programs.tsx`
  - Effort: 30 mins

- [ ] Create simple thank-you page
  - Text: "Generating your report... Check email in 2 minutes"
  - CTA: "Want human expertise too? Book call"
  - Effort: 20 mins

**Deliverable**: Updated website with new messaging (no backend changes yet)

**Test**: Drive 5-10 friends to quiz, collect feedback on messaging clarity

---

### **Phase 1: Free Report MVP (Week 1 - 8 hours)**

**Goal**: Build minimal viable free report generator

**Tasks**:

**Day 1-2: Agent Setup**
- [ ] Create `free-report.ts` agent
  - Simple Gemini 2.5 Flash prompt
  - Takes quiz responses → outputs structured JSON
  - Test with sample data
  - Effort: 3 hours

**Day 3-4: PDF Generation**
- [ ] Set up pdfkit in agent-service
  - Install: `npm install pdfkit`
  - Create 3-page template with your branding
  - Test PDF generation locally
  - Effort: 2 hours

**Day 5: Email Integration**
- [ ] Set up Resend account
  - Sign up at resend.com
  - Add domain (teachmeai.in)
  - Verify DNS records
  - Effort: 1 hour

- [ ] Create email template
  - Write "Your AI Analysis + What It Can't Do" copy
  - Add CTA buttons
  - Test send to yourself
  - Effort: 1 hour

**Day 6-7: Integration & Testing**
- [ ] Wire quiz → agent → PDF → email
  - Update `/api/submit-intake` route
  - Test end-to-end flow
  - Fix bugs
  - Effort: 1 hour

**Deliverable**: Working free report pipeline (100% automated)

**Success Criteria**:
- Quiz submit → Email received within 5 minutes
- PDF opens correctly, looks professional
- CTA buttons link to Topmate correctly

---

### **Phase 2: Analytics & Optimization (Week 2 - 4 hours)**

**Goal**: Track conversion funnel, iterate based on data

**Tasks**:

- [ ] Add analytics events
  - `quiz_started`
  - `quiz_completed`
  - `report_generated`
  - `email_opened` (via Resend)
  - `cta_clicked` (book call)
  - Effort: 1 hour

- [ ] Set up Google Sheets tracking
  - Log: email, report URL, timestamp, conversion status
  - Create dashboard view
  - Effort: 1 hour

- [ ] A/B test email subject lines
  - Version A: "Your AI Analysis is Ready"
  - Version B: "See What AI Learned About You (+ What It Missed)"
  - Track open rates
  - Effort: 30 mins

- [ ] Iterate on report content
  - Based on first 20 users' feedback
  - Adjust template, add/remove sections
  - Effort: 1.5 hours

**Deliverable**: Data-driven funnel with clear conversion metrics

**Success Criteria**:
- Can answer: "What % of quiz takers book a call within 7 days?"
- Identify drop-off points

---

### **Phase 3: Premium Deep Dive (Week 3-4 - 12 hours)**

**Goal**: Build premium 10-page Deep Research offering

**Tasks**:

**Week 3: Deep Research Agent**
- [ ] Build Deep Research flow
  - Integrate Gemini Thinking Mode
  - Add Google Search grounding
  - Enable code execution for visuals
  - Test with 3 different industries
  - Effort: 6 hours

- [ ] Create 10-page PDF template
  - Design in Figma first (optional)
  - Implement in pdfkit
  - Include charts, tables, visual roadmaps
  - Effort: 4 hours

**Week 4: Topmate Integration**
- [ ] Create "Deep Dive Package" on Topmate
  - Price: ₹6,000
  - Description: 10-page report + call + follow-up
  - Effort: 15 mins

- [ ] Build webhook handler
  - `/api/topmate-webhook`
  - Verify signature
  - Trigger Deep Research agent
  - Send premium email
  - Effort: 2 hours

**Deliverable**: Premium offering live and purchasable

**Success Criteria**:
- First paying customer receives 10-page report within 24 hours
- Report quality justifies ₹6,000 price

---

### **Phase 4: Conversational Intake (Week 5-6 - 16 hours)**

**Goal**: Replace static form with adaptive chat interface (optional, advanced)

**Tasks**:

- [ ] Build gap detection agent
  - Determines what info is missing
  - Generates contextual follow-up questions
  - Effort: 4 hours

- [ ] Create chat UI component
  - Message bubbles (user vs. agent)
  - Typing indicators
  - Real-time streaming
  - Effort: 6 hours

- [ ] Implement conversation orchestration
  - Manages turn-taking
  - Detects completion (85% confidence)
  - Effort: 4 hours

- [ ] A/B test: Chat vs. Static Form
  - 50/50 traffic split
  - Compare completion rates
  - Effort: 2 hours

**Deliverable**: Conversational intake as optional alternative

**Success Criteria**:
- Chat version has ≥75% completion rate (vs. 60% for static)
- Users complete in <5 mins (vs. 8 mins static form)

---

### **Phase 5: Scale & Automate (Month 2)**

**Goal**: Handle 500+ quiz completions/month with zero manual work

**Tasks**:

- [ ] Set up automated email sequences
  - Day 0: Report delivery
  - Day 3: Case study nurture
  - Day 7: Last-chance offer
  - Effort: 3 hours

- [ ] Build admin dashboard
  - View all quiz submissions
  - See conversion rates
  - Filter by industry/role
  - Effort: 6 hours

- [ ] Implement rate limiting
  - Max 5 free reports per email
  - Prevent abuse/spam
  - Effort: 1 hour

- [ ] Optimize costs
  - Cache common report patterns
  - Use Gemini 2.5 Flash Lite for some sections
  - Effort: 2 hours

**Deliverable**: Fully automated, scalable system

**Success Criteria**:
- Can handle 100 reports/day with no manual intervention
- Cost per free report: <₹0.02

---

## Cost & Revenue Projections

### **Operating Costs (Monthly)**

| Component | Volume | Cost per Unit | Monthly Cost |
|-----------|--------|---------------|--------------|
| **Free Reports** | 100 | ₹0.015 | ₹1.50 |
| **Premium Reports** | 5 | ₹0.50 | ₹2.50 |
| **Email (Resend)** | 100 | ₹0 (free tier) | ₹0 |
| **Cloud Storage** | 100 PDFs | ₹0.02/GB | ₹0.50 |
| **Cloud Run Hosting** | - | Pay per use | ₹200 |
| **Vercel (Home Site)** | - | Free tier | ₹0 |
| **TOTAL** | - | - | **₹204.50** |

**At 100 quiz completions/month**: ₹204 (~$2.50)

---

### **Revenue Projections (Monthly)**

**Scenario: 100 Quiz Completions**

| Conversion Path | Count | Price | Revenue |
|-----------------|-------|-------|---------|
| Free Report Only | 80 | ₹0 | ₹0 |
| Clarity Call | 15 | ₹2,600 | ₹39,000 |
| Deep Dive Package | 5 | ₹6,000 | ₹30,000 |
| **TOTAL REVENUE** | - | - | **₹69,000** |

**Profit**: ₹69,000 - ₹204 = **₹68,796/month**

**Margin**: 99.7%

---

### **Growth Projections**

| Month | Quiz Volume | Revenue | Costs | Profit |
|-------|-------------|---------|-------|--------|
| **Month 1** | 50 | ₹26,000 | ₹150 | ₹25,850 |
| **Month 2** | 100 | ₹69,000 | ₹200 | ₹68,800 |
| **Month 3** | 200 | ₹138,000 | ₹400 | ₹137,600 |
| **Month 6** | 500 | ₹345,000 | ₹1,000 | ₹344,000 |

**Assumptions**:
- 15% free → call conversion
- 5% free → deep dive conversion
- 40% of call attendees → ongoing programs

---

## Success Metrics & KPIs

### **Week 1-2 (MVP Testing)**
- [ ] 10+ free reports generated
- [ ] Email open rate >40%
- [ ] CTA click rate >10%
- [ ] At least 1 call booking

### **Month 1 (Validation)**
- [ ] 50 quiz completions
- [ ] 5-8 call bookings (10-15% conversion)
- [ ] 1-2 premium packages sold
- [ ] Revenue: ₹20K-30K

### **Month 2 (Scale)**
- [ ] 100 quiz completions
- [ ] 15-20 call bookings
- [ ] 5+ premium packages
- [ ] Revenue: ₹60K-80K

### **Month 3 (Profitability)**
- [ ] 200 quiz completions
- [ ] Break-even on all costs
- [ ] Consistent 15%+ conversion rate
- [ ] Revenue: ₹100K+

---

## Risk Mitigation

### **Risk 1: Free reports don't convert to paid**
**Mitigation**:
- A/B test different CTAs in email
- Add scarcity ("Only 3 slots left this week")
- Offer limited-time discount (10% off if booked within 48 hours)

### **Risk 2: AI report quality disappoints users**
**Mitigation**:
- Alpha test with 10 trusted users first
- Over-deliver on free version (3 pages → 4-5 if needed)
- Include disclaimer: "This is a starting point, not personalized advice"

### **Risk 3: Email deliverability issues**
**Mitigation**:
- Warm up domain with Resend (send to 10 users day 1, 20 day 2, etc.)
- Use authentication (SPF, DKIM, DMARC)
- Monitor bounce rates closely

### **Risk 4: Cost spiral if volume explodes**
**Mitigation**:
- Implement rate limiting (max 5 reports per email)
- Use cheaper models (Flash Lite) for parts of free reports
- Cache common responses

---

## Next Immediate Actions

**Today** (< 1 hour):
1. Update hero CTA on teachmeai.in
2. Sign up for Resend account
3. Create simple brand guidelines doc (logo, colors for PDFs)

**This Weekend** (2-3 hours):
4. Complete Phase 0 website updates
5. Map out free report template structure on paper
6. Write email copy (draft)

**Next Week** (Phase 1):
7. Build free report agent
8. Create PDF pipeline
9. Test with 5-10 alpha users

**Target Launch Date**: February 7, 2026 (2 weeks from now)

---

## Appendix: Technical Setup Guide

### **A. Resend Email Setup**

```bash
# 1. Sign up at resend.com
# 2. Add your domain
# 3. Set DNS records:

# Type: TXT
# Name: _resend._domainkey
# Value: [provided by Resend]

# 4. Verify domain
# 5. Get API key from dashboard
# 6. Add to .env.local:
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### **B. PDF Generation Setup**

```bash
cd agent-service
npm install pdfkit
```

Create `/agent-service/src/lib/pdf-generator.ts`

### **C. Cloud Storage Setup**

```bash
# Already configured in agent-service
# Just create new bucket:
gsutil mb gs://teachmeai-reports
gsutil iam ch allUsers:objectViewer gs://teachmeai-reports
```

---

**END OF ARCHITECTURE DOCUMENT**

For questions or implementation support, refer to:
- Phase-specific tasks above
- Existing codebase: `/agent-service/src/agents/`
- Deployment guide: `DEPLOYMENT.md`
