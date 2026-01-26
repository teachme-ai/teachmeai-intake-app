import IntakeForm from '@/components/IntakeForm'
import { verifyToken } from '@/lib/jwt'

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const token = typeof searchParams.token === 'string' ? searchParams.token : undefined
  const prefilledData = token ? await verifyToken(token) : null

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {prefilledData?.name && (
            <div className="mb-4 inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
              Welcome back, {prefilledData.name}! 👋
            </div>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to TeachMeAI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            This intake helps us design a personalized learning pathway for you.
            Your responses will be analyzed using AI to create a tailored IMPACT-framed interaction.
          </p>
        </div>

        {/* Intake Form */}
        <IntakeForm initialData={prefilledData || undefined} />

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
