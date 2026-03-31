/**
 * Agent Test: Validator Flow
 * Tests constraint cross-referencing with deliberate mismatches.
 *
 * Run: npx tsx scripts/test-validator-agent.ts
 * Requires: GEMINI_API_KEY set in environment
 */
import { validatorFlow } from '../src/agents/validator';

async function testValidator() {
    console.log("\n==========================================");
    console.log("  🧪 VALIDATOR AGENT TESTS");
    console.log("==========================================\n");

    // Case 1: VALID plan — low-tech user gets low-tech recommendations
    console.log("--- Case 1: Valid Plan (Low-Tech User, Low-Tech Plan) ---");
    try {
        const validResult = await validatorFlow({
            act: "Start with ChatGPT for email drafting. Use Canva to create simple visuals.",
            check: "Count how many hours saved this week on email drafting.",
            transform: "In 6 months, 80% of routine emails auto-drafted.",
            recommendations: ["ChatGPT", "Canva", "Grammarly"],
            studyRules: [{ rule: "Spend 10 mins daily trying one AI prompt", label: "Daily Dose" }],
            digitalSkills: 2,
            techSavviness: 1,
            timePerWeekMins: 60,
            skillStage: 1,
            learnerType: "pragmatist",
            currentTools: ["Email", "Word"],
            blockers: ["time"],
        });

        console.log(`  isValid: ${validResult.isValid}`);
        console.log(`  Notes: ${JSON.stringify(validResult.validationNotes)}`);
        console.log(`  Corrections: ${validResult.corrections.length}`);
        console.log(validResult.isValid ? "  ✅ PASS (plan should be valid)" : "  ⚠️ Validator flagged issues — review corrections");
    } catch (e: any) {
        console.error(`  ❌ FAIL: ${e.message}`);
    }

    // Case 2: INVALID plan — low-tech user but plan suggests APIs
    console.log("\n--- Case 2: Invalid Plan (Low-Tech User, API-Heavy Plan) ---");
    try {
        const invalidResult = await validatorFlow({
            act: "Set up a custom Python script to call OpenAI API. Deploy on AWS Lambda.",
            check: "Monitor API usage and response quality via CloudWatch dashboards.",
            transform: "Full RAG pipeline for automated document processing.",
            recommendations: ["Python SDK", "AWS Lambda", "Pinecone Vector DB"],
            studyRules: [{ rule: "Write 50 lines of Python daily", label: "Code Every Day" }],
            digitalSkills: 1,
            techSavviness: 1,
            timePerWeekMins: 30,
            skillStage: 1,
            learnerType: "reflector",
            currentTools: ["Email"],
            blockers: ["time", "no coding experience"],
        });

        console.log(`  isValid: ${invalidResult.isValid}`);
        console.log(`  Notes: ${JSON.stringify(invalidResult.validationNotes)}`);
        console.log(`  Corrections: ${invalidResult.corrections.length}`);
        invalidResult.corrections.forEach((c, i) => {
            console.log(`    Correction ${i + 1}: [${c.field}] ${c.issue} → ${c.suggestion}`);
        });
        console.log(!invalidResult.isValid ? "  ✅ PASS (plan should be flagged)" : "  ⚠️ Validator missed mismatches — review prompt");
    } catch (e: any) {
        console.error(`  ❌ FAIL: ${e.message}`);
    }
}

testValidator().catch(console.error);
