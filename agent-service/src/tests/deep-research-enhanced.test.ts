/**
 * Test: Enhanced Deep Research Agent
 * 
 * Tests the new context fields and their impact on prompt generation
 */

import { deepResearchFlow } from '../agents/deep-research';
import { getDeepResearchPrompt } from '../prompts/deepResearch.system';

// Color codes for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

interface TestResult {
    name: string;
    passed: boolean;
    details: string;
}

const results: TestResult[] = [];

function log(color: string, message: string) {
    console.log(color + message + RESET);
}

// Test 1: Minimal Input (Backward Compatibility)
async function testMinimalInput() {
    log(BLUE, '\n=== Test 1: Minimal Input (Backward Compatibility) ===');

    try {
        const result = await deepResearchFlow({
            role: 'Product Manager',
            goal: 'Learn AI for product strategy',
            industry: 'General',
        });

        const passed = result.aiOpportunityMap.length > 0 && result.topPriorities.length > 0;

        if (passed) {
            log(GREEN, '✅ PASS: Minimal input works (backward compatible)');
            log(YELLOW, `   Generated ${result.aiOpportunityMap.length} opportunities, ${result.topPriorities.length} priorities`);
        } else {
            log(RED, '❌ FAIL: No output generated from minimal input');
        }

        results.push({
            name: 'Minimal Input',
            passed,
            details: `Opportunities: ${result.aiOpportunityMap.length}, Priorities: ${result.topPriorities.length}`
        });
    } catch (error: any) {
        log(RED, `❌ FAIL: ${error?.message || 'Unknown error'}`);
        results.push({ name: 'Minimal Input', passed: false, details: error?.message || 'Unknown error' });
    }
}

// Test 2: Full Context Input
async function testFullContextInput() {
    log(BLUE, '\n=== Test 2: Full Context Input ===');

    try {
        const result = await deepResearchFlow({
            role: 'Senior Product Manager',
            goal: 'AI for product strategy and team efficiency',
            industry: 'EdTech',
            seniority: 'Senior',
            application_context: 'Leading a team of 5 product managers',
            skill_stage: 4,
            current_tools: ['Notion', 'Figma', 'Slack', 'Jira']
        });

        const hasOpportunities = result.aiOpportunityMap.length > 0;
        const hasPriorities = result.topPriorities.length > 0;
        const hasCapstone = !!result.recommendedCapstone;

        const passed = hasOpportunities && hasPriorities && hasCapstone;

        if (passed) {
            log(GREEN, '✅ PASS: Full context generates rich output');
            log(YELLOW, `   Opportunities: ${result.aiOpportunityMap.length}`);
            log(YELLOW, `   Priorities: ${result.topPriorities.length}`);
            log(YELLOW, `   Capstone: ${result.recommendedCapstone?.title || 'N/A'}`);

            // Check if tools are mentioned in the output
            const opportunityText = JSON.stringify(result.aiOpportunityMap);
            const testTools = ['Notion', 'Figma', 'Slack', 'Jira'];
            const mentionsTools = testTools.some((tool: string) =>
                opportunityText.toLowerCase().includes(tool.toLowerCase())
            );

            if (mentionsTools) {
                log(GREEN, '   ✓ Output integrated existing tools (Notion/Figma/Slack/Jira)');
            }
        } else {
            log(RED, '❌ FAIL: Full context did not generate complete output');
        }

        results.push({
            name: 'Full Context Input',
            passed,
            details: `Rich output with ${result.aiOpportunityMap.length} opportunities`
        });
    } catch (error: any) {
        log(RED, `❌ FAIL: ${error?.message || 'Unknown error'}`);
        results.push({ name: 'Full Context Input', passed: false, details: error?.message || 'Unknown error' });
    }
}

// Test 3: Prompt Generation with Different Skill Levels
function testPromptGeneration() {
    log(BLUE, '\n=== Test 3: Prompt Generation - Skill Calibration ===');

    const testCases = [
        { skill: 1, expected: 'no-code' },
        { skill: 2, expected: 'low-code' },
        { skill: 3, expected: 'Mix of low-code' },
        { skill: 4, expected: 'Advanced' },
        { skill: 5, expected: 'Advanced' }
    ];

    let allPassed = true;

    testCases.forEach(tc => {
        const prompt = getDeepResearchPrompt({
            role: 'Developer',
            goal: 'AI automation',
            industry: 'Tech',
            skill_stage: tc.skill
        });

        const hasExpected = prompt.includes(tc.expected);

        if (hasExpected) {
            log(GREEN, `✅ Skill ${tc.skill}: Prompt includes "${tc.expected}" guidance`);
        } else {
            log(RED, `❌ Skill ${tc.skill}: Missing "${tc.expected}" guidance`);
            allPassed = false;
        }
    });

    results.push({
        name: 'Prompt Skill Calibration',
        passed: allPassed,
        details: 'Tested skill levels 1-5'
    });
}

