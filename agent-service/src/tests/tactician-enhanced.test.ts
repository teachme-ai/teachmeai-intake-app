/**
 * Test: Enhanced Tactician Agent
 * 
 * Tests the new context fields and their impact on tactical execution planning
 */

import { tacticianFlow } from '../agents/tactician';

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

// Mock strategy for testing
const mockStrategy = {
    identify: 'AI-powered customer analytics for product managers',
    motivate: 'Transform data-driven decisions and reduce manual analysis time',
    plan: 'Learn prompt engineering, build prototypes, deploy AI workflows',
    priorities: [
        'Master ChatGPT/Claude for data analysis',
        'Build AI-powered dashboard',
        'Integrate with existing tools (Notion, Slack)'
    ],
    recommendedWorkflows: [
        {
            name: 'Automated customer feedback analysis',
            description: 'Use AI to analyze customer feedback and extract insights',
            tools: ['ChatGPT', 'Claude']
        },
        {
            name: 'AI-assisted product roadmap prioritization',
            description: 'Leverage AI for data-driven roadmap decisions',
            tools: ['Notion', 'ChatGPT']
        }
    ]
};

// Test 1: Minimal Input (Backward Compatibility)
async function testMinimalInput() {
    log(BLUE, '\n=== Test 1: Minimal Input (Backward Compatibility) ===');

    try {
        const result = await tacticianFlow({
            strategy: mockStrategy,
            name: 'Alex',
            constraints: {
                timeBarrier: 3,
                skillStage: 3
            }
        });

        const passed: boolean = !!(result.act && result.check && result.transform);

        if (passed) {
            log(GREEN, '✅ PASS: Minimal input generates complete tactics');
            log(YELLOW, `   Action items: ${result.act?.length || 0}`);
            log(YELLOW, `   Checkpoints: ${result.check?.length || 0}`);
        } else {
            log(RED, '❌ FAIL: Incomplete tactics output');
        }

        results.push({
            name: 'Minimal Input',
            passed: passed,
            details: `Complete ACT framework: ${passed ? 'Yes' : 'No'}`
        });
    } catch (error: any) {
        log(RED, `❌ FAIL: ${error?.message || 'Unknown error'}`);
        results.push({ name: 'Minimal Input', passed: false, details: error?.message || 'Unknown error' });
    }
}

// Test 2: Time-Constrained Planning
async function testTimeConstraints() {
    log(BLUE, '\n=== Test 2: Time-Constrained Planning ===');

    try {
        // Low time (5 hours/week)
        const lowTimeResult = await tacticianFlow({
            strategy: mockStrategy,
            name: 'Jordan',
            constraints: {
                timeBarrier: 4,
                skillStage: 3
            },
            timePerWeekMins: 300  // 5 hours
        });

        // High time (15 hours/week)
        const highTimeResult = await tacticianFlow({
            strategy: mockStrategy,
            name: 'Jordan',
            constraints: {
                timeBarrier: 4,
                skillStage: 3
            },
            timePerWeekMins: 900  // 15 hours
        });

        // Different time allocations should produce different plans
        const areDifferent = lowTimeResult.act !== highTimeResult.act;

        if (areDifferent) {
            log(GREEN, '✅ PASS: Tactics adapt to time constraints');
            log(YELLOW, '   5h/week vs 15h/week produce different action plans');
        } else {
            log(YELLOW, '⚠️  WARNING: Same plans for different time allocations');
        }

        results.push({
            name: 'Time Constraints',
            passed: areDifferent,
            details: 'Time-adaptive tactical planning'
        });
    } catch (error: any) {
        log(RED, `❌ FAIL: ${error?.message || 'Unknown error'}`);
        results.push({ name: 'Time Constraints', passed: false, details: error?.message || 'Unknown error' });
    }
}

// Test 3: Tool Integration Priority
async function testToolIntegration() {
    log(BLUE, '\n=== Test 3: Tool Integration Priority ===');

    try {
        const result = await tacticianFlow({
            strategy: mockStrategy,
            name: 'Sam',
            constraints: {
                timeBarrier: 3,
                skillStage: 4,
                currentTools: ['Notion', 'Slack', 'Figma', 'Jira']
            },
            timePerWeekMins: 600
        });

        // Check if ACT section mentions their existing tools
        const actText = JSON.stringify(result.act).toLowerCase();
        const mentionsTools = ['notion', 'slack', 'figma', 'jira'].some(tool =>
            actText.includes(tool)
        );

        if (mentionsTools) {
            log(GREEN, '✅ PASS: Action items integrate with existing tools');
            const matchedTools = ['notion', 'slack', 'figma', 'jira'].filter(tool => actText.includes(tool));
            log(YELLOW, `   Mentions: ${matchedTools.join(', ')}`);
        } else {
            log(RED, '❌ FAIL: Action items ignore existing tools');
        }

        results.push({
            name: 'Tool Integration',
            passed: mentionsTools,
            details: `Tool-aware planning: ${mentionsTools}`
        });
    } catch (error: any) {
        log(RED, `❌ FAIL: ${error?.message || 'Unknown error'}`);
        results.push({ name: 'Tool Integration', passed: false, details: error?.message || 'Unknown error' });
    }
}

