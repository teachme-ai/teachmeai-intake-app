import IntakeForm from '@/components/IntakeForm'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to TeachMeAI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            This intake helps us design a personalized learning pathway for you. 
            Your responses will be analyzed using AI to create a tailored IMPACT-framed interaction.
          </p>
        </div>

        {/* Intake Form */}
        <IntakeForm />
      </div>
    </main>
  )
}
