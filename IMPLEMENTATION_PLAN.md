# 🛠️ Implementation Plan: AI ChatUI Quiz & JWT Integration

This plan outlines the steps to implement the conversational quiz and its integration with the intake app.

## Phase 1: Foundation & Security (Current)
- [ ] **JWT Implementation**
  - [ ] Install `jose` (preferred for Edge/Next.js) or `jsonwebtoken`.
  - [ ] Add `JWT_SECRET` to `.env.local`.
  - [ ] Create utility functions for `signToken` and `verifyToken`.
- [ ] **Schema Updates**
  - [ ] Update `IntakeFormData` type to include optional fields from ChatUI.

## Phase 2: Intake App Integration
- [ ] **Token Handling Logic**
  - [ ] Add `useEffect` or Server Component logic to catch `token` from URL.
  - [ ] Create API route `/api/verify-token` (optional, can be done client-side if secret is not exposed, but server-side is safer).
  - [ ] Implement state hydration for the `IntakeForm`.
- [ ] **UI Transitions**
  - [ ] Display "Welcome back [Name]" if token is valid.
  - [ ] Auto-advance to the first non-filled section (e.g., VARK assessment).

## Phase 3: ChatUI Development (In `teachmeai.in` or as new route)
- [ ] **Chat Interface Component**
  - [ ] Build the message list and input field.
  - [ ] Implement "Typing..." animations.
- [ ] **Gemini Integration**
  - [ ] Create chat prompt to extract Name, Email, and Goal.
  - [ ] Implement tool calling (or structured output) to signal when data is complete.
- [ ] **Lead Backend**
  - [ ] Save lead to Google Sheets/Database.
  - [ ] Generate JWT.
  - [ ] Trigger welcome email (using Resend/SendGrid).

## Phase 4: Testing & Optimization
- [ ] End-to-end test: Chat -> Email -> Pre-filled Intake.
- [ ] Mobile responsiveness check for ChatUI.
- [ ] Performance audit for Gemini response times.

---

## 📅 Timeline
- **Phase 1-2**: 2-3 days
- **Phase 3**: 3-5 days
- **Phase 4**: 1-2 days
