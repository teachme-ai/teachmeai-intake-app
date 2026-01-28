import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TeachMeAI Intake App',
  description: 'Interactive learner intake app with AI personalization and Google Sheets integration',
  keywords: ['learning', 'AI', 'mentoring', 'intake', 'personalization'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          {children}
        </div>
      </body>
    </html>
  )
}
// Forced redeploy at Wed Jan 28 21:15:26 IST 2026
