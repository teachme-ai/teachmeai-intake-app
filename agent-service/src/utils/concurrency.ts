/**
 * Concurrency Limiter
 * 
 * Prevents quota exhaustion from traffic bursts by limiting:
 * - Global concurrent LLM calls per instance
 * - Per-session concurrent calls (1 at a time)
 */

import { logger } from './logger';

const log = logger.child({ component: 'concurrency' });

// --- CONFIGURATION ---
const MAX_CONCURRENT_LLM_CALLS = parseInt(process.env.MAX_CONCURRENT_LLM_CALLS || '5');
const MAX_PER_SESSION = parseInt(process.env.MAX_PER_SESSION_LLM_CALLS || '1');

// --- STATE ---
let globalActive = 0;
const sessionActive = new Map<string, number>();
const waitQueue: Array<{ resolve: () => void; sessionId?: string }> = [];

/**
 * Acquire a slot for an LLM call
 * Returns a release function to call when done
 */
export async function acquireLLMSlot(sessionId?: string): Promise<() => void> {
    // Wait if we're at capacity
    while (!canAcquire(sessionId)) {
        await waitForSlot(sessionId);
    }

    // Acquire the slot
    globalActive++;
    if (sessionId) {
        sessionActive.set(sessionId, (sessionActive.get(sessionId) || 0) + 1);
    }

    log.debug({
        event: 'slot.acquired',
        sessionId,
        globalActive,
        sessionCurrent: sessionId ? sessionActive.get(sessionId) : undefined
    });

    // Return release function
    return () => releaseSlot(sessionId);
}

/**
 * Check if we can acquire a slot
 */
function canAcquire(sessionId?: string): boolean {
    if (globalActive >= MAX_CONCURRENT_LLM_CALLS) return false;
    if (sessionId && (sessionActive.get(sessionId) || 0) >= MAX_PER_SESSION) return false;
    return true;
}

/**
 * Wait for a slot to become available
 */
function waitForSlot(sessionId?: string): Promise<void> {
    return new Promise(resolve => {
        waitQueue.push({ resolve, sessionId });
        log.debug({
            event: 'slot.waiting',
            sessionId,
            queueLength: waitQueue.length
        });
    });
}

/**
 * Release a slot and notify waiting requests
 */
function releaseSlot(sessionId?: string): void {
    globalActive--;
    if (sessionId) {
        const current = sessionActive.get(sessionId) || 1;
        if (current <= 1) {
            sessionActive.delete(sessionId);
        } else {
            sessionActive.set(sessionId, current - 1);
        }
    }

    log.debug({
        event: 'slot.released',
        sessionId,
        globalActive
    });

    // Notify next waiting request
    processQueue();
}

/**
 * Process the wait queue
 */
function processQueue(): void {
    for (let i = 0; i < waitQueue.length; i++) {
        const waiter = waitQueue[i];
        if (canAcquire(waiter.sessionId)) {
            waitQueue.splice(i, 1);
            waiter.resolve();
            return;
        }
    }
}

/**
 * Wrapper that handles both slot acquisition and LLM resilience
 */
export async function withConcurrencyLimit<T>(
    fn: () => Promise<T>,
    sessionId?: string
): Promise<T> {
    const release = await acquireLLMSlot(sessionId);
    try {
        return await fn();
    } finally {
        release();
    }
}

/**
 * Get current concurrency stats (for debugging/monitoring)
 */
export function getConcurrencyStats(): { globalActive: number; queueLength: number; activeSessions: number } {
    return {
        globalActive,
        queueLength: waitQueue.length,
        activeSessions: sessionActive.size
    };
}
