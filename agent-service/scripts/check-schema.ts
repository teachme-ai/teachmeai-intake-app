
import { IntakeResponseSchema } from '../src/types';

const invalidPayload = {
    name: "Test User",
    email: "test@example.com",
    primaryGoal: "Learn AI",
    currentRoles: ["Developer"],
    goalSettingConfidence: 3,
    newApproachesFrequency: 3,
    reflectionFrequency: 3,
    aiToolsConfidence: 3,
    resilienceLevel: 3,
    clearCareerVision: 3,
    successDescription: 3,
    learningForChallenge: 3,
    outcomeDrivenLearning: 3,
    timeBarrier: 3,
    currentFrustrations: "Time",
    // BUG: Capitalized 'Theorist' should fail validation
    learnerType: "Theorist",
    varkPreferences: {
        visual: 2,
        audio: 2,
        readingWriting: 2,
        kinesthetic: 2
    },
    skillStage: 2,
    concreteBenefits: "Job",
    shortTermApplication: "Project"
};

try {
    console.log("Testing Capitalized 'Theorist'...");
    IntakeResponseSchema.parse(invalidPayload);
    console.log("✅ Passed (Unexpected!)");
} catch (e: any) {
    console.log("❌ Validation Failed (Expected):");
    console.log(JSON.stringify(e.errors, null, 2));
}

const invalidPayload2 = {
    ...invalidPayload,
    learnerType: "pragmatist" // Valid lowercase
};

try {
    console.log("\nTesting lowercase 'pragmatist'...");
    IntakeResponseSchema.parse(invalidPayload2);
    console.log("✅ Passed (Expected)");
} catch (e: any) {
    console.log("❌ Validation Failed:");
    console.log(JSON.stringify(e.errors, null, 2));
}
