/**
 * Genkit Configuration
 * 
 * Features:
 * - Env validation (fail fast)
 * - Typed model references
 * - Conditional telemetry (behind env flags)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root (not affected by CWD)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { genkit } from 'genkit';
import { googleAI, gemini20Flash, gemini15Pro } from '@genkit-ai/googleai';

// --- ENV VALIDATION (fail fast) ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY in environment. Cannot start agent service.');
}

// --- TELEMETRY (conditional) ---
const ENABLE_TELEMETRY = process.env.ENABLE_TELEMETRY === 'true';
const TELEMETRY_SAMPLE_RATE = parseFloat(process.env.TELEMETRY_SAMPLE_RATE || '0.1');

if (ENABLE_TELEMETRY) {
    // Dynamic import to avoid loading Google Cloud deps when disabled
    import('@genkit-ai/google-cloud').then(({ enableGoogleCloudTelemetry }) => {
        enableGoogleCloudTelemetry({
            projectId: process.env.GCLOUD_PROJECT_ID,
            forceDevExport: process.env.NODE_ENV !== 'production',
            // Note: Sampling is configured at the OpenTelemetry SDK level if needed
        });
        console.log(`[Genkit] Telemetry enabled (project: ${process.env.GCLOUD_PROJECT_ID || 'auto-detect'})`);
    }).catch((err) => {
        console.warn('[Genkit] Failed to enable telemetry:', err.message);
    });
}

// --- GENKIT INSTANCE ---
export const ai = genkit({
    plugins: [
        googleAI({ apiKey: GEMINI_API_KEY })
    ],
});

// --- TYPED MODEL REFERENCES ---
// Use these instead of string literals to prevent typos
export const INTAKE_MODEL = gemini20Flash;
export const DEFAULT_MODEL = INTAKE_MODEL;
export const REPORT_MODEL = gemini15Pro;

// String aliases (for cases where string is required)
export const INTAKE_MODEL_STRING = 'googleai/gemini-2.0-flash';
export const REPORT_MODEL_STRING = 'googleai/gemini-1.5-pro';
