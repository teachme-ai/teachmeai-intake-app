export interface IntakeResponse {
  // Learner Profile & Self-Regulation
  goalSettingConfidence: number; // 1-5
  newApproachesFrequency: number; // 1-5
  reflectionFrequency: number; // 1-5
  aiToolsConfidence: number; // 1-5
  resilienceLevel: number; // 1-5
  
  // Aspirations & Motivation
  clearCareerVision: number; // 1-5
  successDescription: number; // 1-5
  learningForChallenge: number; // 1-5
  outcomeDrivenLearning: number; // 1-5
  
  // Pain Points
  timeBarrier: number; // 1-5
  currentFrustrations: string; // open text
  
  // Learner Type & Preferences
  learnerType: 'theorist' | 'activist' | 'reflector' | 'pragmatist';
  varkPreferences: {
    visual: number; // 1-5
    audio: number; // 1-5
    readingWriting: number; // 1-5
    kinesthetic: number; // 1-5
  };
  skillStage: number; // 1-5 (Dreyfus model)
  
  // Gains & Outcomes
  concreteBenefits: string; // open text
  shortTermApplication: string; // open text
  
  // Metadata
  timestamp: string;
  sessionId: string;
}

export interface IMPACTAnalysis {
  Identify: string;
  Motivate: string;
  Plan: string;
  Act: string;
  Check: string;
  Transform: string;
  nextSteps: string[];
  learnerProfile: string;
  recommendations: string[];
}

export interface GoogleSheetsRow {
  timestamp: string;
  sessionId: string;
  rawResponses: string;
  impactAnalysis: string;
  learnerProfile: string;
  recommendations: string;
}