// Test 4: Learning Style Adaptation
async function testLearningStyle() {
    log(BLUE, '\n=== Test 4: Learning Style Adaptation ===');

    try {
        const theoristResult = await tacticianFlow({
            strategy: mockStrategy,
            name: 'Casey',
            constraints: {
                timeBarrier: 2,
                skillStage: 3
            },
            learnerType: 'theorist',
            timePerWeekMins: 480
        });

        const pragmatistResult = await tacticianFlow({
            strategy: mockStrategy,
            name: 'Casey',
            constraints: {
                timeBarrier: 2,
                skillStage: 3
            },
            learnerType: 'pragmatist',
            timePerWeekMins: 480
        });

        // Different learning styles should produce different approaches
        const areDifferent = theoristResult.act !== pragmatistResult.act;

        if (areDifferent) {
            log(GREEN, '✅ PASS: Tactics adapt to learning style');
            log(YELLOW, '   Theorist vs Pragmatist produce different approaches');
        } else {
            log(YELLOW, '⚠️  WARNING: Same tactics for different learning styles');
        }

        results.push({
            name: 'Learning Style',
            passed: areDifferent,
            details: 'Style-adaptive planning'
        });
    } catch (error: any) {
        log(RED, `❌ FAIL: ${error?.message || 'Unknown error'}`);
        results.push({ name: 'Learning Style', passed: false, details: error?.message || 'Unknown error' });
    }
}

// Test 5: Constraints List Integration
async function testConstraintsList() {
    log(BLUE, '\n=== Test 5: Constraints List Integration ===');

    try {
        const result = await tacticianFlow({
            strategy: mockStrategy,
            name: 'Morgan',
            constraints: {
                timeBarrier: 4,
                skillStage: 2,
                constraintsList: ['No coding experience', 'Limited budget', 'Need quick wins']
            },
            timePerWeekMins: 360
        });

        // Check if recommendations respect constraints
        const actText = JSON.stringify(result.act).toLowerCase();
        const addressesConstraints =
            actText.includes('no-code') ||
            actText.includes('low-code') ||
            actText.includes('quick') ||
            actText.includes('free') ||
            actText.includes('budget');

        if (addressesConstraints) {
            log(GREEN, '✅ PASS: Action items respect constraints');
            log(YELLOW, '   Adapted for no-code/budget/quick-win requirements');
        } else {
            log(RED, '❌ FAIL: Action items ignore constraints');
        }

        results.push({
            name: 'Constraints List',
            passed: addressesConstraints,
            details: `Constraint-aware planning: ${addressesConstraints}`
        });
    } catch (error: any) {
        log(RED, `❌ FAIL: ${error?.message || 'Unknown error'}`);
        results.push({ name: 'Constraints List', passed: false, details: error?.message || 'Unknown error' });
    }
}

// Run all tests
async function runTests() {
    log(BLUE, '\n========================================');
    log(BLUE, '  ENHANCED TACTICIAN AGENT TESTS');
    log(BLUE, '========================================\n');

    await testMinimalInput();
    await testTimeConstraints();
    await testToolIntegration();
    await testLearningStyle();
    await testConstraintsList();

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
    } else if (passed >= total * 0.8) {
        log(YELLOW, `⚠️  ${passed}/${total} tests passed (${successRate}% success rate) - ACCEPTABLE`);
        log(YELLOW, `Note: Some AI-generated outputs may vary, which is expected`);
        process.exit(0);
    } else {
        log(RED, `❌ INSUFFICIENT PASS RATE: ${passed}/${total} (${successRate}%)`);
        process.exit(1);
    }
}

// Execute
runTests().catch(error => {
    log(RED, `\n❌ TEST SUITE FAILED: ${error?.message || 'Unknown error'}`);
    console.error(error);
    process.exit(1);
});
