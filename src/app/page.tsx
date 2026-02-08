import IntakeForm from '@/components/IntakeForm';
import InterviewChat from '@/components/InterviewChat';
import { verifyIntakeToken } from '@/lib/jwt';
import { initializeState } from '@/intake/state';
import { randomUUID } from 'crypto';

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const token = typeof searchParams.token === 'string' ? searchParams.token : undefined;
  const prefilledData = token ? await verifyIntakeToken(token) : null;

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
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {prefilledData?.name && (
            <div className="mb-4 inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
              Welcome back, {prefilledData.name}! 👋
            </div>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to TeachMeAI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {INTAKE_MODE === 'chat'
              ? "Let's build your personalized learning path together."
              : "This intake helps us design a personalized learning pathway for you."}
          </p>
        </div>

        {/* Content Area */}
        {INTAKE_MODE === 'chat' && initialState ? (
          <InterviewChat initialState={initialState} />
        ) : (
          <IntakeForm initialData={prefilledData || undefined} />
        )}
      </div>
    </main>
  )
}
