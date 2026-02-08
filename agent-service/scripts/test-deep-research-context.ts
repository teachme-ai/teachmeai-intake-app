
import { deepResearchFlow } from '../src/agents/deep-research';

async function testContextAwareness() {
    console.log("🧪 Testing Deep Research Context Awareness...");

    try {
        // Test Case 1: Junior PM
        console.log("\n--- Case 1: Junior PM (Efficiency Focus) ---");
        const juniorResult = await deepResearchFlow({
            role: "Product Manager",
            goal: "Improve workflow",
            industry: "SaaS",
            seniority: "Junior",
            application_context: "Personal productivity",
            current_tools: ["Notion", "Slack"],
            skillStage: 2
        });
        console.log("Output (Junior):", JSON.stringify(juniorResult, null, 2));

        // Test Case 2: Senior PM
        console.log("\n--- Case 2: Senior PM (Strategy Focus) ---");
        const seniorResult = await deepResearchFlow({
            role: "Product Manager",
            goal: "Improve workflow",
            industry: "SaaS",
            seniority: "Senior",
            application_context: "Team Leadership",
            current_tools: ["Jira", "Tableau"],
            skillStage: 4
        });
        console.log("Output (Senior):", JSON.stringify(seniorResult, null, 2));
    } catch (e) {
        console.error("Test failed:", e);
    }
}

testContextAwareness();
