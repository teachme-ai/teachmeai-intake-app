'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IntakeState, IntakeData } from '@/intake/schema';
import { Loader2, Send, User, Bot, CheckCircle2, Sparkles, ChevronLeft } from 'lucide-react';
import { InfoPanelIntake } from './InfoPanelIntake';

interface InterviewChatProps {
    initialState: IntakeState;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function InterviewChat({ initialState }: InterviewChatProps) {
    const [state, setState] = useState<IntakeState>(initialState);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init-1',
            role: 'assistant',
            content: initialState.lastAssistantMessage ||
                `Hi${initialState.fields.name?.value ? ' ' + initialState.fields.name.value : ''}! I see you're ${initialState.fields.role_raw?.value ? 'a ' + initialState.fields.role_raw.value : 'here'} looking to ${initialState.fields.goal_raw?.value ? initialState.fields.goal_raw.value : 'build something great'}. To build your perfect plan, I just need to ask a few quick questions. Ready?`,

            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const timer = setTimeout(() => scrollToBottom(), 100);
        return () => clearTimeout(timer);
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/intake/chat-turn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    state, // Pass full state back to server (MVP approach)
                    userMessage: userMsg.content
                })
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            const nextState: IntakeState = data.state || data.result?.state;
            const assistantMsgContent = data.message || data.result?.message;

            setState(nextState);

            // If analysis is included in response, set it immediately
            // Check both data.analysis and data.result.analysis
            const analysis = data.analysis || data.result?.analysis;
            if (analysis) {
                console.log('✅ Analysis received from /quizGuide:', analysis);
                setAnalysis(analysis);
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantMsgContent,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);

            if (nextState.isComplete) {
                // Trigger report generation or redirect
                // For now, just show completion state
            }

        } catch (error) {
            console.error('Chat error:', error);
            // Fallback UI
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "I&apos;m having a little trouble connecting. Could you try saying that again?",
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const [analysis, setAnalysis] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const triggerFinalAnalysis = useCallback(async () => {
        if (isAnalyzing || analysis || error) return;
        setIsAnalyzing(true);
        setError(null);
        try {
            const response = await fetch('/api/submit-chat-intake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state, messages })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            setAnalysis(data.analysis);
        } catch (err: any) {
            console.error('Final analysis error:', err);
            setError(err.message || 'Failed to generate your personalized report. Please try again or contact support.');
        } finally {
            setIsAnalyzing(false);
        }
    }, [state, messages, analysis, isAnalyzing, error]);

    useEffect(() => {
        if (state.isComplete && !analysis && !isAnalyzing && !error) {
            triggerFinalAnalysis();
        }
    }, [state.isComplete, analysis, isAnalyzing, error, triggerFinalAnalysis]);

    if (state.isComplete) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-left animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Intake Complete!</h2>

                {isAnalyzing ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                        <div className="text-center">
                            <p className="font-semibold text-gray-800">Orchestrating AI Agents...</p>
                            <p className="text-sm text-gray-500">Profiler, Strategist, and Tactician are building your plan.</p>
                        </div>
                    </div>
                ) : analysis ? (
                    <div className="space-y-8 mt-6 w-full max-w-2xl">
                        {/* 1. Targeted Strategy */}
                        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-2xl p-6 shadow-sm">
                            <h3 className="flex items-center gap-2 font-bold text-blue-900 text-lg mb-3">
                                <Sparkles className="w-5 h-5" /> Targeted AI Strategy
                            </h3>
                            <p className="text-blue-800 leading-relaxed font-medium">{analysis.Identify}</p>
                        </div>

                        {/* 2. Opportunities (Deep Research) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Bot className="w-5 h-5 text-brand-primary" /> AI Opportunities
                                </h3>
                                <ul className="space-y-3">
                                    {analysis.research?.aiOpportunityMap?.slice(0, 3).map((item: any, i: number) => (
                                        <li key={i} className="flex gap-3 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-700">{item.opportunity}:</span>
                                                <span className="text-slate-600 ml-1">{item.impact}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* 3. Top Priorities */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Top Priorities
                                </h3>
                                <ul className="space-y-3">
                                    {analysis.research?.topPriorities?.slice(0, 3).map((item: any, i: number) => (
                                        <li key={i} className="flex gap-3 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-700">{item.name}:</span>
                                                <span className="text-slate-600 ml-1">{item.quickWin}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* 4. IMPACT Roadmap */}
                        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Sparkles className="w-32 h-32" />
                            </div>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                                <CheckCircle2 className="w-6 h-6 text-blue-400" /> Your IMPACT Roadmap
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                                {[
                                    { step: 'Identify', content: analysis.Identify, icon: '🔍' },
                                    { step: 'Motivate', content: analysis.Motivate, icon: '🔥' },
                                    { step: 'Plan', content: analysis.Plan, icon: '📅' },
                                    { step: 'Act', content: analysis.Act, icon: '⚡' },
                                    { step: 'Check', content: analysis.Check, icon: '✅' },
                                    { step: 'Transform', content: analysis.Transform, icon: '🚀' }
                                ].map((item, i) => (
                                    <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">{item.icon}</span>
                                            <span className="font-bold text-blue-400 text-xs uppercase tracking-widest">{item.step}</span>
                                        </div>
                                        <p className="text-sm text-slate-300 line-clamp-3">{item.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 5. Learner Profile */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 shadow-sm">
                            <h3 className="font-bold text-emerald-900 text-lg mb-4 flex items-center gap-2">
                                <User className="w-5 h-5" /> Learner Profile & Psychological Fit
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(() => {
                                    try {
                                        const profile = typeof analysis.learnerProfile === 'string'
                                            ? JSON.parse(analysis.learnerProfile)
                                            : analysis.learnerProfile;

                                        return (
                                            <>
                                                <div className="bg-white/50 p-4 rounded-xl">
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Motivation Type</p>
                                                    <p className="text-emerald-900 font-bold">{profile?.motivationType || 'Unified'}</p>
                                                </div>
                                                <div className="bg-white/50 p-4 rounded-xl">
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">SRL Readiness</p>
                                                    <p className="text-emerald-900 font-bold">{profile?.srlLevel || 'Moderate'}</p>
                                                </div>
                                                <div className="col-span-1 sm:col-span-2 bg-white/50 p-4 rounded-xl">
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Psychological Capital</p>
                                                    <p className="text-emerald-900 font-medium italic">&quot;{profile?.psyCap || 'Ready for transformation.'}&quot;</p>
                                                </div>
                                            </>
                                        );
                                    } catch (e) {
                                        return <p className="text-emerald-800">{analysis.learnerProfile}</p>;
                                    }
                                })()}
                            </div>
                        </div>

                        {/* 6. CTA Section - PROMINENT */}
                        <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl p-10 text-white text-center shadow-2xl shadow-red-500/40 border-4 border-white">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                                <h3 className="text-3xl font-black mb-4 text-white drop-shadow-lg">🎯 Unlock Your Full 10-Page Report</h3>
                                <p className="text-white text-lg mb-8 max-w-lg mx-auto leading-relaxed font-semibold">
                                    Get your complete AI Adoption Blueprint, including specific automation workflows and a 90-day execution plan.
                                </p>
                                <a
                                    href="https://topmate.io/khalidirfan/1622786"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 bg-white text-red-600 font-black text-lg px-10 py-5 rounded-2xl hover:bg-yellow-50 hover:scale-105 transition-all active:scale-95 shadow-2xl hover:shadow-yellow-500/50 border-4 border-yellow-400"
                                >
                                    📞 Book 1:1 Clarity Call with Irfan <Send className="w-5 h-5" />
                                </a>
                                <p className="text-white text-sm mt-6 font-bold uppercase tracking-wider bg-black/20 rounded-full px-6 py-2 inline-block">
                                    ✨ Your personalized analysis will be presented in detail
                                </p>
                            </div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-6 mt-8 w-full text-center">
                        <p className="text-red-700 font-medium mb-4">{error}</p>
                        <button
                            onClick={() => { setError(null); triggerFinalAnalysis(); }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                        >
                            Retry Analysis
                        </button>
                    </div>
                ) : null}
            </div>
        );
    }


    return (
        <div className="flex flex-col lg:flex-row w-full h-full gap-4 lg:gap-6">
            {/* Chat Section - 75% on desktop */}
            {/* Chat Section - 75% on desktop - Cream/Light */}
            {/* Chat Section - Minimalist Column (Approx 60-65% width) */}
            <div className="w-full lg:w-[65%] flex flex-col h-full overflow-hidden relative">
                {/* Header - Minimalist Text Only */}
                <div className="flex items-center p-4 lg:p-6 pb-2">
                    <button className="mr-4 text-gray-400 hover:text-gray-900 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h3 className="font-bold text-gray-900 text-[var(--font-size-xl)] tracking-tight">
                        AI Assistant
                    </h3>
                </div>


                {/* Chat Area - Clean White Background */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            <div className={`
                                w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-transform hover:scale-105
                                ${msg.role === 'user' ? 'bg-gradient-to-br from-[#7F9CFF] to-[#547AFF] text-white shadow-blue-500/20' : 'bg-[#F3F4F6] text-gray-600 border border-gray-100'}
                            `}>
                                {msg.role === 'user' ? <User className="w-5 h-5 lg:w-6 lg:h-6" /> : <Bot className="w-6 h-6 lg:w-7 lg:h-7" />}
                            </div>

                            <div className={`
                                max-w-[85%] lg:max-w-[80%] rounded-2xl lg:rounded-[2rem] p-5 lg:p-7 shadow-sm transition-all relative group
                                ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-[#7F9CFF] to-[#547AFF] text-white rounded-tr-none shadow-blue-500/10'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-gray-200/50'}
                            `}>
                                <p className="text-[var(--font-size-base)] leading-relaxed font-medium">
                                    {msg.content}
                                </p>
                                <span className={`text-[12px] absolute -bottom-7 ${msg.role === 'user' ? 'right-0' : 'left-0'} opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-blue-500' : 'text-gray-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-3 animate-in fade-in duration-300">
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                <Bot className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl p-4 rounded-tl-none shadow-sm flex items-center gap-1.5 ring-1 ring-gray-50">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area - Simple Clean Capsule */}
                <div className="p-4 lg:p-6 bg-white flex-shrink-0 z-20">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="flex gap-3 lg:gap-5 max-w-4xl items-center relative"
                    >
                        <div className="flex-1 relative group/input">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full pl-6 pr-16 py-4 lg:py-5 bg-white border border-gray-100 rounded-[2rem] focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all placeholder:text-gray-400 text-[var(--font-size-base)] font-medium text-gray-800 shadow-sm"
                                autoFocus
                            />
                            <div className="absolute right-2 top-2 bottom-2">
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || isTyping}
                                    className="h-full aspect-square bg-[#547AFF] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-md shadow-blue-500/20"
                                >
                                    {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Info Panel - 25% on desktop */}
            <div className="hidden lg:block lg:w-[25%] h-full">
                <InfoPanelIntake />
            </div>
        </div>
    );
}
