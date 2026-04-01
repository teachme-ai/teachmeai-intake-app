/**
 * Telemetry and Cost Tracking for the AI Pipeline
 */

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface CostEntry {
    agentName: string;
    model: string;
    usage: TokenUsage;
    costUsd: number;
}

// Pricing approximations (per 1M tokens) - Update as needed
const PRICING: Record<string, { prompt: number, completion: number }> = {
    'claude-3-5-sonnet-20240620': { prompt: 3.00, completion: 15.00 },
    'claude-3-5-sonnet-latest': { prompt: 3.00, completion: 15.00 },
    'gemini-1.5-pro': { prompt: 3.50, completion: 10.50 },
    'gemini-1.5-flash': { prompt: 0.15, completion: 0.60 },
    'gpt-4o': { prompt: 5.00, completion: 15.00 },
    'gpt-4o-mini': { prompt: 0.15, completion: 0.60 }
};

export class CostTracker {
    private static instance: CostTracker;
    private currentTransaction: CostEntry[] = [];

    private constructor() {}

    static getInstance(): CostTracker {
        if (!CostTracker.instance) {
            CostTracker.instance = new CostTracker();
        }
        return CostTracker.instance;
    }

    reset() {
        this.currentTransaction = [];
    }

    addCall(agentName: string, model: string, usage: TokenUsage) {
        // Find pricing, default to highest cost (claude-3-5-sonnet) if unknown model to be safe
        const rates = PRICING[model] || PRICING['claude-3-5-sonnet-latest'];
        
        const costUsd = (usage.promptTokens / 1_000_000) * rates.prompt + 
                        (usage.completionTokens / 1_000_000) * rates.completion;

        this.currentTransaction.push({
            agentName,
            model,
            usage,
            costUsd
        });
    }

    getSummary() {
        const totalCost = this.currentTransaction.reduce((acc, curr) => acc + curr.costUsd, 0);
        const totalPrompt = this.currentTransaction.reduce((acc, curr) => acc + curr.usage.promptTokens, 0);
        const totalCompletion = this.currentTransaction.reduce((acc, curr) => acc + curr.usage.completionTokens, 0);
        
        return {
            calls: this.currentTransaction,
            aggregate: {
                totalCostUsd: totalCost,
                promptTokens: totalPrompt,
                completionTokens: totalCompletion,
                totalTokens: totalPrompt + totalCompletion
            }
        };
    }

    printLogSummary(txnId: string) {
        const summary = this.getSummary();
        
        console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
        console.log(`║  💰 TRANSACTION COST SUMMARY [${txnId}]`);
        console.log(`║  Total Cost: $${summary.aggregate.totalCostUsd.toFixed(6)}`);
        console.log(`║  Total Tokens: ${summary.aggregate.totalTokens.toLocaleString()} (P: ${summary.aggregate.promptTokens.toLocaleString()} | C: ${summary.aggregate.completionTokens.toLocaleString()})`);
        console.log(`╠══════════════════════════════════════════════════════════════╣`);
        
        for (const call of summary.calls) {
            console.log(`║  • [${call.agentName}] using ${call.model}`);
            console.log(`║    Cost: $${call.costUsd.toFixed(6)} | Tokens: ${call.usage.totalTokens.toLocaleString()}`);
        }
        console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
    }
}

export const costTracker = CostTracker.getInstance();
