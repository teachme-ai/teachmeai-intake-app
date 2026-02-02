# Changelog

All notable changes to the TeachMeAI Intake App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2026-02-02

### ✨ Added

#### JWT Integration Enhancements
- **Environment-based JWT Secret**: Updated JWT utilities to use `JWT_SECRET` from environment variables instead of hardcoded values
- **Token Verification API**: New `/api/verify-token` endpoint for server-side JWT validation
- **Testing Documentation**: Comprehensive testing checklist with 26 test cases covering E2E, security, performance, and accessibility

#### Implementation Plan Updates
- **Phase 1-3 Completion**: Marked Foundation & Security, Intake App Integration, and ChatUI Development as complete
- **Phase 4 Expansion**: Added detailed testing tasks including error scenarios, load testing, and token expiration handling
- **Status Overview**: Added progress tracking showing 75% completion (3/4 phases)

### 🔧 Changed

- **JWT Secret Management**: Migrated from hardcoded secret to environment variable for better security
- **Implementation Plan Structure**: Added status overview section with visual progress indicators

### 📚 Documentation

- **TESTING_CHECKLIST.md**: New comprehensive testing guide with 10 categories and 26 test cases
- **IMPLEMENTATION_PLAN.md**: Updated with completion status and expanded Phase 4 tasks

### 🔐 Security

- Improved JWT secret management with environment variable support
- Added token verification endpoint for secure server-side validation

---

## [2.3.0] - 2026-02-02

### 🐛 Bug Fixes

- **Empty Fields in Persist**: Fixed strategist.ts to pass `roleRaw` and `goalRaw` to prompt context
- **Schema Mapping**: Updated index.ts to map `skill_stage`, `time_barrier`, `role_category` from IntakeResponse
- **Root Cause**: Resolved supervisorFlow creating minimal state, losing intake fields from interview

---

### 🎉 Initial Release - Production Ready

This is the first production release of the TeachMeAI Intake App, featuring a complete microservices architecture with AI-powered learner profiling and Google Sheets integration.

### ✨ Features

#### Frontend (Vercel)
- **Interactive Intake Form**: Multi-step form with smooth transitions and validation
- **VARK Learning Styles Assessment**: Visual, Auditory, Reading/Writing, Kinesthetic preferences
- **Goal Setting Confidence Evaluation**: Self-assessment questionnaire
- **Learner Type Identification**: Structured vs. exploratory learning preferences
- **Real-time Validation**: Client-side validation with helpful error messages
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

#### AI Agent Service (Google Cloud Run)
- **Supervisor Agent**: Orchestrates the multi-agent workflow
- **Profiler Agent**: Analyzes learner responses and creates detailed profiles
- **Strategist Agent**: Generates personalized learning strategies based on IMPACT framework
- **Tactician Agent**: Creates actionable learning recommendations
- **Scalable Architecture**: Serverless deployment with automatic scaling
- **Robust Error Handling**: Comprehensive logging and error recovery

#### Data Integration
- **Google Sheets Integration**: Automatic data logging with three authentication methods
  - Base64-encoded service account (recommended for production)
  - Individual environment variables
  - Service account file path (local development)
- **Enhanced Private Key Parsing**: Robust handling of SSL/TLS certificates
- **Detailed Error Logging**: Comprehensive debugging information
- **Data Validation**: Ensures data integrity before saving

### 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Vercel)      │
│   Next.js 14    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent Service  │
│  (Cloud Run)    │
│  Genkit Agents  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Google Sheets   │
│  Data Storage   │
└─────────────────┘
```

### 🔧 Technical Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, TypeScript, Google Genkit
- **AI**: Google Gemini 2.0 Flash
- **Deployment**: Vercel (Frontend), Google Cloud Run (Backend)
- **Data Storage**: Google Sheets API
- **Authentication**: Google Service Account

### 📦 Deployment

- **Frontend URL**: Deployed on Vercel
- **Backend URL**: `https://teachmeai-agent-service-584680412286.us-central1.run.app`
- **Region**: us-central1
- **Scaling**: Automatic based on traffic

### 🔐 Security

- **Environment Variables**: Secure credential management
- **Service Account Authentication**: Google Cloud IAM
- **HTTPS Only**: All endpoints secured with TLS
- **Input Validation**: Comprehensive validation on both client and server

### 📚 Documentation

- `README.md`: Project overview and setup instructions
- `DEPLOYMENT.md`: Deployment guide for both services
- `GOOGLE_SHEETS_FIX.md`: Comprehensive Google Sheets troubleshooting
- `HOW_TO_GET_SERVICE_ACCOUNT_KEY.md`: Step-by-step credential setup
- `QUICK_FIX.md`: Quick reference for common issues

### 🛠️ Developer Tools

- `encode-service-account.sh`: Helper script for base64 encoding credentials
- `env.example`: Template for environment variables
- TypeScript configuration for type safety
- ESLint for code quality

### 🐛 Bug Fixes

- Fixed Google Sheets decoder error (`error:1E08010C:DECODER routines::unsupported`)
- Enhanced private key parsing with multiple format support
- Improved error handling and logging throughout the application
- Fixed VARK preferences validation
- Resolved schema mismatch between frontend and backend

### 🔄 Migration Notes

This is the initial release. No migration required.

### 📊 Performance

- **Average Response Time**: ~15 seconds for complete AI analysis
- **Cold Start Time**: ~2-3 seconds for Cloud Run instances
- **Concurrent Users**: Supports automatic scaling based on demand

### 🎯 Known Limitations

- Google Sheets is used for data storage (consider database for high-volume production)
- AI analysis time depends on Gemini API response time
- Cold starts may occur on Cloud Run during low-traffic periods

### 🚀 Future Enhancements

See `ROADMAP.md` for planned features and improvements.

---

## Version History

- **1.0.0** (2026-01-24) - Initial production release

---

**Full Changelog**: https://github.com/your-org/teachmeai-intake-app/commits/v1.0.0
