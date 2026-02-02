/**
 * LLM Resilience Wrapper
 * 
 * Provides:
 * - Exponential backoff + jitter on 429 errors
 * - Configurable retry limits
 * - Structured logging per retry attempt
 * - Optional degradation path
 */

import { logger } from './logger';

export interface LLMResilienceOptions {
    /** Component name for logging */
    component: string;
    /** Session ID for tracking */
    sessionId?: string;
    /** Max retries (default: 3) */
    maxRetries?: number;
    /** Initial delay in ms (default: 500) */
    initialDelayMs?: number;
    /** Optional fallback function if all retries fail */
    fallback?: () => Promise<any>;
}

/**
 * Wrap LLM calls with exponential backoff and 429 handling
 */
export async function withLLMResilience<T>(
    fn: () => Promise<T>,
    options: LLMResilienceOptions
): Promise<T> {
    const {
        component,
        sessionId,
        maxRetries = 3,
        initialDelayMs = 500,
        fallback
    } = options;

    const log = logger.child({ component, sessionId });
    let delay = initialDelayMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (e: any) {
            const status = e?.status || e?.cause?.status || e?.code;
            const message = e?.message || String(e);
            const is429 = status === 429 ||
                status === 'RESOURCE_EXHAUSTED' ||
                message.includes('429') ||
                message.includes('quota') ||
                message.includes('rate limit');

            log.warn({
                event: 'llm.retry',
                attempt,
                maxRetries,
                is429,
                status,
                error: message.substring(0, 200)
            });

            // If not a rate limit error or we've exhausted retries
            if (!is429 || attempt === maxRetries) {
                // Try fallback if provided
                if (fallback) {
                    log.info({ event: 'llm.fallback', attempt });
                    return await fallback();
                }
                throw e;
            }

            // Exponential backoff with jitter
            const jitter = Math.floor(Math.random() * 300);
            const waitMs = delay + jitter;

            log.info({
                event: 'llm.backoff',
                attempt,
                waitMs,
                nextAttempt: attempt + 1
            });

            await sleep(waitMs);
            delay *= 2; // Exponential increase
        }
    }

    // Unreachable, but TypeScript needs this
    throw new Error(`LLM call failed after ${maxRetries} retries`);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
