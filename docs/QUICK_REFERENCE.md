# 🚀 Quick Reference: ChatUI to Intake Flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Journey Flow                            │
└─────────────────────────────────────────────────────────────────┘

1. User visits teachmeai.in (Home Site)
   └─> Interacts with ChatUI (chat-quiz.tsx)
       └─> Provides: Name, Email, Role, Goal
           └─> Chat completes

2. Backend generates JWT token
   └─> lib/email.ts creates token with 7-day expiry
       └─> Sends email via Resend with intake link

3. User clicks link in email
   └─> Redirects to intake.teachmeai.in?token=<JWT>
       └─> page.tsx verifies token server-side
           └─> Pre-fills IntakeForm with data

4. User completes remaining intake steps
   └─> Submits to /api/submit-intake
       └─> Calls agent service (Cloud Run)
           └─> Saves to Google Sheets
```

---

## Key Files & Responsibilities

### Home Site (teachmeai-home-site)

| File | Purpose |
|------|---------|
| `components/chat-quiz.tsx` | ChatUI component with Gemini integration |
| `app/api/chat-quiz/route.ts` | Handles chat messages, triggers email |
| `app/api/handoff-proxy/route.ts` | Proxies lead data to Cloud Run (bypasses WAF) |
| `lib/email.ts` | Generates JWT, sends email via Resend |
| `lib/email-templates.ts` | HTML email template |

### Intake App (teachmeai-intake-app)

| File | Purpose |
|------|---------|
| `src/lib/jwt.ts` | JWT sign/verify utilities |
| `src/app/api/verify-token/route.ts` | Server-side token verification endpoint |
| `src/app/page.tsx` | Main page, handles token from URL |
| `src/components/IntakeForm.tsx` | Multi-step intake form |
| `src/components/InterviewChat.tsx` | Alternative chat-based intake |

---

## Environment Variables

### Required in BOTH Apps

```bash
# CRITICAL: Must be identical in both .env.local files
JWT_SECRET=your_secret_here_32_chars_minimum
```

### Home Site Only

```bash
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_INTAKE_APP_URL=https://intake.teachmeai.in
NEXT_PUBLIC_QUIZ_WEBHOOK_URL=https://hooks.zapier.com/... (optional)
```

### Intake App Only

```bash
GEMINI_API_KEY=AIzaSy...
GOOGLE_SHEET_ID=1-EGTgJ...
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
AGENT_SERVICE_URL=https://teachmeai-agent-service-584680412286.us-central1.run.app
```

---

## JWT Token Structure

### Payload
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "IT Consultancy",
  "goal": "Learn AI tools",
  "challenge": "Time management",
  "source": "chatui",
  "timestamp": 1738502400000,
  "iat": 1738502400,
  "exp": 1739107200
}
```

### Expiry
- **Duration**: 7 days (168 hours)
- **Algorithm**: HS256
- **Secret**: Shared between home-site and intake-app

---

## API Endpoints

### Home Site

#### POST `/api/chat-quiz`
**Purpose**: Process chat messages, trigger email  
**Request**:
```json
{
  "conversationHistory": [...],
  "userMessage": "string",
  "collectedData": { "name": "...", "email": "..." }
}
```
**Response**:
```json
{
  "message": "AI response",
  "dataCollected": { "name": "...", "email": "..." },
  "isComplete": true,
  "confidence": 100
}
```

#### POST `/api/handoff-proxy`
**Purpose**: Proxy lead data to Cloud Run  
**Request**:
```json
{
  "persona_id": "default",
  "landing_page_id": "home",
  "answers_raw": [...],
  "contact_info": { "name": "...", "email": "..." }
}
```
**Response**:
```json
{
  "status": "success",
  "lead_id": "lead_123",
  "redirect_url": "/quiz-success"
}
```

### Intake App

#### POST `/api/verify-token`
**Purpose**: Verify JWT token server-side  
**Request**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
**Response**:
```json
{
  "valid": true,
  "payload": { "name": "...", "email": "..." }
}
```

#### POST `/api/submit-intake`
**Purpose**: Submit completed intake form  
**Request**: Full IntakeResponse object  
**Response**: Success/error status

---

## Common Issues & Solutions

### Issue 1: Token Verification Fails
**Symptoms**: "Invalid or expired token" error  
**Causes**:
- JWT_SECRET mismatch between apps
- Token expired (>7 days old)
- Token tampered with

