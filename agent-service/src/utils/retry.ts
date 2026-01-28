/**
 * Utility for exponential backoff retry and delays
 */

/**
 * Simple delay helper
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Runs a function with exponential backoff retries
 */
export async function runWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 2000
): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // If it's a 429 or 503, we retry
            const isRetryable =
                error?.status === 429 ||
                error?.message?.includes('429') ||
                error?.message?.includes('Resource exhausted') ||
                error?.status === 503 ||
                error?.message?.includes('503');

            if (isRetryable && i < maxRetries - 1) {
                const waitTime = initialDelay * Math.pow(2, i);
                console.warn(`⚠️ [Retry] Rate limit or service error hit. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${maxRetries})`);
                await delay(waitTime);
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}
