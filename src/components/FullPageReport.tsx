'use client';

import React, { useState } from 'react';
import { Shield, Target, Zap, Brain, CheckCircle2, Lightbulb, TrendingUp, User, Wrench } from 'lucide-react';
import ResultsHeader from './ResultsHeader';
import VisualInsights from './VisualInsights';
import ExpandableSection from './ExpandableSection';
import ConsultationCTA from './ConsultationCTA';
import { ImpactRoadmap, OpportunityMatrix, StrategyBlueprint } from './ReportVisuals';

interface FullPageReportProps {
    data: any;
    analysis: any;
}

export default function FullPageReport({ data, analysis }: FullPageReportProps) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        strategy: true,
        opportunities: true,
        plan: true,
        priorities: true,
        profile: true
    });

    const roadmapSteps = [
        { step: 'Identify', content: analysis?.Identify, icon: '🔍', color: 'blue' },
        { step: 'Motivate', content: analysis?.Motivate, icon: '🔥', color: 'amber' },
        { step: 'Plan', content: analysis?.Plan, icon: '📅', color: 'purple' },
        { step: 'Act', content: analysis?.Act, icon: '⚡', color: 'indigo' },
        { step: 'Check', content: analysis?.Check, icon: '✅', color: 'emerald' },
        { step: 'Transform', content: analysis?.Transform, icon: '🚀', color: 'pink' }
    ];

    const isAllExpanded = Object.values(expandedSections).every(Boolean);

    const toggleAllSections = (expand: boolean) => {
        setExpandedSections({
            strategy: expand,
            opportunities: expand,
            plan: expand,
            priorities: expand,
            profile: expand
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-50 overflow-y-auto w-screen h-screen select-none print:hidden">
            <style jsx global>{`
                @media print {
                    body { display: none !important; }
                }
            `}</style>
            {/* Edge-to-Edge Promo Header */}
            <div className="w-full bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-xl">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">TeachMeAI<span className="text-indigo-400">.</span></h1>
                        <p className="text-indigo-200 text-sm font-medium mt-1">Intelligent Learning Impact Report</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                        <SparkleIcon className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-bold tracking-wide">AI Verified</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
                {/* Results Header with Expand/Collapse Controls */}
                <div className="mb-8">
                    <ResultsHeader
                        userName={data?.name?.value || 'there'}
                        userRole={data?.role_raw?.value || 'Professional'}
                        onExpandAll={() => toggleAllSections(true)}
                        onCollapseAll={() => toggleAllSections(false)}
                        allExpanded={isAllExpanded}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative">
                    {/* Left Column: Visual Insights & Archetypes */}
                    <div className="xl:col-span-5 space-y-6">
                        <div className="sticky top-6">
                            <VisualInsights
                                data={data}
                                research={analysis?.research}
                                isFullscreen={true}
                            />
                        </div>
                    </div>

                    {/* Right Column: Deep Analysis & Plan */}
                    <div className="xl:col-span-7 space-y-6">
                        {/* 1. Strategic Overview */}
                        <ExpandableSection
                            title="🎯 Your Targeted AI Strategy"
                            icon={<Target className="w-6 h-6 text-blue-600" />}
                            isExpanded={expandedSections.strategy}
                            onToggle={() => setExpandedSections(prev => ({ ...prev, strategy: !prev.strategy }))}
                        >
                            <StrategyBlueprint 
                                summary={analysis?.personalizedSummary || 'Strategic roadmap for AI mastery.'} 
                                industry={data?.industry?.value}
                            />
                            <p className="text-gray-700 leading-relaxed text-lg bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">{analysis?.Identify}</p>
                        </ExpandableSection>

                        {/* 2. AI Opportunities Matrix */}
                        <ExpandableSection
                            title="💡 High-Impact AI Opportunities"
                            icon={<Lightbulb className="w-6 h-6 text-amber-500" />}
                            isExpanded={expandedSections.opportunities}
                            onToggle={() => setExpandedSections(prev => ({ ...prev, opportunities: !prev.opportunities }))}
                        >
                            {analysis?.research?.aiOpportunityMap && (
                                <OpportunityMatrix opportunities={analysis.research.aiOpportunityMap} />
                            )}
                            
                            {analysis?.research?.aiOpportunityMap && analysis.research.aiOpportunityMap.length > 0 ? (
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    {analysis.research.aiOpportunityMap.map((item: any, i: number) => (
                                        <li key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100">
                                                    <span className="text-base font-black text-amber-600">{i + 1}</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-base">{item.opportunity}</p>
                                                    <p className="text-gray-600 text-sm mt-2 leading-relaxed">{item.impact}</p>
                                                    {item.tools && item.tools.length > 0 && (
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            {item.tools.map((tool: string, ti: number) => (
                                                                <span key={ti} className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                                                                    {tool}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 italic">No AI opportunities data available.</p>
                            )}
                        </ExpandableSection>

                        {/* 3. IMPACT Action Plan (Roadmap) */}
                        <ExpandableSection
                            title="🚀 The Execution Plan"
                            icon={<TrendingUp className="w-6 h-6 text-indigo-600" />}
                            isExpanded={expandedSections.plan}
                            onToggle={() => setExpandedSections(prev => ({ ...prev, plan: !prev.plan }))}
                        >
                            <ImpactRoadmap steps={roadmapSteps} />

                            <div className="space-y-4 mt-8">
                                {roadmapSteps.map((item, i) => (
                                    <div key={i} className={`bg-white border border-slate-200 border-l-4 border-l-${item.color}-500 rounded-xl rounded-l-none p-6 shadow-sm`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-10 h-10 rounded-full bg-${item.color}-50 flex items-center justify-center text-xl`}>
                                                {item.icon}
                                            </div>
                                            <h4 className={`font-black uppercase tracking-wider text-${item.color}-700`}>{item.step}</h4>
                                        </div>
                                        <p className="text-slate-700 text-base leading-relaxed">{item.content}</p>
                                    </div>
                                ))}
                            </div>
                        </ExpandableSection>

                        {/* 4. Top Priorities */}
                        <ExpandableSection
                            title="✨ Quick Wins & Priorities"
                            icon={<Wrench className="w-6 h-6 text-emerald-600" />}
                            isExpanded={expandedSections.priorities}
                            onToggle={() => setExpandedSections(prev => ({ ...prev, priorities: !prev.priorities }))}
                        >
                            {analysis?.research?.topPriorities && analysis.research.topPriorities.length > 0 ? (
                                <ul className="space-y-4">
                                    {analysis.research.topPriorities.map((item: any, i: number) => (
                                        <li key={i} className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 shadow-inner">
                                                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-emerald-950 text-lg">{item.name}</p>
                                                    <p className="text-emerald-800 mt-2 text-base"><strong>Quick Win:</strong> {item.quickWin}</p>
                                                    {item.impact && <p className="text-emerald-700/80 text-sm mt-2 italic">{item.impact}</p>}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 italic">No priority data available.</p>
                            )}
                        </ExpandableSection>

                        {/* 5. Learner Profile */}
                        <ExpandableSection
                            title="👤 Psychological Profile & Mastery Rules"
                            icon={<User className="w-6 h-6 text-purple-600" />}
                            isExpanded={expandedSections.profile}
                            onToggle={() => setExpandedSections(prev => ({ ...prev, profile: !prev.profile }))}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(() => {
                                    try {
                                        const profile = typeof analysis?.learnerProfile === 'string'
                                            ? JSON.parse(analysis?.learnerProfile)
                                            : analysis?.learnerProfile;

                                        return (
                                            <>
                                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Motivation Type</p>
                                                    <p className="text-slate-900 font-bold text-lg">{profile?.motivationType || 'Unified'}</p>
                                                </div>
                                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Self-Regulated Learning</p>
                                                    <p className="text-slate-900 font-bold text-lg">{profile?.srlLevel || 'Moderate'}</p>
                                                </div>
                                                <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
                                                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">Psychological Capital</p>
                                                    <p className="text-indigo-950 font-medium italic text-lg leading-relaxed">&quot;{profile?.psyCap || 'Ready for transformation.'}&quot;</p>
                                                </div>

                                                {/* Hyper-Personalized Study Rules */}
                                                {analysis?.studyRules && analysis.studyRules.length > 0 && (
                                                    <div className="col-span-1 sm:col-span-2 mt-6">
                                                        <h5 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
                                                            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                                                            Your AI Mastery Rules
                                                        </h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {analysis.studyRules.map((rule: any, idx: number) => (
                                                                <div key={idx} className="bg-white border text-center border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6 flex flex-col items-center justify-center">
                                                                    <div className="bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                                                                        {rule.label}
                                                                    </div>
                                                                    <p className="text-slate-700 text-base font-medium leading-relaxed">
                                                                        {rule.rule}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* AI Assessor Notes */}
                                                {(analysis?.validationNotes?.length > 0 || analysis?.research?.assumptions?.length > 0) && (
                                                    <div className="col-span-1 sm:col-span-2 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {analysis?.research?.assumptions && analysis.research.assumptions.length > 0 && (
                                                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                                                                <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                    <Brain className="w-4 h-4" /> Profiling Assumptions
                                                                </h5>
                                                                <ul className="text-sm text-blue-900/80 list-disc list-inside space-y-2">
                                                                    {analysis.research.assumptions.map((note: string, idx: number) => (
                                                                        <li key={idx} className="leading-snug">{note}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {analysis?.validationNotes && analysis.validationNotes.length > 0 && (
                                                            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5">
                                                                <h5 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                    <Shield className="w-4 h-4" /> Validation Audits
                                                                </h5>
                                                                <ul className="text-sm text-rose-900/80 list-disc list-inside space-y-2">
                                                                    {analysis.validationNotes.map((note: string, idx: number) => (
                                                                        <li key={idx} className="leading-snug">{note}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    } catch (e) {
                                        return <p className="text-gray-700">{analysis?.learnerProfile}</p>;
                                    }
                                })()}
                            </div>
                        </ExpandableSection>

                        {/* 6. Consultation CTA */}
                        <div className="mt-12">
                            <ConsultationCTA />
                        </div>
                    </div>
                </div>

                {/* Footer Footer */}
                <div className="mt-24 pt-8 border-t border-slate-200 text-center">
                    <p className="text-slate-400 font-medium flex items-center justify-center gap-2">
                        Powered by <strong className="text-slate-600">TeachMeAI</strong>
                    </p>
                </div>
            </div>
        </div>
    );
}

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        </svg>
    )
}
