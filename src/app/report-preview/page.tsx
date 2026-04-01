'use client';

import React from 'react';
import FullPageReport from '@/components/FullPageReport';

export default function PreviewPage() {
    // Mock Data for Preview
    const mockData = {
        name: { value: "John Doe" },
        role_raw: { value: "Senior Data Scientist" },
        industry: { value: "Financial Services" },
        learner_type: { value: "Strategic Architect" },
        skill_stage: { value: 3 },
        vark_primary: { value: "visual" },
        vark_ranked: { value: ["visual", "readingWriting", "audio", "kinesthetic"] },
        srl_goal_setting: { value: 5 },
        resilience: { value: 4 },
        tech_confidence: { value: 4 }
    };

    const mockAnalysis = {
        personalizedSummary: "You are positioned to disrupt the financial analysis workflow by bridging traditional data science with generative AI automation.",
        Identify: "Your current focus is on automating reporting pipelines and enhancing predictive accuracy through LLM-integrated Python scripts.",
        Motivate: "Higher efficiency and reduced manual overhead are your primary drivers.",
        Plan: "Phase 1: Tool selection. Phase 2: Local LLM setup. Phase 3: Integration.",
        Act: "Start by implementing a simple RAG (Retrieval Augmented Generation) pipeline for your internal docs.",
        Check: "Monitor token usage and hallucination rates in the initial 2 weeks.",
        Transform: "Transition from an analyst to an AI Strategy Lead within your organization.",
        studyRules: [
            { label: "VARK Rule", rule: "Use diagrams and interactive flowcharts to master complex GenAI architectures." },
            { label: "Action Rule", rule: "Commit code daily to a private GenAI playground." }
        ],
        research: {
            marketMaturityScore: 78,
            topPriorities: [
                { name: "LLM Orchestration", quickWin: "Implement LangChain for report summaries", impact: "High efficiency gain" },
                { name: "Vector Databases", quickWin: "Set up Pinecone for local docs", impact: "High relevance gain" }
            ],
            aiOpportunityMap: [
                { opportunity: "Automated Report Synthesis", impact: "Saves 10 hours/week", tools: ["GPT-4", "Next.js"] },
                { opportunity: "Predictive Client Insights", impact: "20% better lead conversion", tools: ["Python", "TensorFlow"] },
                { opportunity: "Legal Document Audit", impact: "90% faster compliance check", tools: ["Claude 3", "RAG"] }
            ]
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="p-4 bg-amber-100 border-b border-amber-200 text-amber-800 text-xs font-black uppercase tracking-widest text-center">
                🛠️ PREVIEW MODE: RADAR, MATRIX, AND ROADMAP VISUALS ACTIVE
            </div>
            <FullPageReport data={mockData} analysis={mockAnalysis} />
        </div>
    );
}
