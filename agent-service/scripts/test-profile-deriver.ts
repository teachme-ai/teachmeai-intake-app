/**
 * Unit Test: Profile Deriver (Rule-Based)
 * Tests all 5 psychographic trait mappings across diverse personas.
 * No LLM calls — runs instantly.
 *
 * Run: npx tsx scripts/test-profile-deriver.ts
 */
import { deriveProfile } from '../src/utils/profile-deriver';
import { LearnerDossier } from '../src/types';

interface TestCase {
    name: string;
    dossier: Partial<LearnerDossier>;
    expected: {
        decisionStyle: string;
        uncertaintyHandling: string;
        changePreferenceRange: [number, number]; // [min, max]
        socialEntanglement: string;
        cognitiveLoadTolerance: string;
    };
}

const TEST_CASES: TestCase[] = [
    {
        name: "Analytical Theorist (High SRL, Low Tech)",
        dossier: {
            srl: { goalSetting: 5, adaptability: 3, reflection: 4 },
            preferences: { learnerType: 'theorist' },
            readiness: { skillStage: 2, techConfidence: 2, resilience: 3 },
            motivation: { type: 'outcome' },
            constraints: {},
            identity: {},
            context: {},
        },
        expected: {
            decisionStyle: 'Analytical',
            uncertaintyHandling: 'Checklist-Driven',
            changePreferenceRange: [4, 6], // adaptability 3 → ~6, minus theorist penalty
            socialEntanglement: 'Solitary',
            cognitiveLoadTolerance: 'Low',
        }
    },
    {
        name: "Intuitive Activist (Low SRL, High Adaptability)",
        dossier: {
            srl: { goalSetting: 1, adaptability: 5, reflection: 2 },
            preferences: { learnerType: 'activist' },
            readiness: { skillStage: 4, techConfidence: 4, resilience: 4 },
            motivation: { type: 'intrinsic' },
            constraints: {},
            identity: {},
            context: {},
        },
        expected: {
            decisionStyle: 'Intuitive',
            uncertaintyHandling: 'Experimenter',
            changePreferenceRange: [10, 10], // adaptability 5 → 10, +1 activist bonus, capped
            socialEntanglement: 'Social',
            cognitiveLoadTolerance: 'High',
        }
    },
    {
        name: "Paralyzed Beginner (Low everything)",
        dossier: {
            srl: { goalSetting: 2, adaptability: 1, reflection: 1 },
            preferences: { learnerType: 'reflector' },
            readiness: { skillStage: 1, techConfidence: 1, resilience: 1 },
            motivation: { type: 'outcome' },
            constraints: {},
            identity: {},
            context: {},
        },
        expected: {
            decisionStyle: 'Hybrid', // goalSetting 2 + reflector doesn't trigger Analytical (needs >=4)
            uncertaintyHandling: 'Paralyzed',
            changePreferenceRange: [1, 2],
            socialEntanglement: 'Solitary',
            cognitiveLoadTolerance: 'Low',
        }
    },
    {
        name: "Balanced Pragmatist (All 3s — default path)",
        dossier: {
            srl: { goalSetting: 3, adaptability: 3, reflection: 3 },
            preferences: { learnerType: 'pragmatist' },
            readiness: { skillStage: 3, techConfidence: 3, resilience: 3 },
            motivation: { type: 'hybrid' },
            constraints: {},
            identity: {},
            context: {},
        },
        expected: {
            decisionStyle: 'Hybrid',
            uncertaintyHandling: 'Checklist-Driven',
            changePreferenceRange: [5, 7],
            socialEntanglement: 'Solitary',
            cognitiveLoadTolerance: 'Medium',
        }
    },
    {
        name: "Missing Data (all undefined — fallback path)",
        dossier: {
            srl: {},
            preferences: {},
            readiness: {},
            motivation: {},
            constraints: {},
            identity: {},
            context: {},
        },
        expected: {
            decisionStyle: 'Hybrid',
            uncertaintyHandling: 'Checklist-Driven',
            changePreferenceRange: [5, 7], // all defaults to 3
            socialEntanglement: 'Solitary',
            cognitiveLoadTolerance: 'Medium',
        }
    }
];

function runTests() {
    console.log("\n==========================================");
    console.log("  🧪 PROFILE DERIVER UNIT TESTS");
    console.log("==========================================\n");

    let passed = 0;
    let failed = 0;

    for (const tc of TEST_CASES) {
        console.log(`--- ${tc.name} ---`);
        const profile = deriveProfile(tc.dossier as LearnerDossier);

        const checks = [
            {
                field: 'decisionStyle',
                actual: profile.decisionStyle,
                expected: tc.expected.decisionStyle,
                ok: profile.decisionStyle === tc.expected.decisionStyle
            },
            {
                field: 'uncertaintyHandling',
                actual: profile.uncertaintyHandling,
                expected: tc.expected.uncertaintyHandling,
                ok: profile.uncertaintyHandling === tc.expected.uncertaintyHandling
            },
            {
                field: 'changePreference',
                actual: profile.changePreference,
                expected: `${tc.expected.changePreferenceRange[0]}-${tc.expected.changePreferenceRange[1]}`,
                ok: profile.changePreference >= tc.expected.changePreferenceRange[0] &&
                    profile.changePreference <= tc.expected.changePreferenceRange[1]
            },
            {
                field: 'socialEntanglement',
                actual: profile.socialEntanglement,
                expected: tc.expected.socialEntanglement,
                ok: profile.socialEntanglement === tc.expected.socialEntanglement
            },
            {
                field: 'cognitiveLoadTolerance',
                actual: profile.cognitiveLoadTolerance,
                expected: tc.expected.cognitiveLoadTolerance,
                ok: profile.cognitiveLoadTolerance === tc.expected.cognitiveLoadTolerance
            }
        ];

        for (const c of checks) {
            if (c.ok) {
                console.log(`  ✅ ${c.field}: ${c.actual}`);
                passed++;
            } else {
                console.log(`  ❌ ${c.field}: got "${c.actual}", expected "${c.expected}"`);
                failed++;
            }
        }

        console.log(`  📝 Reasoning: ${profile.analysisReasoning}\n`);
    }

    console.log("==========================================");
    console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
    console.log("==========================================");
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
