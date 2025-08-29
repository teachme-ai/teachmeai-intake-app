# TeachMeAI Intake App

An interactive web application that collects learner intake data through guided questions, logs responses into Google Sheets, and uses AI to generate personalized IMPACT-framed learning pathways.

## 🎯 Features

- **Multi-step Intake Form**: 6 comprehensive steps covering all aspects of learner assessment
- **AI Personalization**: Google Gemini Pro integration for personalized IMPACT analysis
- **Google Sheets Integration**: Automatic data logging and storage
- **Responsive Design**: Mobile-friendly interface with modern UI
- **TypeScript**: Full type safety and better development experience

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini Pro API
- **Database**: Google Sheets API
- **Deployment**: Vercel (recommended)

## 🔄 Automated Builds

This project includes **GitHub Actions** for automated CI/CD:
- ✅ **Automatic builds** on every push to main/develop
- ✅ **Automated testing** and type checking
- ✅ **Build artifacts** saved for deployment
- ✅ **Multi-Node.js version** testing (18.x, 20.x)

## 📋 Prerequisites

- Node.js 18+ 
- Google Cloud Project with Sheets API enabled
- Google Gemini Pro API access
- GitHub account (for deployment)

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/teachme-ai/teachmeai-intake-app.git
cd teachmeai-intake-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the environment template and fill in your API keys:

```bash
cp env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Google Sheets API Configuration
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
GOOGLE_SHEETS_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_SHEETS_SPREADSHEET_ID="your-spreadsheet-id-here"

# Google Gemini AI API
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 4. Google Cloud Setup

#### Enable Google Sheets API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create a Service Account
5. Download the JSON credentials
6. Share your Google Sheet with the service account email

#### Create Google Sheet
1. Create a new Google Sheet
2. Copy the Sheet ID from the URL
3. Add the ID to your `.env.local` file

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📱 Intake Questions

The app collects comprehensive learner data across 6 steps:

### Step 1: Learner Profile & Self-Regulation
- Goal setting confidence
- Approach to learning challenges
- Reflection frequency
- AI tools confidence
- Resilience level

### Step 2: Aspirations & Motivation
- Career vision clarity
- Success definition
- Learning motivation
- Outcome-driven learning

### Step 3: Pain Points & Challenges
- Time barriers
- Current frustrations

### Step 4: Learner Type & Preferences
- Kolb learning style
- VARK preferences
- Dreyfus skill stage

### Step 5: Gains & Outcomes
- Concrete benefits
- Short-term application

### Step 6: Review & Submit
- Response summary
- Final submission

## 🤖 AI Integration

The app uses Google Gemini Pro to analyze intake responses and generate:

- **IMPACT Framework Analysis**: Identify, Motivate, Plan, Act, Check, Transform
- **Learner Profile Summary**: Personalized characteristics analysis
- **Specific Recommendations**: Actionable next steps
- **Next Steps**: Immediate actions to take

## 📊 Data Storage

All responses and AI analysis are automatically saved to Google Sheets with columns:

- Timestamp
- Session ID
- Raw Responses (JSON)
- AI Analysis (JSON)
- Learner Profile
- Recommendations

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Manual Deployment

```bash
npm run build
npm start
```

## 🔧 Customization

### Adding New Questions
Edit `src/components/IntakeForm.tsx` to add new form fields and update the types in `src/types/index.ts`.

### Modifying AI Analysis
Edit `src/lib/ai-analysis.ts` to change the AI prompt or analysis structure.

### Styling Changes
Modify `src/app/globals.css` and `tailwind.config.js` for custom styling.

## 📁 Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/          # React components
│   └── IntakeForm.tsx  # Main form component
├── lib/                 # Utility libraries
│   ├── ai-analysis.ts  # AI integration
│   └── google-sheets.ts # Google Sheets integration
└── types/               # TypeScript type definitions
    └── index.ts        # Main types
```

## 🐛 Troubleshooting

### Common Issues

1. **Google Sheets API Error**: Check service account permissions and API enablement
2. **AI Analysis Fails**: Verify Gemini API key and quota limits
3. **Build Errors**: Ensure all dependencies are installed and TypeScript types are correct

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment.

## 📈 Future Enhancements

- [ ] Supabase integration for richer dashboards
- [ ] Metabase BI for learner progress analytics
- [ ] Canvas-style intake with draggable opportunity cards
- [ ] Automated PDF report generation
- [ ] Email notifications and follow-ups

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
3. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team

## 🎉 Acknowledgments

Built with Next.js, Tailwind CSS, and Google's AI services. Special thanks to the TeachMeAI community for insights and feedback.
