
import { supervisorFlow } from '../src/agents/supervisor';
import { IntakeResponse } from '../src/types';

const hrPayload: IntakeResponse = {
    name: "HR Manager",
    email: "hr_hero@example.com",
    primaryGoal: "To use AI for screening and onboarding",
    currentRoles: ["Operations"],
    goalSettingConfidence: 3,
    newApproachesFrequency: 3,
    reflectionFrequency: 3,
    aiToolsConfidence: 3,
    resilienceLevel: 3,
    clearCareerVision: 3,
    successDescription: 3,
    learningForChallenge: 3, // mapped from motivation
    outcomeDrivenLearning: 3,
    timeBarrier: 3,
    currentFrustrations: "",
    learnerType: "pragmatist",
    varkPreferences: {
        visual: 2,
        audio: 2,
        readingWriting: 2,
        kinesthetic: 2
    },
    skillStage: 1,
    concreteBenefits: "",
    shortTermApplication: ""
};

async function testLocally() {
    console.log("🚀 Starting local reproduction of IMPACT analysis...");
    try {
        const analysis = await supervisorFlow(hrPayload);
        console.log("✅ Analysis successful!");
        console.log(JSON.stringify(analysis, null, 2));
    } catch (e: any) {
        console.error("❌ Analysis failed locally:");
        console.error(e.message);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    }
}

testLocally();
