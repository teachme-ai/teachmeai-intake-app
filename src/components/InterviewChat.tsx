'use client';

import { useState, useEffect, useRef } from 'react';
import { IntakeState, IntakeData } from '@/intake/schema';
import { Loader2, Send, User, Bot, CheckCircle2 } from 'lucide-react';

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
            const nextState: IntakeState = data.state;
            const assistantMsgContent = data.message;

            setState(nextState);

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

    useEffect(() => {
        if (state.isComplete && !analysis && !isAnalyzing) {
            triggerFinalAnalysis();
        }
    }, [state.isComplete]);

    const triggerFinalAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/submit-chat-intake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state, messages })
            });
            if (!response.ok) throw new Error('Analysis failed');
            const data = await response.json();
            setAnalysis(data.analysis);
        } catch (error) {
            console.error('Final analysis error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

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
                    <div className="space-y-6 mt-4 w-full">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <h3 className="font-bold text-blue-900 mb-2 whitespace-pre-wrap">Targeted Strategy</h3>
                            <p className="text-sm text-blue-800 leading-relaxed">{analysis.Identify}</p>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                            <h3 className="font-bold text-green-900 mb-2">Detailed Plan</h3>
                            <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">{analysis.Plan}</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                            <h3 className="font-bold text-purple-900 mb-2">Next Steps</h3>
                            <ul className="list-disc list-inside text-sm text-purple-800 space-y-1">
                                {analysis.nextSteps?.map((step: string, i: number) => (
                                    <li key={i}>{step}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="text-red-500 text-center py-4">
                        Something went wrong during analysis. Please try again.
                    </div>
                )}
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
