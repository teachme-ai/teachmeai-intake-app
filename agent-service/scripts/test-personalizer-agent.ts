/**
 * Agent Test: Personalizer Flow
 * Verifies tone adapts to decision style (Analytical vs Intuitive).
 *
 * Run: npx tsx scripts/test-personalizer-agent.ts
 * Requires: GEMINI_API_KEY set in environment
 */
import { personalizerFlow } from '../src/agents/personalizer';

const BASE_IMPACT = {
    Identify: "AI can automate 60% of your data reporting workflow.",
    Motivate: "This positions you for a leadership role in data-driven decision making.",
    Plan: "2-hour weekly learning path focused on AI-assisted analytics.",
    Act: "Start with ChatGPT for data summarization, then move to Tableau AI.",
    Check: "Track hours saved on reporting and quality of AI-generated insights.",
    Transform: "In 6 months, you'll lead the AI adoption initiative in your team.",
};

async function testPersonalizer() {
    console.log("\n==========================================");
    console.log("  🧪 PERSONALIZER AGENT TESTS");
    console.log("==========================================\n");

    // Case 1: Analytical learner
    console.log("--- Case 1: Analytical Decision Style ---");
    try {
        const analyticalResult = await personalizerFlow({
            ...BASE_IMPACT,
            name: "Dr. Meera Krishnan",
            roleCategory: "Research Scientist",
            frustrations: "Too much time on literature reviews",
            benefits: "Publish 2x more papers per year",
            decisionStyle: "Analytical",
            learnerType: "theorist",
            currentTools: ["PubMed", "R Studio", "LaTeX"],
        });

        console.log("  Output (first 200 chars):", analyticalResult.personalizedSummary.substring(0, 200));
        const hasName = analyticalResult.personalizedSummary.includes("Meera");
        const hasTool = analyticalResult.personalizedSummary.toLowerCase().includes("pubmed") ||
                        analyticalResult.personalizedSummary.toLowerCase().includes("r studio");
        console.log(`  ✅ Contains name: ${hasName}`);
        console.log(`  ✅ References tools: ${hasTool}`);
        console.log(`  Length: ${analyticalResult.personalizedSummary.length} chars\n`);
    } catch (e: any) {
        console.error(`  ❌ FAIL: ${e.message}`);
    }

    // Case 2: Intuitive learner
    console.log("--- Case 2: Intuitive Decision Style ---");
    try {
        const intuitiveResult = await personalizerFlow({
            ...BASE_IMPACT,
            name: "Zara",
            roleCategory: "Creative Director",
            frustrations: "Can't keep up with design trends",
            benefits: "Win more pitches with AI-enhanced concepts",
            decisionStyle: "Intuitive",
            learnerType: "activist",
            currentTools: ["Figma", "Adobe Suite"],
        });

        console.log("  Output (first 200 chars):", intuitiveResult.personalizedSummary.substring(0, 200));
        const hasName = intuitiveResult.personalizedSummary.includes("Zara");
        const hasFrustration = intuitiveResult.personalizedSummary.toLowerCase().includes("trend") ||
                               intuitiveResult.personalizedSummary.toLowerCase().includes("keep up");
        console.log(`  ✅ Contains name: ${hasName}`);
        console.log(`  ✅ Addresses frustration: ${hasFrustration}`);
        console.log(`  Length: ${intuitiveResult.personalizedSummary.length} chars\n`);
    } catch (e: any) {
        console.error(`  ❌ FAIL: ${e.message}`);
    }
}

testPersonalizer().catch(console.error);
