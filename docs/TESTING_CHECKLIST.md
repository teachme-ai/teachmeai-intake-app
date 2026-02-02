# 🧪 Testing Checklist - ChatUI to Intake Flow

## Test Environment Setup

### Prerequisites
- [ ] Both apps running (home-site on :3000, intake-app on :3001)
- [ ] JWT_SECRET matches in both .env.local files
- [ ] RESEND_API_KEY configured in home-site
- [ ] Agent service URL configured correctly
- [ ] Google Sheets credentials valid

---

## 1. End-to-End Flow Tests

### Test Case 1.1: Happy Path - Complete Flow
**Steps:**
1. [ ] Open home-site ChatUI
2. [ ] Complete chat conversation (provide name, email, role, goal)
3. [ ] Verify completion message appears
4. [ ] Check email inbox for intake link
5. [ ] Click intake link from email
6. [ ] Verify "Welcome back [Name]" appears
7. [ ] Verify pre-filled data (name, email, goal)
8. [ ] Complete remaining intake steps
9. [ ] Submit intake form
10. [ ] Verify data saved to Google Sheets

**Expected Results:**
- ✅ Chat completes successfully
- ✅ Email received within 30 seconds
- ✅ Token in URL is valid
- ✅ Data pre-fills correctly
- ✅ Submission succeeds

### Test Case 1.2: Direct Intake Access (No Token)
**Steps:**
1. [ ] Navigate directly to intake app without token
2. [ ] Verify form loads with empty fields
3. [ ] Complete entire form manually
4. [ ] Submit successfully

**Expected Results:**
- ✅ Form works without token
- ✅ No errors displayed
- ✅ Submission succeeds

### Test Case 1.3: Invalid Token
**Steps:**
1. [ ] Navigate to intake app with invalid token: `?token=invalid123`
2. [ ] Verify error handling or fallback to empty form

**Expected Results:**
- ✅ No crash
- ✅ Form loads (empty or with error message)

### Test Case 1.4: Expired Token
**Steps:**
1. [ ] Generate token with 1-second expiry (modify JWT_SECRET temporarily)
2. [ ] Wait 2 seconds
3. [ ] Try to use token

**Expected Results:**
- ✅ Token verification fails gracefully
- ✅ User can still complete form

---

## 2. JWT Token Tests

### Test Case 2.1: Token Generation
**Steps:**
1. [ ] Complete ChatUI flow
2. [ ] Inspect email link
3. [ ] Decode JWT token (use jwt.io)
4. [ ] Verify payload contains: name, email, role, goal, source, timestamp

**Expected Results:**
- ✅ Token is valid JWT format
- ✅ All fields present
- ✅ Expiry set to 7 days

### Test Case 2.2: Token Verification API
**Steps:**
1. [ ] POST to `/api/verify-token` with valid token
2. [ ] POST with invalid token
3. [ ] POST with expired token
4. [ ] POST with missing token

**Expected Results:**
- ✅ Valid token returns 200 + payload
- ✅ Invalid token returns 401
- ✅ Expired token returns 401
- ✅ Missing token returns 400

---

## 3. Email Integration Tests

### Test Case 3.1: Email Delivery
**Steps:**
1. [ ] Complete ChatUI with valid email
2. [ ] Check inbox (including spam)
3. [ ] Verify email content
4. [ ] Click intake link

**Expected Results:**
- ✅ Email arrives within 30 seconds
- ✅ Subject line correct
- ✅ Personalized with name
- ✅ Link works

### Test Case 3.2: Email Failure Handling
**Steps:**
1. [ ] Temporarily set invalid RESEND_API_KEY
2. [ ] Complete ChatUI
3. [ ] Verify user still gets completion message

**Expected Results:**
- ✅ Chat completes despite email failure
- ✅ Error logged but not shown to user

---

## 4. Data Persistence Tests

### Test Case 4.1: Google Sheets Integration
**Steps:**
1. [ ] Complete full flow
2. [ ] Open Google Sheet
3. [ ] Verify new row added
4. [ ] Check all columns populated correctly

**Expected Results:**
- ✅ Row added with timestamp
- ✅ Session ID unique
- ✅ All fields mapped correctly
- ✅ JSON fields valid

### Test Case 4.2: Duplicate Prevention
**Steps:**
1. [ ] Submit same email twice
2. [ ] Check Google Sheets for duplicates

**Expected Results:**
- ✅ Upsert logic prevents duplicates (if implemented)
- ✅ Or both submissions logged with different session IDs

---

## 5. UI/UX Tests

