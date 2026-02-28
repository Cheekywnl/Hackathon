import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hackathon – AI Startup Interview Evaluator',
  description: 'AI-powered startup pitch evaluation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
