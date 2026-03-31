/**
 * Unit Test: Dossier Builder
 * Verifies IntakeState → LearnerDossier mapping preserves all data.
 *
 * Run: npx tsx scripts/test-dossier-builder.ts
 */
import { buildLearnerDossier } from '../src/utils/dossier-builder';
import { initializeState } from '../src/intake/state';

function runTests() {
    console.log("\n==========================================");
    console.log("  🧪 DOSSIER BUILDER UNIT TESTS");
    console.log("==========================================\n");

    let passed = 0;
    let failed = 0;

    function check(label: string, actual: any, expected: any) {
        if (actual === expected) {
            console.log(`  ✅ ${label}: ${actual}`);
            passed++;
        } else {
            console.log(`  ❌ ${label}: got "${actual}", expected "${expected}"`);
            failed++;
        }
    }

    // --- Test 1: Full state with all fields ---
    console.log("--- Test 1: Full state (all fields populated) ---");
    const state = initializeState('test-dossier-1', {
        name: 'Priya',
        email: 'priya@example.com',
        role: 'Data Analyst',
        goal: 'Automate reporting'
    });

    // Manually populate remaining fields as the interview engine would
    state.fields.role_category = { value: 'Analytics', status: 'confirmed', confidence: 'high', evidence: 'stated', updatedAt: new Date().toISOString() };
    state.fields.industry_vertical = { value: 'Finance', status: 'confirmed', confidence: 'high', evidence: 'stated', updatedAt: new Date().toISOString() };
    state.fields.seniority = { value: 'Mid-level', status: 'confirmed', confidence: 'high', evidence: 'stated', updatedAt: new Date().toISOString() };
    state.fields.skill_stage = { value: 3, status: 'confirmed', confidence: 'high', evidence: 'stated', updatedAt: new Date().toISOString() };
    state.fields.learner_type = { value: 'pragmatist', status: 'confirmed', confidence: 'high', evidence: 'stated', updatedAt: new Date().toISOString() };
    state.fields.motivation_type = { value: 'hybrid', status: 'confirmed', confidence: 'high', evidence: 'stated', updatedAt: new Date().toISOString() };
    state.fields.srl_goal_setting = { value: 4, status: 'confirmed', confidence: 'high', evidence: 'stated', updatedAt: new Date().toISOString() };
    state.fields.srl_adaptability = { value: 3, status: 'confirmed', confidence: 'high', evidence: 'stated', updatedAt: new Date().toISOString() };
    state.fields.digital_skills = { value: 4, status: 'confirmed', confidence: 'high', evidence: 'stated', updatedAt: new Date().toISOString() };
    state.fields.tech_savviness = { value: 3, status: 'confirmed', confidence: 'high', evidence: 'stated', updatedAt: new Date().toISOString() };
    state.fields.time_per_week_mins = { value: 120, status: 'confirmed', confidence: 'high', evidence: 'stated', updatedAt: new Date().toISOString() };
    state.fields.frustrations = { value: 'Manual data cleaning', status: 'confirmed', confidence: 'high', evidence: 'stated', updatedAt: new Date().toISOString() };
    state.fields.current_tools = { value: ['Excel', 'Python'], status: 'confirmed', confidence: 'high', evidence: 'stated', updatedAt: new Date().toISOString() };

    const dossier = buildLearnerDossier(state);

    // Identity checks
    check('identity.name', dossier.identity.name, 'Priya');
    check('identity.roleCategory', dossier.identity.roleCategory, 'Analytics');
    check('identity.industryVertical', dossier.identity.industryVertical, 'Finance');
    check('identity.seniority', dossier.identity.seniority, 'Mid-level');

    // Dimensional checks
    check('srl.goalSetting', dossier.srl.goalSetting, 4);
    check('preferences.learnerType', dossier.preferences.learnerType, 'pragmatist');
    check('readiness.skillStage', dossier.readiness.skillStage, 3);
    check('constraints.timePerWeekMins', dossier.constraints.timePerWeekMins, 120);
    check('constraints.frustrations', dossier.constraints.frustrations, 'Manual data cleaning');

    // Profile auto-derivation check
    check('profile exists', !!dossier.psychographicProfile, true);
    check('profile.decisionStyle', dossier.psychographicProfile?.decisionStyle, 'Hybrid');

    // Array field check
    const tools = dossier.constraints.currentTools || [];
    check('currentTools has Excel', tools.includes('Excel'), true);
    check('currentTools has Python', tools.includes('Python'), true);

    // --- Test 2: Minimal state (quiz-only prefill) ---
    console.log("\n--- Test 2: Minimal state (only quiz fields) ---");
    const minimalState = initializeState('test-dossier-2', {
        name: 'Kai',
        email: 'kai@example.com',
        role: 'Teacher',
        goal: 'Learn AI'
    });

    const minDossier = buildLearnerDossier(minimalState);
    check('min.identity.name', minDossier.identity.name, 'Kai');
    check('min.srl.goalSetting', minDossier.srl.goalSetting, undefined);
    check('min.profile exists (with defaults)', !!minDossier.psychographicProfile, true);
    check('min.sessionId', minDossier.sessionId, 'test-dossier-2');

    console.log("\n==========================================");
    console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
    console.log("==========================================");
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
