'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IntakeState, IntakeData } from '@/intake/schema';
import { Loader2, Send, User, Bot, CheckCircle2, Sparkles } from 'lucide-react';

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
        scrollToBottom();
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
                        <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl p-10 text-white text-center shadow-2xl shadow-red-500/40 border-4 border-white animate-pulse-slow">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                                <h3 className="text-3xl font-black mb-4 text-white drop-shadow-lg">🎯 Unlock Your Full 15-Page Report</h3>
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
        <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header / Progress */}
            <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-800">TeachMeAI Assistant</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`w-2 h-2 rounded-full ${isTyping ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        {isTyping ? 'Thinking...' : 'Online'}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-medium text-gray-500 mb-1">Profile Completion</div>
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-600 transition-all duration-500"
                            style={{ width: `${state.completionPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                            ${msg.role === 'user' ? 'bg-primary-100' : 'bg-white border border-gray-200'}
                        `}>
                            {msg.role === 'user' ? <User className="w-5 h-5 text-primary-600" /> : <Bot className="w-5 h-5 text-blue-600" />}
                        </div>

                        <div className={`
                            max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm
                            ${msg.role === 'user'
                                ? 'bg-primary-600 text-white rounded-tr-none'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}
                        `}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 rounded-tl-none shadow-sm flex items-center gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your answer..."
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isTyping}
                        className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center"
                    >
                        {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
