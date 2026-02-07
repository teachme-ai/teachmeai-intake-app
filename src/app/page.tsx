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

        {/* Admin Link */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500 mb-2">Administrator Access</p>
          <a
            href="/admin"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            📊 View Submissions Dashboard
          </a>
        </div>
      </div>
    </main>
  )
}
