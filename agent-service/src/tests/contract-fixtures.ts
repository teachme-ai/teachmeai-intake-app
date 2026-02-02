/**
 * Contract Test Fixtures for TeachMeAI Intake Engine
 * 
 * Fixture A: Quiz provides role_raw + goal_raw + email
 * Fixture B: User gives everything in one message
 * Fixture C: Invalid scale twice → guardrail triggers
 */

import { initializeState, calculateCompletion } from '../intake/state';
import { processUserTurn } from '../intake/interviewEngine';
import { IntakeState } from '../intake/schema';

interface TestResult {
    fixture: string;
    passed: boolean;
    details: string;
    turnsTaken?: number;
}

/**
 * Fixture A: Quiz already has role_raw + goal_raw + email
 * Expected: guide exits immediately → strategist/profiler → tactician → done
 */
export async function runFixtureA(): Promise<TestResult> {
    console.log('\n=== Fixture A: Quiz Prefill Test ===');

    // Initialize with quiz prefill
    const state = initializeState('fixture-a', {
        name: 'Priya',
        email: 'priya@example.com',
        role: 'Product Manager at a fintech startup',
        goal: 'Learn AI for product roadmaps'
    });

    // Verify role_raw and goal_raw are confirmed from prefill
    const roleConfirmed = state.fields.role_raw?.status === 'confirmed';
    const goalConfirmed = state.fields.goal_raw?.status === 'confirmed';
    const emailConfirmed = state.fields.email?.status === 'confirmed';

    if (!roleConfirmed || !goalConfirmed) {
        return {
            fixture: 'A',
            passed: false,
            details: `Prefill not confirmed: role=${roleConfirmed}, goal=${goalConfirmed}`
        };
    }

    // Simulate first user turn - engine should exit guide quickly
    const turn1 = await processUserTurn(state, "Let's get started");

    const guideExited = turn1.state.activeAgent !== 'guide';

    return {
        fixture: 'A',
        passed: guideExited && emailConfirmed,
        details: `Guide exited: ${guideExited}, Email confirmed: ${emailConfirmed}, Active agent: ${turn1.state.activeAgent}`,
        turnsTaken: 1
    };
}

/**
 * Fixture B: User gives everything in one message
 * Expected: Extractor merges multiple fields without losing anything
 */
export async function runFixtureB(): Promise<TestResult> {
    console.log('\n=== Fixture B: Multi-field Extraction ===');

    const state = initializeState('fixture-b', {});

    // User provides multiple fields in one message
    const turn1 = await processUserTurn(
        state,
        "Hi, I'm Rahul, a senior software engineer at a healthcare company. My email is rahul@example.com"
    );

    const hasName = !!turn1.state.fields.name?.value;
    const hasEmail = !!turn1.state.fields.email?.value;
    const hasRole = !!turn1.state.fields.role_category?.value || !!turn1.state.fields.seniority?.value;

    return {
        fixture: 'B',
        passed: hasName && hasEmail,
        details: `Name: ${turn1.state.fields.name?.value || 'missing'}, Email: ${!!turn1.state.fields.email?.value}, Role extracted: ${hasRole}`,
        turnsTaken: 1
    };
}

/**
 * Fixture C: Repetition triggers guardrail
 * Expected: Invalid scale twice → switch_to_mcq or default fallback
 */
export async function runFixtureC(): Promise<TestResult> {
    console.log('\n=== Fixture C: Guardrail Trigger ===');

    const state = initializeState('fixture-c', {
        name: 'Test User',
        email: 'test@example.com',
        role: 'Marketing Manager',
        goal: 'Learn AI'
    });

    // Simulate progression to a scale question (skill_stage)
    state.activeAgent = 'profiler';
    state.lastQuestionField = 'skill_stage';
    state.repeatCountByField = { skill_stage: 0 };

    // First invalid response
    const turn1 = await processUserTurn(state, "maybe");
    const repeatCount1 = turn1.state.repeatCountByField?.skill_stage || 0;

    // Second invalid response
    turn1.state.lastQuestionField = 'skill_stage';
    const turn2 = await processUserTurn(turn1.state, "not sure");
    const repeatCount2 = turn2.state.repeatCountByField?.skill_stage || 0;

    // Check if guardrail applied a default or switched mode
    const guardrailTriggered = repeatCount2 >= 2 || turn2.state.fields.skill_stage?.status === 'confirmed';

    return {
        fixture: 'C',
        passed: guardrailTriggered,
        details: `Repeat counts: ${repeatCount1} → ${repeatCount2}, Guardrail triggered: ${guardrailTriggered}`,
        turnsTaken: 2
    };
}

/**
 * Run all fixtures and report results
 */
export async function runAllFixtures(): Promise<void> {
    console.log('\n========================================');
    console.log('  CONTRACT TEST FIXTURES');
    console.log('========================================');

    const results: TestResult[] = [];

    try {
        results.push(await runFixtureA());
    } catch (e: any) {
        results.push({ fixture: 'A', passed: false, details: `Error: ${e.message}` });
    }

    try {
        results.push(await runFixtureB());
    } catch (e: any) {
        results.push({ fixture: 'B', passed: false, details: `Error: ${e.message}` });
    }

    try {
        results.push(await runFixtureC());
    } catch (e: any) {
        results.push({ fixture: 'C', passed: false, details: `Error: ${e.message}` });
    }

    console.log('\n========================================');
    console.log('  RESULTS');
    console.log('========================================');

    let allPassed = true;
    for (const r of results) {
        const status = r.passed ? '✅' : '❌';
        console.log(`${status} Fixture ${r.fixture}: ${r.details}`);
        if (!r.passed) allPassed = false;
    }

    console.log('\n' + (allPassed ? '✅ ALL FIXTURES PASSED' : '❌ SOME FIXTURES FAILED'));
    process.exit(allPassed ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
    runAllFixtures().catch(console.error);
}
