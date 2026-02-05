import IntakeForm from '@/components/IntakeForm';
import InterviewChat from '@/components/InterviewChat';
import { verifyToken } from '@/lib/jwt';
import { initializeState } from '@/intake/state';
import { randomUUID } from 'crypto';

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const token = typeof searchParams.token === 'string' ? searchParams.token : undefined;
  const prefilledData = token ? await verifyToken(token) : null;

  // FEATURE FLAG: Switch to 'false' to rollback to static form
  const INTAKE_MODE: 'static' | 'chat' = 'chat';

  // If in chat mode, we need to bootstrap the state server-side (or client side via API)
  // For better UX (faster load), let's bootstrap here if we can
  let initialState = null;
  if (INTAKE_MODE === 'chat') {
    initialState = initializeState(randomUUID(), {
      name: prefilledData?.name,
      email: prefilledData?.email,
      role: prefilledData?.role,
      goal: prefilledData?.goal
    });
  }

  return (
    <main className="h-screen w-screen bg-[#FDFBF7] overflow-hidden flex flex-col">
      <div className="w-full h-full flex flex-col p-2 lg:p-4 pb-2 lg:pb-4">
        {/* Header - Minimal and Compact */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl mb-4 border border-white/40 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter">
              TeachMeAI <span className="text-blue-600">Consultation</span>
            </h1>
            {prefilledData?.name && (
              <div className="px-3 py-1 bg-blue-100/80 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-blue-200">
                L: {prefilledData.name}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Status</span>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Pipeline
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic height content area - Absolute Full Height Fill */}
        <div className="flex-1 min-h-0 relative z-10 w-full overflow-hidden flex flex-col mb-2 lg:mb-4">
          {INTAKE_MODE === 'chat' && initialState ? (
            <InterviewChat initialState={initialState} />
          ) : (
            <div className="w-full h-full bg-white rounded-t-[2.5rem] shadow-2xl border-x border-t border-gray-100 overflow-hidden">
              <div className="h-full overflow-y-auto p-10">
                <IntakeForm initialData={prefilledData || undefined} />
              </div>
            </div>
          )}
        </div>

        {/* Simple Minimal Footer */}
        <div className="flex items-center justify-center py-2 flex-shrink-0">
          <p className="text-[var(--font-size-xs)] font-black text-slate-400 uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity cursor-default">
            teachmeai.in
          </p>
        </div>
      </div>
    </main>
  );
}
