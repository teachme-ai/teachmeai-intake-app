'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, ReactNode } from 'react';

interface ExpandableSectionProps {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    defaultExpanded?: boolean;
    isExpanded?: boolean;  // External control (optional)
    onToggle?: () => void;  // External toggle handler (optional)
}

export default function ExpandableSection({
    title,
    icon,
    children,
    defaultExpanded = false,
    isExpanded: externalIsExpanded,
    onToggle
}: ExpandableSectionProps) {
    const [internalIsExpanded, setInternalIsExpanded] = useState(defaultExpanded);

    // Use external state if provided, otherwise use internal state
    const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;

    const handleToggle = () => {
        if (onToggle) {
            onToggle();  // Use external handler if provided
        } else {
            setInternalIsExpanded(!internalIsExpanded);  // Fall back to internal state
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Header (Always Visible) */}
            <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors duration-150"
                aria-expanded={isExpanded}
            >
                <div className="flex items-center gap-3">
                    {icon && <div className="flex-shrink-0">{icon}</div>}
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                </div>
                <div className="flex-shrink-0 ml-4">
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-600" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                </div>
            </button>

            {/* Collapsible Content */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                    {children}
                </div>
            </div>
        </div>
    );
}
