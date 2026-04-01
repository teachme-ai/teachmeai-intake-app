'use client';

import React from 'react';
import { CheckCircle2, Zap, ArrowRight, TrendingUp, BarChart3, Clock } from 'lucide-react';

// 1. IMPACT Roadmap (Timeline)
export function ImpactRoadmap({ steps }: { steps: any[] }) {
    return (
        <div className="relative mt-8 mb-4 px-4 overflow-x-auto pb-12 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="flex min-w-[900px] justify-between relative px-12 py-4">
                {/* Connector Line */}
                <div className="absolute top-12 left-24 right-24 h-1 bg-slate-200 z-0">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-1/2 rounded-full" />
                </div>

                {steps.map((step, i) => (
                    <div key={i} className="flex flex-col items-center relative z-10 w-36">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg border-2 mb-4 bg-white transition-all hover:scale-110 cursor-default ${i < 3 ? 'border-indigo-500' : 'border-slate-300'}`}>
                            {step.icon}
                        </div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 text-center px-2">{step.step}</h4>
                        <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">Phase {i + 1}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 2. AI Opportunity Matrix (2x2)
export function OpportunityMatrix({ opportunities }: { opportunities: any[] }) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 mb-8 relative overflow-hidden min-h-[450px] flex flex-col">
            <div className="mb-12">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact Analysis</h4>
                <p className="text-xl font-black text-slate-900">Priority Matrix</p>
            </div>

            <div className="relative flex-grow w-full border-l-2 border-b-2 border-slate-300 ml-4 mb-4">
                {/* Axes Labels */}
                <span className="absolute -bottom-6 right-0 text-[10px] font-black uppercase tracking-widest text-slate-400">High Ease</span>
                <span className="absolute -left-12 top-0 -rotate-90 text-[10px] font-black uppercase tracking-widest text-slate-400">High Impact</span>

                {/* Grid quadrants Labels */}
                <div className="absolute top-[20%] left-[60%] text-[10px] font-black text-blue-500/20 uppercase tracking-[0.4em] rotate-12">Strategic</div>
                <div className="absolute top-[60%] left-[60%] text-[10px] font-black text-emerald-500/20 uppercase tracking-[0.4em] -rotate-12">Quick Wins</div>

                {/* Opportunity Bubbles */}
                <div className="absolute inset-0">
                    {opportunities.slice(0, 5).map((opt, i) => (
                        <div 
                            key={i}
                            className={`absolute w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white border-2 border-slate-200 shadow-xl flex items-center justify-center p-3 text-center transition-all hover:scale-125 z-20 cursor-default animate-in zoom-in duration-500 delay-${i * 100}`}
                            style={{ 
                                left: `${15 + (i * 15)}%`, 
                                top: `${10 + (i * 12)}%` 
                            }}
                        >
                            <div className="text-[10px] font-black leading-tight text-slate-900 line-clamp-3">#{i+1}</div>
                        </div>
                    ))}
                </div>
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
