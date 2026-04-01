'use client';

import React from 'react';
import { CheckCircle2, Zap, ArrowRight, TrendingUp, BarChart3, Clock } from 'lucide-react';

// 1. IMPACT Roadmap (Timeline)
export function ImpactRoadmap({ steps }: { steps: any[] }) {
    return (
        <div className="relative mt-8 mb-4 px-4 overflow-x-auto pb-6">
            <div className="flex min-w-[800px] justify-between relative px-8">
                {/* Connector Line */}
                <div className="absolute top-8 left-16 right-16 h-1 bg-slate-200 z-0">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-1/2 rounded-full" />
                </div>

                {steps.map((step, i) => (
                    <div key={i} className="flex flex-col items-center relative z-10 w-32">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg border-2 mb-4 bg-white transition-all hover:scale-110 cursor-default ${i < 3 ? 'border-indigo-500' : 'border-slate-300'}`}>
                            {step.icon}
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 text-center">{step.step}</h4>
                        <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">Phase {i + 1}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 2. AI Opportunity Matrix (2x2)
export function OpportunityMatrix({ opportunities }: { opportunities: any[] }) {
    // We'll mock the placement since the LLM output is text-heavy
    const categories = [
        { name: 'Quick Wins', x: 75, y: 75, color: 'emerald' },
        { name: 'Strategic Hits', x: 75, y: 25, color: 'blue' },
        { name: 'Experimental', x: 25, y: 75, color: 'amber' },
        { name: 'Long Term', x: 25, y: 25, color: 'purple' },
    ];

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 mb-8 relative overflow-hidden h-[400px]">
            <div className="absolute top-4 left-8">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact Analysis</h4>
                <p className="text-xl font-black text-slate-900">Priority Matrix</p>
            </div>

            {/* Axes */}
            <div className="absolute bottom-12 left-16 right-16 h-0.5 bg-slate-300">
                <span className="absolute -bottom-6 right-0 text-[10px] font-black uppercase tracking-widest text-slate-400">High Ease</span>
            </div>
            <div className="absolute top-16 bottom-12 left-16 w-0.5 bg-slate-300">
                <span className="absolute -left-12 top-0 -rotate-90 text-[10px] font-black uppercase tracking-widest text-slate-400">High Impact</span>
            </div>

            {/* Grid quadrants Labels */}
            <div className="absolute top-[20%] left-[60%] text-[10px] font-black text-blue-500/30 uppercase tracking-[0.4em] rotate-12">Strategic</div>
            <div className="absolute top-[60%] left-[60%] text-[10px] font-black text-emerald-500/30 uppercase tracking-[0.4em] -rotate-12">Quick Wins</div>

            {/* Opportunity Bubbles */}
            <div className="relative w-full h-full">
                {opportunities.slice(0, 5).map((opt, i) => (
                    <div 
                        key={i}
                        className={`absolute w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white border-2 border-slate-200 shadow-xl flex items-center justify-center p-2 text-center transition-all hover:scale-125 z-20 cursor-default animate-in zoom-in duration-500 delay-${i * 100}`}
                        style={{ 
                            left: `${20 + (i * 15)}%`, 
                            top: `${15 + (i * 12)}%` 
                        }}
                    >
                        <div className="text-[10px] font-black leading-tight text-slate-900 line-clamp-2">#{i+1}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 3. Strategy Blueprint Card
export function StrategyBlueprint({ summary, industry }: { summary: string, industry?: string }) {
    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden group">
            <Zap className="absolute -top-10 -right-10 w-48 h-48 opacity-5 text-indigo-400 group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-500 p-2 rounded-xl">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Master Strategy</h4>
                        <p className="text-xl font-black text-white">{industry || 'Personalized'} Growth Node</p>
                    </div>
                </div>
                <p className="text-slate-300 text-lg leading-relaxed font-medium italic">
                    &ldquo;{summary}&rdquo;
                </p>
            </div>
        </div>
    );
}