### Test Case 5.1: Mobile Responsiveness
**Devices to Test:**
- [ ] iPhone SE (375px)
- [ ] iPhone 12 Pro (390px)
- [ ] iPad (768px)
- [ ] Desktop (1920px)

**Check:**
- [ ] ChatUI renders correctly
- [ ] Input field accessible
- [ ] Messages readable
- [ ] Buttons clickable
- [ ] Intake form steps work

### Test Case 5.2: Browser Compatibility
**Browsers:**
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)

### Test Case 5.3: Loading States
**Steps:**
1. [ ] Verify typing indicator shows during AI response
2. [ ] Verify button disabled during submission
3. [ ] Verify loading spinner on form submit

---

## 6. Performance Tests

### Test Case 6.1: Gemini Response Time
**Steps:**
1. [ ] Complete ChatUI 5 times
2. [ ] Measure time from message send to response

**Expected Results:**
- ✅ Average response < 3 seconds
- ✅ No timeouts

### Test Case 6.2: Page Load Time
**Steps:**
1. [ ] Clear cache
2. [ ] Load intake app with token
3. [ ] Measure time to interactive

**Expected Results:**
- ✅ First Contentful Paint < 2s
- ✅ Time to Interactive < 3s

### Test Case 6.3: Concurrent Users
**Steps:**
1. [ ] Simulate 10 concurrent ChatUI sessions
2. [ ] Monitor for errors or slowdowns

**Expected Results:**
- ✅ All sessions complete successfully
- ✅ No rate limiting errors

---

## 7. Security Tests

### Test Case 7.1: JWT Secret Mismatch
**Steps:**
1. [ ] Change JWT_SECRET in intake app only
2. [ ] Try to use token from home-site

**Expected Results:**
- ✅ Token verification fails
- ✅ User can still use form

### Test Case 7.2: Token Tampering
**Steps:**
1. [ ] Get valid token
2. [ ] Modify payload (change email)
3. [ ] Try to use modified token

**Expected Results:**
- ✅ Signature verification fails
- ✅ Token rejected

### Test Case 7.3: XSS Prevention
**Steps:**
1. [ ] Enter `<script>alert('xss')</script>` in chat
2. [ ] Verify it's escaped in UI and database

**Expected Results:**
- ✅ Script not executed
- ✅ Displayed as text

---

## 8. Error Handling Tests

### Test Case 8.1: Network Failures
**Steps:**
1. [ ] Disconnect internet during chat
2. [ ] Try to send message
3. [ ] Reconnect and retry

**Expected Results:**
- ✅ Error message shown
- ✅ Retry works

### Test Case 8.2: API Failures
**Steps:**
1. [ ] Stop agent service
2. [ ] Try to submit intake form

**Expected Results:**
- ✅ User-friendly error message
- ✅ Form data not lost

---

## 9. Accessibility Tests

### Test Case 9.1: Keyboard Navigation
**Steps:**
1. [ ] Navigate ChatUI using only Tab/Enter
2. [ ] Navigate intake form using only keyboard

**Expected Results:**
- ✅ All interactive elements accessible
- ✅ Focus indicators visible

### Test Case 9.2: Screen Reader
**Steps:**
1. [ ] Test with VoiceOver (Mac) or NVDA (Windows)
2. [ ] Verify all content announced correctly

---

## 10. Edge Cases

### Test Case 10.1: Very Long Input
**Steps:**
1. [ ] Enter 1000+ character message in chat
2. [ ] Verify handling

### Test Case 10.2: Special Characters
**Steps:**
1. [ ] Use emojis, unicode, special chars in name/email
2. [ ] Verify proper encoding

### Test Case 10.3: Multiple Tabs
**Steps:**
1. [ ] Open intake link in 2 tabs simultaneously
2. [ ] Complete form in both

**Expected Results:**
- ✅ Both submissions work (or proper conflict handling)

---

## Test Results Summary

| Phase | Total Tests | Passed | Failed | Blocked |
|-------|-------------|--------|--------|---------|
| E2E Flow | 4 | - | - | - |
| JWT | 2 | - | - | - |
| Email | 2 | - | - | - |
| Data | 2 | - | - | - |
| UI/UX | 3 | - | - | - |
| Performance | 3 | - | - | - |
| Security | 3 | - | - | - |
| Error Handling | 2 | - | - | - |
| Accessibility | 2 | - | - | - |
| Edge Cases | 3 | - | - | - |
| **TOTAL** | **26** | **-** | **-** | **-** |

---

## Sign-off

- [ ] All critical tests passed
- [ ] Known issues documented
- [ ] Ready for production deployment

**Tested by:** _________________  
**Date:** _________________  
**Environment:** _________________