**Solution**:
```bash
# Verify secrets match
grep JWT_SECRET teachmeai-home-site/.env.local
grep JWT_SECRET teachmeai-intake-app/.env.local

# Should output identical values
```

### Issue 2: Email Not Received
**Symptoms**: Chat completes but no email  
**Causes**:
- Invalid RESEND_API_KEY
- Email in spam folder
- Resend quota exceeded

**Solution**:
```bash
# Check Resend dashboard: https://resend.com/emails
# Verify API key is active
# Check spam folder
```

### Issue 3: Pre-fill Not Working
**Symptoms**: Intake form loads empty despite valid token  
**Causes**:
- Token not parsed from URL
- Server-side verification failing
- Data not passed to IntakeForm

**Solution**:
```typescript
// Check page.tsx
const token = typeof searchParams.token === 'string' ? searchParams.token : undefined;
const prefilledData = token ? await verifyToken(token) : null;

// Verify prefilledData is passed to IntakeForm
<IntakeForm initialData={prefilledData || undefined} />
```

### Issue 4: Handoff Blocked by Vercel WAF
**Symptoms**: 403 Forbidden or HTML checkpoint page  
**Causes**:
- Vercel security blocking direct Cloud Run calls

**Solution**:
- Use `/api/handoff-proxy` instead of direct fetch
- Proxy forwards headers to bypass WAF

---

## Testing Commands

### Run Both Apps Locally
```bash
# Terminal 1: Home Site
cd teachmeai-home-site
npm run dev  # Runs on :3000

# Terminal 2: Intake App
cd teachmeai-intake-app
npm run dev  # Runs on :3001
```

### Test JWT Generation
```bash
# In home-site directory
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { name: 'Test', email: 'test@example.com', role: 'IT', goal: 'Learn' },
  process.env.JWT_SECRET || 'fallback',
  { expiresIn: '7d' }
);
console.log('Token:', token);
console.log('Decode at: https://jwt.io');
"
```

### Test Token Verification
```bash
curl -X POST http://localhost:3001/api/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE"}'
```

---

## Deployment Checklist

### Before Deploying

- [ ] JWT_SECRET set in both Vercel projects
- [ ] RESEND_API_KEY configured in home-site
- [ ] GEMINI_API_KEY configured in intake-app
- [ ] Google Sheets credentials uploaded
- [ ] Agent service URL correct
- [ ] Test email delivery in production
- [ ] Verify token flow end-to-end

### After Deploying

- [ ] Test ChatUI on production URL
- [ ] Verify email received
- [ ] Click intake link, verify pre-fill
- [ ] Complete and submit intake
- [ ] Check Google Sheets for data

---

## Monitoring & Debugging

### Logs to Check

**Home Site (Vercel)**:
```bash
vercel logs teachmeai-home-site --follow
```

**Intake App (Vercel)**:
```bash
vercel logs teachmeai-intake-app --follow
```

**Agent Service (Cloud Run)**:
```bash
gcloud run logs read teachmeai-agent-service --region=us-central1 --limit=50
```

### Key Log Messages

| Message | Meaning |
|---------|---------|
| `✉️ [Email Lib] Attempting to send email` | Email sending started |
| `✅ [Email Lib] Email sent successfully` | Email delivered |
| `📡 [Handoff Proxy] Calling Cloud Run` | Lead handoff initiated |
| `🚀 [Backend] Received request for supervisorFlow` | Intake submission received |
| `💾 [Backend] Persisting analysis` | Saving to Google Sheets |

---

## Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| Chat response time | < 3s | ~2s |
| Email delivery | < 30s | ~10s |
| Token verification | < 100ms | ~50ms |
| Intake submission | < 15s | ~12s |
| Page load (with token) | < 2s | ~1.5s |

---

## Support & Resources

- **Implementation Plan**: `docs/IMPLEMENTATION_PLAN.md`
- **Testing Checklist**: `docs/TESTING_CHECKLIST.md`
- **Changelog**: `docs/CHANGELOG.md`
- **JWT Spec**: `teachmeai-home-site/docs/JWT_TOKEN_SPECIFICATION.md`
- **Email Debug**: `teachmeai-home-site/docs/EMAIL_DEBUG_GUIDE.md`

---

**Last Updated**: 2026-02-02  
**Version**: 2.4.0
