'use client';

import React from 'react';
import { Shield, Target, Zap, Brain } from 'lucide-react';

interface VisualInsightsProps {
    data: any; // EnrichedIntakeSchema
    research?: any; // DeepResearchOutput
    isFullscreen?: boolean;
}

export default function VisualInsights({ data, research, isFullscreen = false }: VisualInsightsProps) {
    if (!data) return null;

    const marketScore = research?.marketMaturityScore || 0;

    // 1. Radar Chart Calculation (VARK)
    // The new interview state uses vark_primary instead of the legacy 4-value scale
    const vPrimary = data.vark_primary?.value || 'visual';
    const vRanked: string[] = Array.isArray(data.vark_ranked?.value) ? data.vark_ranked.value : [];
    
    // Auto-balance the radar if we only know their primary
    const vark = { 
        visual: vPrimary === 'visual' ? 5 : (vRanked.includes('visual') ? 4 : 2), 
        audio: vPrimary === 'audio' ? 5 : (vRanked.includes('audio') ? 4 : 2), 
        readingWriting: (vPrimary === 'read_write' || vPrimary === 'readingWriting') ? 5 : (vRanked.includes('read_write') ? 4 : 2), 
        kinesthetic: vPrimary === 'kinesthetic' ? 5 : (vRanked.includes('kinesthetic') ? 4 : 2) 
    };
    const maxVal = 5;
    const center = 100;
    const radius = 70;

    const points = [
        { label: 'Visual', val: vark.visual, x: center, y: center - (vark.visual / maxVal) * radius },
        { label: 'Audio', val: vark.audio, x: center + (vark.audio / maxVal) * radius, y: center },
        { label: 'Read/Write', val: vark.readingWriting, x: center, y: center + (vark.readingWriting / maxVal) * radius },
        { label: 'Kinesthetic', val: vark.kinesthetic, x: center - (vark.kinesthetic / maxVal) * radius, y: center },
    ];

    const radarPath = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;

    // 2. Mindset Gauges
    const gauges = [
        { label: 'Goal Setting', val: data.srl_goal_setting?.value || 3, icon: <Target className="w-4 h-4" />, color: 'blue' },
        { label: 'Resilience', val: data.resilience?.value || 3, icon: <Shield className="w-4 h-4" />, color: 'emerald' },
        { label: 'Tech Comfort', val: data.tech_confidence?.value || 3, icon: <Zap className="w-4 h-4" />, color: 'amber' },
    ];

    // 3. Market Maturity Gauge Calculation
    const gaugeRadius = 45;
    const gaugeCircumference = Math.PI * gaugeRadius; // Half circle
    const gaugeOffset = gaugeCircumference * (1 - marketScore / 100);

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-1000">
            {/* Top Row: VARK Radar & Market Maturity Gauge */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* VARK Radar Card */}
                <div
                    className="md:col-span-3 bg-white/80 backdrop-blur-md border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center relative min-h-[380px]"
                >
                    <div className="absolute top-6 left-8">
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Dimensions</h4>
                        <p className="text-xl font-black text-slate-900">Learning Identity</p>
                    </div>

                    <div className="w-full h-full flex items-center justify-center mt-8 py-4">
                        <svg width="100%" height="240" viewBox="-60 -30 320 260" className="drop-shadow-xl overflow-visible max-w-[300px]">
                            {/* Grid Circles */}
                            {[0.2, 0.4, 0.6, 0.8, 1].map((step) => (
                                <circle
                                    key={step}
                                    cx={center}
                                    cy={center}
                                    r={radius * step}
                                    fill="none"
                                    stroke="#f1f5f9"
                                    strokeWidth="1"
                                    strokeDasharray={step === 1 ? "0" : "4 4"}
                                />
                            ))}

                            {/* Data Polygon */}
                            <path
                                d={radarPath}
                                fill="url(#radarGradient)"
                                stroke="#4f46e5"
                                strokeWidth="3"
                                strokeLinejoin="round"
                                className="transition-all duration-1000 ease-in-out"
                            />
                            <defs>
                                <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#9333ea" stopOpacity="0.2" />
                                </linearGradient>
                            </defs>

                            {/* Points & Labels */}
                            {points.map((p, i) => (
                                <g key={i}>
                                    <circle cx={p.x} cy={p.y} r="5" fill="#4f46e5" className="filter drop-shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                                    <text
                                        x={p.x}
                                        y={i === 0 ? p.y - 18 : i === 2 ? p.y + 28 : p.y + 4}
                                        textAnchor={i === 1 ? 'start' : i === 3 ? 'end' : 'middle'}
                                        className="text-[10px] font-black fill-slate-500 uppercase tracking-widest"
                                        dx={i === 1 ? 14 : i === 3 ? -14 : 0}
                                    >
                                        {p.label}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>

                    <div className="w-full flex justify-between px-4 border-t border-slate-100 pt-6 mt-2">
                        {Object.entries(vark).map(([key, val]) => (
                            <div key={key} className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">{key.substring(0, 3)}</p>
                                <p className="text-sm font-black text-indigo-600">{val}/5</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Market Maturity Gauge Card */}
                <div className="md:col-span-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-between min-h-[380px] relative overflow-hidden">

                    <div className="w-full">
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1 text-center">Market Pulse</h4>
                        <p className="text-lg font-black text-slate-900 text-center">AI Maturity Arc</p>
                    </div>

                    <div className="relative flex items-center justify-center mt-4">
                        <svg width="180" height="100" viewBox="0 0 100 60" className="overflow-visible">
                            {/* Background Arc */}
                            <path
                                d="M 5 55 A 45 45 0 0 1 95 55"
                                fill="none"
                                stroke="#f1f5f9"
                                strokeWidth="8"
                                strokeLinecap="round"
                            />
                            {/* Percentage Arc */}
                            <path
                                d="M 5 55 A 45 45 0 0 1 95 55"
                                fill="none"
                                stroke="url(#gaugeGradient)"
                                strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={gaugeCircumference}
                                strokeDashoffset={gaugeOffset}
                                className="transition-all duration-1000 ease-out delay-300"
                            />
                            <defs>
                                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute top-[50px] text-center">
                            <span className="text-4xl font-black text-slate-900 tracking-tighter">{marketScore}%</span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Community Use</p>
                        </div>
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 w-full">
                        <p className="text-emerald-950 text-xs leading-relaxed font-medium text-center italic">
                            Your industry shows <span className="font-bold underline">{marketScore > 50 ? 'high adoption' : 'emerging growth'}</span> in AI solutions for {research?.topPriorities?.[0]?.name || 'this role'}.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Archetype & Mindset */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Archetype Card */}
                <div
                    className="md:col-span-3 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden min-h-[200px] flex flex-col justify-center"
                >
                    <Brain className="absolute -bottom-8 -right-8 w-40 h-40 opacity-10 rotate-12" />
                    <div className="relative z-10">
                        <h4 className="text-[10px] font-black opacity-60 uppercase tracking-[0.3em] mb-2">Primary Archetype</h4>
                        <div className="flex flex-wrap items-baseline gap-3 mb-4">
                            <p className="text-3xl sm:text-4xl font-black capitalize tracking-tight leading-tight">{data.learner_type?.value || 'Dynamic'}</p>
                            <div className="bg-white/20 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md whitespace-nowrap">
                                {data.skill_stage?.value === 1 ? 'Novice' : data.skill_stage?.value === 5 ? 'Expert' : 'Practitioner'}
                            </div>
                        </div>
                        <p className="text-indigo-100 text-sm leading-relaxed max-w-lg font-medium">
                            Synthesizing your <span className="text-white font-bold">{vPrimary}</span> preference with a <span className="text-white font-bold">{data.learner_type?.value}</span> mindset... 
                            this plan prioritizes {vPrimary === 'kinesthetic' ? 'hands-on labs' : 'deep conceptual frameworks'} aligned with your goal.
                        </p>
                    </div>
                </div>

                {/* Mindset Mini Gauges */}
                <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-wrap items-center justify-around gap-4 min-h-[200px]">
                    {gauges.map((g, i) => (
                        <div key={i} className="flex flex-col items-center justify-center min-w-[80px]">
                            <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mb-3">
                                <svg className="w-full h-full transform -rotate-90 overflow-visible">
                                    <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                                    <circle
                                        cx="32" cy="32" r="26" fill="none"
                                        stroke={g.color === 'blue' ? '#3b82f6' : g.color === 'emerald' ? '#10b981' : '#f59e0b'}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 26}
                                        strokeDashoffset={2 * Math.PI * 26 * (1 - g.val / 5)}
                                        className="transition-all duration-[1500ms] ease-out"
                                    />
                                </svg>
                                <div className="absolute flex items-center justify-center text-slate-400">
                                    {g.icon}
                                </div>
                            </div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">{g.label.split(' ')[0]}</span>
                            <span className="text-sm font-black text-slate-900 mt-1">{g.val}/5</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

