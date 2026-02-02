# 🔄 End-to-End Test: Chat → Email → Intake

**Test Date**: February 2, 2026  
**Tester**: Manual validation required  
**Status**: ⏳ Pending execution

---

## Test Scenario

### User Journey
1. User visits teachmeai.in
2. Completes ChatUI quiz (provides name, email, role, goal)
3. Receives email with JWT token link
4. Clicks link to intake app
5. Sees "Welcome back [Name]"
6. Data pre-filled from token
7. Completes remaining intake questions
8. Submits form
9. Receives IMPACT analysis

---

## Prerequisites

- [ ] Home site deployed (teachmeai.in)
- [ ] Intake app deployed (intake.teachmeai.in)
- [ ] RESEND_API_KEY configured
- [ ] JWT_SECRET matches in both apps
- [ ] Agent service running on Cloud Run

---

## Test Steps

### Step 1: Complete ChatUI Quiz ✅

**URL**: https://teachmeai.in  
**Actions**:
1. Navigate to home page
2. Start ChatUI quiz
3. Provide responses:
   - Name: "Test User"
   - Email: "your-email@example.com"
   - Role: "Product Manager"
   - Goal: "Learn AI for product specs"

**Expected**:
- Chat completes successfully
- Completion message shown
- "Check your email" message displayed

**Validation**:
```bash
# Check home site logs
vercel logs teachmeai-home-site --follow
```

---

### Step 2: Verify Email Delivery ⏳

**Check**: Email inbox (including spam folder)

**Expected Email**:
- From: Khalid at TeachMeAI <khalid@teachmeai.in>
- Subject: Complete Your AI Learning Profile - Test User
- Contains: Personalized greeting with name
- Contains: Intake link with JWT token
- Link format: `https://intake.teachmeai.in?token=eyJhbGc...`

**Validation**:
```bash
# Check Resend dashboard
open https://resend.com/emails

# Decode token to verify payload
echo "TOKEN_HERE" | cut -d. -f2 | base64 -d | jq '.'
```

**Expected Token Payload**:
```json
{
  "name": "Test User",
  "email": "your-email@example.com",
  "role": "Product Manager",
  "goal": "Learn AI for product specs",
  "source": "chatui",
  "timestamp": 1770039600000,
  "iat": 1770039600,
  "exp": 1770644400
}
```

---

### Step 3: Click Intake Link ⏳

**Action**: Click link in email

**Expected**:
- Redirects to intake app
- Token in URL: `?token=eyJhbGc...`
- Page loads successfully
- No errors in console

**Validation**:
```bash
# Check intake app logs
vercel logs teachmeai-intake-app --follow
```

---

### Step 4: Verify Pre-fill & Welcome Message ⏳

**Expected UI**:
- "Welcome back, Test User! 👋" badge displayed
- Interview chat mode active
- First message references pre-filled data

**Validation**:
- Check browser DevTools console for errors
- Verify token verification API call succeeds
- Confirm state hydration occurred

---

### Step 5: Complete Remaining Questions ⏳

**Actions**:
- Answer 4-6 additional questions
- Provide: skill level, learning preferences, motivation, time commitment

**Expected**:
- Questions flow naturally
- No repetition of name/email/role/goal
- Progress indicator updates
- Agent handoffs occur (guide → strategist → learner_dimensions → tactician)

---

### Step 6: Submit Form ⏳

**Action**: Complete final question

**Expected**:
- "Generating your report..." message
- Supervisor analysis triggered
- Loading indicator shown
- No timeout errors

---

### Step 7: Verify IMPACT Analysis ⏳

**Expected**:
- Completion screen shown
- IMPACT roadmap displayed
- Learner profile summary
- Next steps provided
- CTA for 1:1 consultation

**Validation**:
```bash
# Check Google Sheets for new row
# Verify session ID matches
# Confirm all fields populated
```

---

## Success Criteria

- [ ] Email received within 30 seconds
- [ ] Token valid and decodable
- [ ] Intake app loads with token
- [ ] "Welcome back" message shown
- [ ] Name, email, role, goal pre-filled
- [ ] No duplicate questions asked
- [ ] Interview completes in 4-6 additional turns
- [ ] IMPACT analysis generated
- [ ] Data saved to Google Sheets
- [ ] All fields mapped correctly

---

## Known Issues

### Issue 1: Vercel WAF Blocking
**Symptom**: Handoff returns 403  
**Solution**: Use `/api/handoff-proxy` endpoint

### Issue 2: Token Expiry
**Symptom**: "Invalid token" after 7 days  
**Solution**: Expected behavior, user must restart

### Issue 3: Email Spam Folder
**Symptom**: Email not in inbox  
**Solution**: Check spam, whitelist sender

---

## Rollback Plan

If E2E test fails:

1. **Email not sent**: Check RESEND_API_KEY in Vercel
2. **Token invalid**: Verify JWT_SECRET matches
3. **Pre-fill fails**: Check token verification endpoint
4. **Analysis fails**: Check Cloud Run logs

---

## Test Results

**Execution Date**: _____________  
**Tester**: _____________  
**Result**: ⏳ Pending

### Checklist
- [ ] Step 1: ChatUI completion
- [ ] Step 2: Email delivery
- [ ] Step 3: Link click
- [ ] Step 4: Pre-fill verification
- [ ] Step 5: Question completion
- [ ] Step 6: Form submission
- [ ] Step 7: Analysis display

### Issues Found
_None yet - test pending_

---

## Next Steps After E2E Test

1. Document any issues found
2. Fix critical bugs
3. Proceed to mobile responsiveness testing
4. Performance audit
5. Load testing
