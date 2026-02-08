'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IntakeState, IntakeData } from '@/intake/schema';
import { Loader2, Send, User, Bot, CheckCircle2, Sparkles, Target, Lightbulb, TrendingUp, Wrench } from 'lucide-react';
import ExpandableSection from './ExpandableSection';
import ResultsHeader from './ResultsHeader';
import ConsultationCTA from './ConsultationCTA';

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
                // Add preparation message before triggering analysis
                setTimeout(() => {
                    const preparationMsg: Message = {
                        id: (Date.now() + 2).toString(),
                        role: 'assistant',
                        content: "🎯 Excellent! Your report is now being prepared by our agentic-driven analysis system. You'll see your comprehensive AI learning profile in just a few seconds...",
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, preparationMsg]);
                }, 800);
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
    const [allSectionsExpanded, setAllSectionsExpanded] = useState(false);

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
            <div className="flex flex-col items-center justify-center p-8 text-left animate-in fade-in zoom-in duration-500 max-w-4xl mx-auto">
                {isAnalyzing ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                        <div className="text-center">
                            <p className="font-semibold text-gray-800">Orchestrating AI Agents...</p>
                            <p className="text-sm text-gray-500">Profiler, Strategist, and Tactician are building your plan.</p>
                        </div>
                    </div>
                ) : analysis ? (
                    <div className="space-y-6 w-full">
                        {/* Results Header with Expand/Collapse Controls */}
                        <ResultsHeader
                            userName={state.fields.name?.value || 'there'}
                            userRole={state.fields.role_raw?.value || 'Professional'}
                            onExpandAll={() => setAllSectionsExpanded(true)}
                            onCollapseAll={() => setAllSectionsExpanded(false)}
                            allExpanded={allSectionsExpanded}
                        />

                        {/* 1. Strategic Overview */}
                        <ExpandableSection
                            title="🎯 Your Targeted AI Strategy"
                            icon={<Target className="w-5 h-5 text-blue-600" />}
                            defaultExpanded={allSectionsExpanded}
                        >
                            <p className="text-gray-700 leading-relaxed">{analysis.Identify}</p>
                        </ExpandableSection>

                        {/* 2. AI Opportunities (Full List) */}
                        <ExpandableSection
                            title="💡 AI Opportunities for Your Role"
                            icon={<Lightbulb className="w-5 h-5 text-yellow-600" />}
                            defaultExpanded={allSectionsExpanded}
                        >
                            {analysis.research?.aiOpportunityMap && analysis.research.aiOpportunityMap.length > 0 ? (
                                <ul className="space-y-4">
                                    {analysis.research.aiOpportunityMap.map((item: any, i: number) => (
                                        <li key={i} className="flex gap-3">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                                                <span className="text-xs font-bold text-blue-700">{i + 1}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{item.opportunity}</p>
                                                <p className="text-gray-600 text-sm mt-1">{item.impact}</p>
                                                {item.tools && item.tools.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {item.tools.map((tool: string, ti: number) => (
                                                            <span key={ti} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                                                                {tool}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 italic">No AI opportunities data available.</p>
                            )}
                        </ExpandableSection>

                        {/* 3. IMPACT Action Plan (All Steps, Full Text) */}
                        <ExpandableSection
                            title="🚀 Your IMPACT Action Plan"
                            icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
                            defaultExpanded={allSectionsExpanded}
                        >
                            <div className="space-y-6">
                                {[
                                    { step: 'Identify', content: analysis.Identify, icon: '🔍', color: 'blue' },
                                    { step: 'Motivate', content: analysis.Motivate, icon: '🔥', color: 'orange' },
                                    { step: 'Plan', content: analysis.Plan, icon: '📅', color: 'purple' },
                                    { step: 'Act', content: analysis.Act, icon: '⚡', color: 'yellow' },
                                    { step: 'Check', content: analysis.Check, icon: '✅', color: 'green' },
                                    { step: 'Transform', content: analysis.Transform, icon: '🚀', color: 'pink' }
                                ].map((item, i) => (
                                    <div key={i} className={`bg-${item.color}-50 border-l-4 border-${item.color}-500 rounded-r-xl p-4`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{item.icon}</span>
                                            <h4 className="font-bold text-gray-800 uppercase text-sm tracking-wide">{item.step}</h4>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">{item.content}</p>
                                    </div>
                                ))}
                            </div>
                        </ExpandableSection>

                        {/* 4. Top Priorities */}
                        <ExpandableSection
                            title="✨ Your Top Priorities & Quick Wins"
                            icon={<Wrench className="w-5 h-5 text-emerald-600" />}
                            defaultExpanded={allSectionsExpanded}
                        >
                            {analysis.research?.topPriorities && analysis.research.topPriorities.length > 0 ? (
                                <ul className="space-y-4">
                                    {analysis.research.topPriorities.map((item: any, i: number) => (
                                        <li key={i} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-emerald-900">{item.name}</p>
                                                    <p className="text-emerald-700 text-sm mt-1"><strong>Quick Win:</strong> {item.quickWin}</p>
                                                    {item.impact && <p className="text-emerald-600 text-sm mt-1"><em>{item.impact}</em></p>}
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
                            title="👤 Your Learning Style & Psychological Profile"
                            icon={<User className="w-5 h-5 text-purple-600" />}
                            defaultExpanded={allSectionsExpanded}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(() => {
                                    try {
                                        const profile = typeof analysis.learnerProfile === 'string'
                                            ? JSON.parse(analysis.learnerProfile)
                                            : analysis.learnerProfile;

                                        return (
                                            <>
                                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                                                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">Motivation Type</p>
                                                    <p className="text-purple-900 font-bold text-lg">{profile?.motivationType || 'Unified'}</p>
                                                </div>
                                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                                                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">SRL Readiness</p>
                                                    <p className="text-purple-900 font-bold text-lg">{profile?.srlLevel || 'Moderate'}</p>
                                                </div>
                                                <div className="col-span-1 sm:col-span-2 bg-purple-50 p-4 rounded-xl border border-purple-200">
                                                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">Psychological Capital</p>
                                                    <p className="text-purple-900 font-medium italic text-lg">&quot;{profile?.psyCap || 'Ready for transformation.'}&quot;</p>
                                                </div>
                                            </>
                                        );
                                    } catch (e) {
                                        return <p className="text-gray-700">{analysis.learnerProfile}</p>;
                                    }
                                })()}
                            </div>
                        </ExpandableSection>

                        {/* 6. Consultation CTA */}
                        <ConsultationCTA />
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