// Test 4: Industry Specificity
async function testIndustrySpecificity() {
    log(BLUE, '\n=== Test 4: Industry-Specific Recommendations ===');

    try {
        const edtechResult = await deepResearchFlow({
            role: 'Product Manager',
            goal: 'AI for product analytics',
            industry: 'EdTech',
        });

        const bfsiResult = await deepResearchFlow({
            role: 'Product Manager',
            goal: 'AI for product analytics',
            industry: 'BFSI',
        });

        // Check if outputs are different (industry-specific)
        const edtechText = JSON.stringify(edtechResult.aiOpportunityMap);
        const bfsiText = JSON.stringify(bfsiResult.aiOpportunityMap);

        const areDifferent = edtechText !== bfsiText;

        if (areDifferent) {
            log(GREEN, '✅ PASS: Different industries generate different recommendations');
            log(YELLOW, '   EdTech vs BFSI outputs are distinct');
        } else {
            log(YELLOW, '⚠️  WARNING: EdTech and BFSI outputs are identical (may need stronger prompting)');
        }

        results.push({
            name: 'Industry Specificity',
            passed: areDifferent,
            details: 'EdTech vs BFSI comparison'
        });
    } catch (error: any) {
        log(RED, `❌ FAIL: ${error?.message || 'Unknown error'}`);
        results.push({ name: 'Industry Specificity', passed: false, details: error?.message || 'Unknown error' });
    }
}

// Test 5: Tool Integration Priority
function testToolIntegration() {
    log(BLUE, '\n=== Test 5: Tool Integration Priority ===');

    const promptWithTools = getDeepResearchPrompt({
        role: 'Developer',
        goal: 'Automation',
        industry: 'Tech',
        current_tools: ['Notion', 'Slack']
    });

    const promptWithoutTools = getDeepResearchPrompt({
        role: 'Developer',
        goal: 'Automation',
        industry: 'Tech'
    });

    const hasToolPriority = promptWithTools.includes('PRIORITIZE integrations');
    const noToolPriority = !promptWithoutTools.includes('PRIORITIZE integrations');

    const passed = hasToolPriority && noToolPriority;

    if (hasToolPriority) {
        log(GREEN, '✅ Prompt WITH tools includes integration priority');
    } else {
        log(RED, '❌ Prompt WITH tools missing integration priority');
    }

    if (noToolPriority) {
        log(GREEN, '✅ Prompt WITHOUT tools omits integration priority');
    } else {
        log(RED, '❌ Prompt WITHOUT tools incorrectly includes integration priority');
    }

    results.push({
        name: 'Tool Integration Priority',
        passed,
        details: 'Conditional tool integration guidance'
    });
}

// Test 6: Seniority Context
function testSeniorityContext() {
    log(BLUE, '\n=== Test 6: Seniority Context ===');

    const seniorPrompt = getDeepResearchPrompt({
        role: 'Product Manager',
        goal: 'AI Strategy',
        industry: 'Tech',
        seniority: 'Senior'
    });

    const juniorPrompt = getDeepResearchPrompt({
        role: 'Product Manager',
        goal: 'AI Strategy',
        industry: 'Tech',
        seniority: 'Junior'
    });

    const hasSeniorContext = seniorPrompt.includes('at Senior level');
    const hasJuniorContext = juniorPrompt.includes('at Junior level');

    const passed = hasSeniorContext && hasJuniorContext;

    if (hasSeniorContext) {
        log(GREEN, '✅ Senior level context included');
    } else {
        log(RED, '❌ Senior level context missing');
    }

    if (hasJuniorContext) {
        log(GREEN, '✅ Junior level context included');
    } else {
        log(RED, '❌ Junior level context missing');
    }

    results.push({
        name: 'Seniority Context',
        passed,
        details: 'Senior and Junior level differentiation'
    });
}

// Run all tests
async function runTests() {
    log(BLUE, '\n========================================');
    log(BLUE, '  ENHANCED DEEP RESEARCH AGENT TESTS');
    log(BLUE, '========================================\n');

    // Synchronous tests (prompt generation)
    testPromptGeneration();
    testToolIntegration();
    testSeniorityContext();

    // Asynchronous tests (actual flow execution)
    await testMinimalInput();
    await testFullContextInput();
    await testIndustrySpecificity();

    // Summary
    log(BLUE, '\n========================================');
    log(BLUE, '  TEST RESULTS');
    log(BLUE, '========================================\n');

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    results.forEach(r => {
        const status = r.passed ? GREEN + '✅ PASS' : RED + '❌ FAIL';
        log('', `${status}${RESET} ${r.name}: ${r.details}`);
    });

    log('', '');
    const successRate = ((passed / total) * 100).toFixed(0);

    if (passed === total) {
        log(GREEN, `✅ ALL TESTS PASSED (${passed}/${total})`);
        process.exit(0);
    } else {
        log(YELLOW, `⚠️  ${passed}/${total} tests passed (${successRate}% success rate)`);
        process.exit(1);
    }
}

// Execute
runTests().catch(error => {
    log(RED, `\n❌ TEST SUITE FAILED: ${error.message}`);
    console.error(error);
    process.exit(1);
});
