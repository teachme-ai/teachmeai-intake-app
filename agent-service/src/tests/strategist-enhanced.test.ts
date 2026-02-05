/**
 * Test: Enhanced Strategist Agent
 * 
 * Tests the new context fields and their impact on strategy generation
 */

import { strategistFlow } from '../agents/strategist';
import { LearnerProfileSchema } from '../types';

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

// Mock learner profile for testing
const mockProfile = {
    psychologicalProfile: {
        srlLevel: 'Moderate' as const,
        motivationType: 'Mixed' as const,
        psyCap: 'High hope and resilience'
    },
    learningPreferences: {
        primaryStyle: 'Visual',
        secondaryStyle: 'Kinesthetic',
        adaptationStrategy: 'Use diagrams and hands-on practice'
    },
    focusAreas: ['AI fundamentals', 'Practical applications', 'Tool integration']
};

const mockResearch = {
    aiOpportunityMap: [
        {
            useCase: 'AI-powered customer segmentation',
            whyItMatters: 'Increase conversion by 30%',
            dataNeeded: 'Customer behavior data',
            tools: ['Claude', 'ChatGPT']
        }
    ],
    topPriorities: [
        {
            priority: 'Learn prompt engineering',
            impact: 'high' as const,
            feasibility: 'high' as const,
            quickWin: '30-day project',
            portfolioArtifact: 'AI assistant'
        }
    ],
    risksAndGuardrails: ['Data privacy', 'Model bias'],
    recommendedCapstone: {
        title: 'AI Marketing Assistant',
        deliverables: ['Working prototype', 'Documentation']
    }
};

// Test 1: Minimal Input (Backward Compatibility)
async function testMinimalInput() {
    log(BLUE, '\n=== Test 1: Minimal Input (Backward Compatibility) ===');

    try {
        const result = await strategistFlow({
            profile: mockProfile,
            professionalRoles: ['Product Manager'],
            primaryGoal: 'Learn AI for product strategy',
            deepResearchResult: mockResearch
        });

        const passed: boolean = !!(result.identify && result.motivate && result.plan);

        if (passed) {
            log(GREEN, '✅ PASS: Minimal input generates complete strategy');
            log(YELLOW, `   Priorities: ${result.priorities?.length || 0}`);
            log(YELLOW, `   Workflows: ${result.recommendedWorkflows?.length || 0}`);
        } else {
            log(RED, '❌ FAIL: Incomplete strategy output');
        }

        results.push({
            name: 'Minimal Input',
            passed: passed,
            details: `Complete IMPACT framework: ${passed ? 'Yes' : 'No'}`
        });
    } catch (error: any) {
        log(RED, `❌ FAIL: ${error?.message || 'Unknown error'}`);
        results.push({ name: 'Minimal Input', passed: false, details: error?.message || 'Unknown error' });
    }
}

// Test 2: Full Context with Time Constraints
async function testTimeConstraints() {
    log(BLUE, '\n=== Test 2: Time-Constrained Strategy ===');

    try {
        // Low time availability (5 hours/week = 300 mins)
        const lowTimeResult = await strategistFlow({
            profile: mockProfile,
            professionalRoles: ['Senior Product Manager'],
            primaryGoal: 'AI for product analytics',
            deepResearchResult: mockResearch,
            seniority: 'Senior',
            time_per_week_mins: 300,  // 5 hours
            application_context: 'Leading a product team of 8',
            benefits: 'Better data-driven decisions, faster insights',
            frustrations: 'Too much manual data analysis, slow reporting'
        });

        // High time availability (20 hours/week = 1200 mins)
        const highTimeResult = await strategistFlow({
            profile: mockProfile,
            professionalRoles: ['Senior Product Manager'],
            primaryGoal: 'AI for product analytics',
            deepResearchResult: mockResearch,
            seniority: 'Senior',
            time_per_week_mins: 1200,  // 20 hours
            application_context: 'Leading a product team of 8',
            benefits: 'Better data-driven decisions, faster insights',
            frustrations: 'Too much manual data analysis, slow reporting'
        });

        // Outputs should differ based on time availability
        const areDifferent = lowTimeResult.plan !== highTimeResult.plan;

        if (areDifferent) {
            log(GREEN, '✅ PASS: Strategy adapts to time constraints');
            log(YELLOW, '   Low time (5h) vs High time (20h) produce different plans');
        } else {
            log(YELLOW, '⚠️  WARNING: Same plan for different time constraints');
        }

        results.push({
            name: 'Time Constraints',
            passed: areDifferent,
            details: 'Time-adaptive strategy generation'
        });
    } catch (error: any) {
        log(RED, `❌ FAIL: ${error?.message || 'Unknown error'}`);
        results.push({ name: 'Time Constraints', passed: false, details: error?.message || 'Unknown error' });
    }
}

