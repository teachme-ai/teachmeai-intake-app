"use client"

import { useState, useEffect } from 'react'
import { Sparkles, ShieldCheck, Zap, Bot, Users, Cpu, Search, Target } from 'lucide-react'

export function InfoPanelIntake() {
    const [currentCard, setCurrentCard] = useState(0)

    const mainCards = [
        {
            icon: Target,
            title: "1:1 Elite Strategy",
            description: "Go beyond generic prompts. Our consulting-led approach builds custom AI operational models tailored to your business DNA.",
            gradient: "from-blue-600 to-indigo-700",
            tag: "High-Touch"
        },
        {
            icon: Users,
            title: "Your Agent Squad",
            description: "Deep Research, Strategic Architect, and Tactician agents work in parallel to finalize your 90-day transformation plan.",
            gradient: "from-indigo-600 to-purple-700",
            tag: "Multi-Agent"
        }
    ]

    const frameworkCards = [
        {
            icon: Cpu,
            title: "PACE Framework",
            description: "Professional AI Capability Enhancement: Focusing on the intersection of Skill, Strategy, and Scale.",
            bgColor: "bg-white",
            borderColor: "border-gray-200",
            textColor: "text-blue-900",
            iconColor: "text-blue-600",
            tag: "Methodology"
        },
        {
            icon: ShieldCheck,
            title: "HITL Architectures",
            description: "Human-in-the-loop: Designing AI systems that augment expert intuition rather than just automating tasks.",
            bgColor: "bg-gray-50",
            borderColor: "border-gray-200",
            textColor: "text-gray-800",
            iconColor: "text-gray-600",
            tag: "Design"
        },
        {
            icon: Zap,
            title: "30-90-180 Blueprint",
            description: "Accelerated execution milestones: Quick wins in 30 days, Operational models in 90, Scaling in 180.",
            bgColor: "bg-white",
            borderColor: "border-amber-100",
            textColor: "text-amber-900",
            iconColor: "text-amber-500",
            tag: "Execution"
        },
        {
            icon: Bot,
            title: "AI Maturity Model",
            description: "We map your current capability across 5 levels, from 'AI Explorer' to fully 'AI-Native' organization.",
            bgColor: "bg-indigo-50",
            borderColor: "border-indigo-100",
            textColor: "text-indigo-900",
            iconColor: "text-indigo-600",
            tag: "Diagnostic"
        }
    ]

    const strategyCards = [
        {
            icon: Sparkles,
            title: "Capability Stacks",
            description: "Layering LLMs, specialized tools, and internal data into a cohesive AI nervous system.",
            bgColor: "bg-slate-50",
            borderColor: "border-slate-100",
            textColor: "text-slate-800",
            iconColor: "text-slate-500",
            tag: "Architecture"
        },
        {
            icon: Target,
            title: "Precision SDR Upskilling",
            description: "Training non-technical teams to master elite level prompting and AI operations.",
            bgColor: "bg-rose-50",
            borderColor: "border-rose-100",
            textColor: "text-rose-800",
            iconColor: "text-rose-500",
            tag: "Training"
        }
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentCard((prev) => (prev + 1) % mainCards.length)
        }, 8000)
        return () => clearInterval(interval)
    }, [mainCards.length])

    const activeMainCard = mainCards[currentCard]
    const MainIcon = activeMainCard.icon

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            {/* Header - Transparent/Minimal */}
            <div className="p-5 lg:p-6 pb-2 flex-shrink-0">
                <h3 className="font-black text-gray-900 text-[var(--font-size-lg)] tracking-tight">Consulting Insights</h3>
                <p className="text-gray-500 text-[var(--font-size-xs)] font-bold uppercase tracking-widest mt-0.5 opacity-90">
                    Real-time Strategic Optimization
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 lg:space-y-10 bg-slate-50/30">
                {/* Animated Info Card (Primary) */}
                <div key={currentCard} className="animate-in fade-in slide-in-from-right-4 duration-700 fill-mode-both flex-shrink-0">
                    <div className={`relative overflow-hidden bg-gradient-to-br ${activeMainCard.gradient} rounded-[1.5rem] lg:rounded-[2.5rem] p-6 lg:p-8 text-white shadow-xl flex flex-col justify-center ring-4 ring-white/10`}>
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <MainIcon className="w-20 h-20" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl lg:rounded-2xl flex items-center justify-center border border-white/20">
                                    <MainIcon className="w-6 h-6" />
                                </div>
                                <span className="bg-white/20 backdrop-blur-sm text-[var(--font-size-xs)] font-black uppercase tracking-tighter px-3 py-1 rounded-full border border-white/20">
                                    {activeMainCard.tag}
                                </span>
                            </div>
                            <h3 className="text-[var(--font-size-xl)] font-bold mb-2">{activeMainCard.title}</h3>
                            <p className="text-white/90 text-[var(--font-size-base)] leading-relaxed font-medium">{activeMainCard.description}</p>
                        </div>
                    </div>
                </div>

                {/* Secondary Insight Cards (Pastel) */}
                <div className="grid grid-cols-1 gap-5 lg:gap-8">
                    <h4 className="text-[var(--font-size-xs)] font-black text-slate-400 uppercase tracking-widest px-2">Frameworks & Approaches</h4>
                    {frameworkCards.map((fw, idx) => {
                        const FWIcon = fw.icon
                        return (
                            <div key={idx} className={`${fw.bgColor} border ${fw.borderColor} rounded-[1.5rem] lg:rounded-[2rem] p-5 lg:p-6 shadow-sm transition-all hover:scale-[1.02] cursor-default group`}>
                                <div className="flex gap-4 lg:gap-6">
                                    <div className={`w-12 h-12 rounded-xl lg:rounded-2xl bg-white border ${fw.borderColor} shadow-sm flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform`}>
                                        <FWIcon className={`w-6 h-6 ${fw.iconColor}`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <h5 className={`font-bold text-[var(--font-size-base)] ${fw.textColor}`}>{fw.title}</h5>
                                            <span className="text-[var(--font-size-xs)] font-black uppercase tracking-tighter py-0.5 px-2 rounded bg-white/50 border border-current opacity-60">
                                                {fw.tag}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-[var(--font-size-sm)] leading-relaxed font-medium">
                                            {fw.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Strategy insight cards */}
                <div className="grid grid-cols-1 gap-4 lg:gap-5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Operational Strategy</h4>
                    {strategyCards.map((fw, idx) => {
                        const FWIcon = fw.icon
                        return (
                            <div key={idx} className={`${fw.bgColor} border ${fw.borderColor} rounded-[1.5rem] p-4 lg:p-5 shadow-sm transition-all hover:scale-[1.02] cursor-default group`}>
                                <div className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-xl bg-white border ${fw.borderColor} shadow-sm flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform`}>
                                        <FWIcon className={`w-5 h-5 ${fw.iconColor}`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h5 className={`font-bold text-sm ${fw.textColor}`}>{fw.title}</h5>
                                            <span className="text-[8px] font-black uppercase tracking-tighter py-0.5 px-1.5 rounded bg-white/50 border border-current opacity-60">
                                                {fw.tag}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-xs leading-relaxed font-medium mb-1">
                                            {fw.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Diagnostic Footer */}
                <div className="space-y-4 pt-4 border-t border-slate-200/60">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-200/50 group hover:border-indigo-200 transition-colors">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Diagnostic Status</h4>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                                <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-20" />
                            </div>
                            <p className="text-slate-700 font-bold text-sm">Agents Active & Processing</p>
                        </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                        <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Bot className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[10px] font-black text-indigo-800 uppercase tracking-tight opacity-70">Active Strategy Mode</p>
                            <p className="text-sm font-black text-indigo-900 truncate">Psychological Profiler v2.0</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
