'use client';

import { Calendar, Send } from 'lucide-react';

interface ConsultationCTAProps {
    onTrack?: () => void;
}

export default function ConsultationCTA({ onTrack }: ConsultationCTAProps) {
    const handleClick = () => {
        // Track analytics event
        if (onTrack) {
            onTrack();
        }
        // Optional: Add analytics here
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'consultation_cta_clicked', {
                event_category: 'engagement',
                event_label: 'Results Page CTA'
            });
        }
    };

    return (
        <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl p-10 text-white text-center shadow-2xl shadow-red-500/40 border-4 border-white">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-3xl font-black mb-4 text-white drop-shadow-lg flex items-center justify-center gap-2">
                    🎯 Ready to Turn This Into Action?
                </h3>
                <p className="text-white text-lg mb-8 max-w-lg mx-auto leading-relaxed font-semibold">
                    If you like what you see, let&apos;s build a tailored learning plan and pathways specifically for you to learn AI that&apos;s relevant for you now.
                </p>
                <a
                    href="https://topmate.io/khalidirfan/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleClick}
                    className="inline-flex items-center gap-3 bg-white text-red-600 font-black text-lg px-10 py-5 rounded-2xl hover:bg-yellow-50 hover:scale-105 transition-all active:scale-95 shadow-2xl hover:shadow-yellow-500/50 border-4 border-yellow-400"
                >
                    <Calendar className="w-6 h-6" />
                    Book a 70-Minute Strategy Call with Irfan
                    <Send className="w-5 h-5" />
                </a>
                <p className="text-white text-sm mt-6 font-bold uppercase tracking-wider bg-black/20 rounded-full px-6 py-2 inline-block">
                    ✨ Let&apos;s create your personalized AI learning roadmap
                </p>
            </div>
        </div>
    );
}