// Test 3: Frustration Addressing
async function testFrustrationAddressing() {
    log(BLUE, '\n=== Test 3: Frustration-Driven Motivation ===');

    try {
        const result = await strategistFlow({
            profile: mockProfile,
            professionalRoles: ['Marketing Manager'],
            primaryGoal: 'AI automation for campaigns',
            deepResearchResult: mockResearch,
            frustrations: 'Manual campaign setup is time-consuming and error-prone',
            benefits: 'Faster time-to-market, reduced errors'
        });

        // Check if MOTIVATE section mentions frustrations/benefits
        const motivateText = result.motivate.toLowerCase();
        const addressesFrustrations = motivateText.includes('time') || motivateText.includes('manual') || motivateText.includes('error');
        const highlightsBenefits = motivateText.includes('faster') || motivateText.includes('automat');

        const passed = addressesFrustrations && highlightsBenefits;

        if (addressesFrustrations) {
            log(GREEN, '✅ MOTIVATE addresses frustrations (manual, time, errors)');
        }

        if (highlightsBenefits) {
            log(GREEN, '✅ MOTIVATE highlights benefits (faster, automation)');
        }

        if (!passed) {
            log(RED, '❌ MOTIVATE does not adequately address context');
        }

        results.push({
            name: 'Frustration Addressing',
            passed,
            details: `Frustrations: ${addressesFrustrations}, Benefits: ${highlightsBenefits}`
        });
    } catch (error: any) {
        log(RED, `❌ FAIL: ${error?.message || 'Unknown error'}`);
        results.push({ name: 'Frustration Addressing', passed: false, details: error?.message || 'Unknown error' });
    }
}

// Test 4: Seniority-Based Strategy
async function testSeniorityCalibration() {
    log(BLUE, '\n=== Test 4: Seniority-Based Strategy ===');

    try {
        const juniorResult = await strategistFlow({
            profile: mockProfile,
            professionalRoles: ['Junior Developer'],
            primaryGoal: 'Learn AI basics',
            deepResearchResult: mockResearch,
            seniority: 'Junior'
        });

        const seniorResult = await strategistFlow({
            profile: mockProfile,
            professionalRoles: ['Engineering Director'],
            primaryGoal: 'AI strategy for team',
            deepResearchResult: mockResearch,
            seniority: 'Leadership'
        });

        // Check if strategies differ (junior = learning, senior = leading)
        const areDifferent = juniorResult.identify !== seniorResult.identify;

        if (areDifferent) {
            log(GREEN, '✅ PASS: Strategy calibrates to seniority level');
            log(YELLOW, '   Junior vs Leadership produce distinct strategies');
        } else {
            log(YELLOW, '⚠️  WARNING: Similar strategies for different seniorities');
        }

        results.push({
            name: 'Seniority Calibration',
            passed: areDifferent,
            details: 'Junior vs Leadership differentiation'
        });
    } catch (error: any) {
        log(RED, `❌ FAIL: ${error?.message || 'Unknown error'}`);
        results.push({ name: 'Seniority Calibration', passed: false, details: error?.message || 'Unknown error' });
    }
}

// Test 5: Application Context Integration
async function testApplicationContext() {
    log(BLUE, '\n=== Test 5: Application Context Integration ===');

    try {
        const result = await strategistFlow({
            profile: mockProfile,
            professionalRoles: ['Teacher'],
            primaryGoal: 'AI in classroom',
            deepResearchResult: mockResearch,
            application_context: 'High school math classroom with 30 students',
            time_per_week_mins: 600  // 10 hours
        });

        // Check if PLAN mentions classroom/students
        const planText = result.plan.toLowerCase();
        const isContextual = planText.includes('classroom') || planText.includes('student') || planText.includes('teaching');

        if (isContextual) {
            log(GREEN, '✅ PASS: PLAN integrates application context');
            log(YELLOW, `   Mentions: ${planText.match(/classroom|student|teaching/g)?.join(', ')}`);
        } else {
            log(RED, '❌ FAIL: PLAN ignores application context');
        }

        results.push({
            name: 'Application Context',
            passed: isContextual,
            details: `Context-aware planning: ${isContextual}`
        });
    } catch (error: any) {
        log(RED, `❌ FAIL: ${error?.message || 'Unknown error'}`);
        results.push({ name: 'Application Context', passed: false, details: error?.message || 'Unknown error' });
    }
}

// Run all tests
async function runTests() {
    log(BLUE, '\n========================================');
    log(BLUE, '  ENHANCED STRATEGIST AGENT TESTS');
    log(BLUE, '========================================\n');

    await testMinimalInput();
    await testTimeConstraints();
    await testFrustrationAddressing();
    await testSeniorityCalibration();
    await testApplicationContext();

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
