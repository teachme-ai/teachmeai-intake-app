'use client';

import React from 'react';
import { Shield, Target, Zap, Brain } from 'lucide-react';

interface VisualInsightsProps {
    data: any; // EnrichedIntakeSchema
}

export default function VisualInsights({ data }: VisualInsightsProps) {
    if (!data) return null;

    // 1. Radar Chart Calculation (VARK)
    const vark = data.varkPreferences || { visual: 3, audio: 3, readingWriting: 3, kinesthetic: 3 };
    const maxVal = 5;
    const center = 100;
    const radius = 70;

    const points = [
        { label: 'Visual', val: vark.visual, x: center, y: center - (vark.visual / maxVal) * radius },
        { label: 'Audio', val: vark.audio, x: center + (vark.audio / maxVal) * radius, y: center },
        { label: 'Read/Write', val: vark.readingWriting || vark.reading, x: center, y: center + (vark.readingWriting / maxVal) * radius },
        { label: 'Kinesthetic', val: vark.kinesthetic, x: center - (vark.kinesthetic / maxVal) * radius, y: center },
    ];

    const radarPath = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;

    // 2. Mindset Gauges
    const gauges = [
        { label: 'Confidence', val: data.goalSettingConfidence || 3, icon: <Target className="w-4 h-4" />, color: 'blue' },
        { label: 'Resilience', val: data.resilienceLevel || 3, icon: <Shield className="w-4 h-4" />, color: 'emerald' },
        { label: 'AI Comfort', val: data.aiToolsConfidence || 3, icon: <Zap className="w-4 h-4" />, color: 'amber' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
            {/* VARK Radar Card */}
            <div
                className="col-span-1 md:col-span-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
                <div className="absolute top-4 left-6">
                    <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Learning Identity</h4>
                    <p className="text-lg sm:text-xl font-extrabold text-slate-800">Your VARK Profile</p>
                </div>

                <svg width="240" height="240" viewBox="0 0 200 200" className="mt-8 drop-shadow-sm">
                    {/* Grid Circles */}
                    {[0.2, 0.4, 0.6, 0.8, 1].map((step) => (
                        <circle
                            key={step}
                            cx={center}
                            cy={center}
                            r={radius * step}
                            fill="none"
                            stroke="#e2e8f0"
                            strokeDasharray="4 4"
                        />
                    ))}

                    {/* Axes */}
                    <line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="#f1f5f9" />
                    <line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="#f1f5f9" />

                    {/* Data Polygon */}
                    <path
                        d={radarPath}
                        fill="rgba(79, 70, 229, 0.15)"
                        stroke="#4f46e5"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        className="transition-all duration-1000 ease-in-out"
                    />

                    {/* Points & Labels */}
                    {points.map((p, i) => (
                        <g key={i}>
                            <circle cx={p.x} cy={p.y} r="4" fill="#4f46e5" className="transition-all duration-1000 ease-in-out" />
                            <text
                                x={p.x}
                                y={i === 0 ? p.y - 12 : i === 2 ? p.y + 18 : p.y + 4}
                                textAnchor={i === 1 ? 'start' : i === 3 ? 'end' : 'middle'}
                                className="text-[10px] font-bold fill-slate-500 uppercase tracking-tighter"
                                dx={i === 1 ? 8 : i === 3 ? -8 : 0}
                            >
                                {p.label}
                            </text>
                        </g>
                    ))}
                </svg>

                <div className="mt-4 grid grid-cols-4 gap-4 w-full px-4">
                    <div className="text-center">
                        <div className="text-indigo-600 font-bold text-sm sm:text-base">{vark.visual}/5</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold text-nowrap">Visual</div>
                    </div>
                    <div className="text-center">
                        <div className="text-indigo-600 font-bold text-sm sm:text-base">{vark.audio}/5</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold text-nowrap">Audio</div>
                    </div>
                    <div className="text-center">
                        <div className="text-indigo-600 font-bold text-sm sm:text-base">{vark.readingWriting || vark.reading}/5</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold text-nowrap">R/W</div>
                    </div>
                    <div className="text-center">
                        <div className="text-indigo-600 font-bold text-sm sm:text-base">{vark.kinesthetic}/5</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold text-nowrap">Kinest.</div>
                    </div>
                </div>
            </div>

            {/* Side Gauges & Archetype */}
            <div className="flex flex-col gap-4">
                {/* Archetype Card */}
                <div
                    className="group bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden flex-1 animate-in fade-in slide-in-from-right-4 duration-700"
                >
                    <Brain className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 rotate-12 transition-transform group-hover:scale-110 duration-500" />
                    <h4 className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">Archetype</h4>
                    <p className="text-xl sm:text-2xl font-black capitalize mb-2">{data.learnerType || 'Dynamic Learner'}</p>
                    <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-[9px] sm:text-[10px] font-bold uppercase backdrop-blur-md">
                        {data.skillStage === 1 ? 'Novice' : data.skillStage === 2 ? 'Advanced Beginner' : data.skillStage === 3 ? 'Competent' : data.skillStage === 4 ? 'Proficient' : 'Expert'} Level
                    </div>
                    <p className="text-[11px] sm:text-xs opacity-80 mt-4 leading-relaxed font-medium">
                        Your {data.learnerType} preference combined with a level {data.skillStage} skill stage suggests a {data.learnerType === 'pragmatist' ? 'practical, goal-oriented' : data.learnerType === 'theorist' ? 'conceptual, logical' : 'reflective'} approach to AI mastery.
                    </p>
                </div>

                {/* Mindset Mini Gauges */}
                <div className="bg-white/80 border border-slate-200 rounded-3xl p-6 shadow-sm grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    {gauges.map((g, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <div className="relative w-12 h-12 flex items-center justify-center mb-2">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="24" cy="24" r="20" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                                    <circle
                                        cx="24" cy="24" r="20" fill="none"
                                        stroke={g.color === 'blue' ? '#3b82f6' : g.color === 'emerald' ? '#10b981' : '#f59e0b'}
                                        strokeWidth="4"
                                        strokeDasharray={2 * Math.PI * 20}
                                        strokeDashoffset={2 * Math.PI * 20 * (1 - g.val / 5)}
                                        className="transition-all duration-1000 ease-out delay-500"
                                    />
                                </svg>
                                <div className="absolute flex items-center justify-center text-slate-600">
                                    {g.icon}
                                </div>
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tighter text-nowrap">{g.label}</span>
                            <span className="text-xs font-black text-slate-800">{g.val}/5</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
