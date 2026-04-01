/**
 * Context Trimming Utility
 * Reduces the size of conversation transcripts and arrays to enforce token guardrails
 * and reduce LLM operation costs.
 */

interface TranscriptTurn {
    turn: number;
    user: string;
    agent: string;
    field: string;
}

/**
 * Trims a conversation transcript to stay within a target token limit (heuristically).
 * 1 token is approximately 4 characters in English.
 * 
 * Strategy:
 * - Always keep the first 2 turns (usually the most important context setting)
 * - Always keep the last N turns that fit within the limit
 * - Prune the "middle" of the conversation if it exceeds the token limit
 */
export function trimTranscript(
    transcript: TranscriptTurn[], 
    maxTokens: number = 2000
): TranscriptTurn[] {
    if (!transcript || transcript.length <= 4) return transcript; // Too short to matter
    
    const charLimit = maxTokens * 4;
    
    // Calculate total size of all turns
    const measureTurn = (t: TranscriptTurn) => 
        (t.user?.length || 0) + (t.agent?.length || 0) + (t.field?.length || 0) + 20;

    let totalChars = transcript.reduce((sum, t) => sum + measureTurn(t), 0);
    
    if (totalChars <= charLimit) {
        return transcript; // We're safe
    }

    // We need to trim. 
    // Keep first 2 turns guaranteed
    const head = transcript.slice(0, 2);
    let headChars = head.reduce((sum, t) => sum + measureTurn(t), 0);
    
    // Keep as many from the tail as possible
    const tail: TranscriptTurn[] = [];
    let tailChars = 0;
    
    for (let i = transcript.length - 1; i >= 2; i--) {
        const turn = transcript[i];
        const turnSize = measureTurn(turn);
        
        // +100 for the `[... N turns omitted ...]` marker we'll add
        if (headChars + tailChars + turnSize + 100 > charLimit) {
            break;
        }
        
        tail.unshift(turn);
        tailChars += turnSize;
    }

    // If we couldn't even fit the tail, return just what we have so far
    if (tail.length === 0) {
        return head; // Fallback to just the head
    }

    // Add a synthetic marker turn to indicate missing context (useful for the LLM)
    const omittedCount = transcript.length - head.length - tail.length;
    
    if (omittedCount > 0) {
        return [
            ...head,
            {
                turn: -1,
                user: `[... ${omittedCount} intermediate conversation turns omitted for brevity ...]`,
                agent: `[... ${omittedCount} intermediate conversation turns omitted for brevity ...]`,
                field: 'omitted'
            },
            ...tail
        ];
    }

    return transcript;
}
