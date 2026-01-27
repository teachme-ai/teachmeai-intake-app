# 🗨️ AI ChatUI Quiz Architecture

This document describes the architecture for the AI-powered conversational quiz that serves as the lead magnet and initial qualifier for TeachMeAI.

## 🌀 User Flow

1.  **Landing Page (`teachmeai.in`)**: The user is greeted by a conversational AI interface (ChatUI).
2.  **Conversational Discovery**:
    *   AI introduces itself as the TeachMeAI guide.
    *   Asks for the user's **Name**.
    *   Asks for their **Email** (to send the report/link).
    *   Asks for their primary **Learning Goal**.
3.  **Lead Capture**: The backend stores this initial lead and generates a **Secure JWT Token**.
4.  **Email Delivery**: The system sends an automated email to the user with a personalized link:
    `https://intake.teachmeai.in/?token=<JWT_TOKEN>`
5.  **Intake Transition**:
    *   User clicks the link and lands on the Intake App.
    *   The app decodes the JWT and pre-fills the form.
    *   The user completes the detailed assessment (VARK, psycho-educational profiling).
6.  **Full Analysis**: The 4-agent system generates the complete IMPACT report.

## 🏗️ Components

### 1. ChatUI Component (Frontend)
*   **Tech**: React, Framer Motion (for animations), Lucide (icons).
*   **Location**: Main landing page.
*   **Interaction**: Streaming text responses, typing indicators, auto-scroll.
*   **State Management**: Tracks current stage of conversation.

### 2. ChatUI Backend (Edge Function / API)
*   **Model**: Gemini 2.0 Flash (Experimental).
*   **Task**: Extract structured data (Name, Email, Goal) from natural conversation.
*   **Validation**: Ensures email is valid before proceeding.
*   **JWT Generation**:
    *   **Secret**: `JWT_SECRET` (configured in environment).
    *   **Payload**: `{ name, email, goal, source: 'chat_quiz' }`.
    *   **Expiry**: 24-48 hours.

### 3. Intake App Integration (Current Repo)
*   **Route**: `/` (or dedicated intake route).
*   **Logic**:
    *   Check for `token` query parameter.
    *   Validate and decode JWT on the server or client side.
    *   Hydrate the Form state with decoded values.
    *   Smooth transition to the detailed VARK/Profile sections.

## 🔒 Security
*   JWT prevents unauthorized pre-filling of email/data.
*   Tokens are short-lived.
*   Rate limiting on JWT generation to prevent email spam.

## 📊 Success Metrics
*   **Conversion Rate**: Goal > 70% from first message to email submitted.
*   **Handover Rate**: Goal > 50% from email click to intake completion.
*   **User Sentiment**: Qualitative feedback on the conversational experience.
