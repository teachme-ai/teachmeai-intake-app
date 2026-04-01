'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IntakeState, IntakeData } from '@/intake/schema';
import { Loader2, Send, User, Bot, CheckCircle2, Sparkles, Target, Lightbulb, TrendingUp, Wrench, Zap, Brain, Shield } from 'lucide-react';
import ExpandableSection from './ExpandableSection';
import ResultsHeader from './ResultsHeader';
import ConsultationCTA from './ConsultationCTA';
import VisualInsights from './VisualInsights';
import FullPageReport from './FullPageReport';

interface InterviewChatProps {
    initialState: IntakeState;
    leadId?: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function InterviewChat({ initialState, leadId }: InterviewChatProps) {
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

    // Handle Lead Resolution from Handover
    useEffect(() => {
        const resolveLead = async () => {
            if (!leadId || state.fields.email?.value) return;

            try {
                const res = await fetch(`/api/leads/${leadId}`);
                if (!res.ok) return;
                const leadData = await res.json();

                setState(prev => ({
                    ...prev,
                    fields: {
                        ...prev.fields,
                        name: { value: leadData.name, status: 'confirmed', confidence: 'high', updatedAt: new Date().toISOString(), evidence: 'lead_handover' },
                        email: { value: leadData.email, status: 'confirmed', confidence: 'high', updatedAt: new Date().toISOString(), evidence: 'lead_handover' },
                        role_raw: { value: leadData.persona_id, status: 'candidate', confidence: 'medium', updatedAt: new Date().toISOString(), evidence: 'lead_handover' }
                    }
                }));

                // Add a welcome message from the assistant
                setMessages(prev => [...prev, {
                    id: `handoff-${Date.now()}`,
                    role: 'assistant',
                    content: `Welcome back, ${leadData.name}! I've got your info from the quiz. Let's pick up where we left off to build your custom AI plan.`,
                    timestamp: new Date()
                }]);

            } catch (e) {
                console.error('Lead resolution failed', e);
            }
        };
        resolveLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leadId]); // Exclude state.fields.email?.value otherwise it cycles on update

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

            // 1. Add the regular bot response (e.g. "Great! Now tell me about...")
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantMsgContent,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);

            if (nextState.isComplete) {
                // 2. Add the completion message after a small delay to make it feel like a follow-up
                setTimeout(() => {
                    const preparationMsg: Message = {
                        id: (Date.now() + 2).toString(),
                        role: 'assistant',
                        content: "🎯 Analysis is done - your results are coming up in a few seconds - do not go away!",
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, preparationMsg]);
                }, 1000);

                // 3. Delay setting the 'complete' state to let messages land before loader appears
                setTimeout(() => {
                    setState(nextState);
                }, 2500);
            } else {
                setState(nextState);
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
    const [enrichedData, setEnrichedData] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        strategy: false,
        opportunities: false,
        plan: false,
        priorities: false,
        profile: false
    });

    const isAllExpanded = Object.values(expandedSections).every(Boolean);
    const isAnyExpanded = Object.values(expandedSections).some(Boolean);

    const toggleAllSections = (expand: boolean) => {
        setExpandedSections({
            strategy: expand,
            opportunities: expand,
            plan: expand,
            priorities: expand,
            profile: expand
        });
    };

    const triggerFinalAnalysis = useCallback(async () => {
        if (isAnalyzing || analysis || error) return;
        setIsAnalyzing(true);
        setError(null);
        try {
            // Directly hit Cloud Run to avoid Vercel's 10-60s Serverless timeout limits.
            // supervisorFlow takes ~68s which crashes Vercel API routes.
            const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_SERVICE_URL || 'https://agent-service-584680412286.us-central1.run.app';
            const response = await fetch(`${AGENT_URL}/supervisorFlow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: state, sessionId: state.sessionId, intakeState: state })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            setAnalysis(data.result);
            setEnrichedData(state.fields);
        } catch (err: any) {
            console.error('Final analysis error:', err);
            setError(err.message || 'Failed to generate your personalized report. Please try again or contact support.');
        } finally {
            setIsAnalyzing(false);
        }
    }, [state, analysis, isAnalyzing, error]);

    useEffect(() => {
        if (state.isComplete && !analysis && !isAnalyzing && !error) {
            triggerFinalAnalysis();
        }
    }, [state.isComplete, analysis, isAnalyzing, error, triggerFinalAnalysis]);

    if (state.isComplete && (analysis || error)) {
        if (isAnalyzing) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-left animate-in fade-in zoom-in duration-500 max-w-4xl mx-auto h-[600px]">
                    <div className="flex flex-col items-center gap-4 py-8">
                        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                        <div className="text-center">
                            <p className="font-semibold text-gray-800">Orchestrating AI Agents...</p>
                            <p className="text-sm text-gray-500">Profiler, Strategist, and Tactician are building your plan.</p>
                        </div>
                    </div>
                </div>
            )
        }
        if (error) {
            return (
               <div className="flex flex-col items-center justify-center p-8 text-left max-w-4xl mx-auto h-[600px]">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-6 mt-8 w-full text-center">
                        <p className="text-red-700 font-medium mb-4">{error}</p>
                        <button
                            onClick={() => { setError(null); triggerFinalAnalysis(); }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                        >
                            Retry Analysis
                        </button>
                    </div>
                </div>
            )
        }
        return <FullPageReport data={enrichedData} analysis={analysis} />;
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

                {(isTyping || isAnalyzing) && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                            {isAnalyzing ? <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" /> : <Bot className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div className={`
                            bg-white border border-gray-100 rounded-2xl p-4 rounded-tl-none shadow-sm flex flex-col gap-2 
                            ${isAnalyzing ? 'border-indigo-100 bg-indigo-50/30' : ''}
                        `}>
                            {isAnalyzing ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                        <span className="font-bold text-indigo-900 text-xs uppercase tracking-wider">Orchestrating AI Agents</span>
                                    </div>
                                    <p className="text-xs text-indigo-700 leading-tight">Profiler, Strategist, and Tactician are building your plan...</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            )}
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
                        placeholder={isAnalyzing ? "Preparing your results..." : "Type your answer..."}
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400 disabled:bg-white disabled:cursor-not-allowed"
                        autoFocus
                        disabled={isAnalyzing}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isTyping || isAnalyzing}
                        className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center"
                    >
                        {isTyping || isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
