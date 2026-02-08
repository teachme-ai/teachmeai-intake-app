'use client';

import { User, CheckCircle } from 'lucide-react';

interface ResultsHeaderProps {
    userName: string;
    userRole: string;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    allExpanded: boolean;
}

export default function ResultsHeader({
    userName,
    userRole,
    onExpandAll,
    onCollapseAll,
    allExpanded
}: ResultsHeaderProps) {
    return (
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-8 mb-6 shadow-sm">
            {/* Completion Badge */}
            <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold">
                    <CheckCircle className="w-4 h-4" />
                    Profile Complete
                </div>
            </div>

            {/* User Info */}
            <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-600" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">{userName}&apos;s AI Learning Profile</h1>
                <p className="text-indigo-600 font-semibold">{userRole}</p>
            </div>

            {/* Expand/Collapse Toggle */}
            <div className="flex justify-center">
                <button
                    onClick={allExpanded ? onCollapseAll : onExpandAll}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2 transition-colors"
                >
                    {allExpanded ? 'Collapse All Sections' : 'Expand All Sections'}
                </button>
            </div>
        </div>
    );
}
