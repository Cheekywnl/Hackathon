'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Hackathon – AI Startup Interview Evaluator
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
          Get AI-powered feedback on your startup pitch. Record your answer, share your GitHub, and receive scores for technical credibility, pitch clarity, and fundability.
        </p>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold mb-4">How it works</h2>
          <ol className="space-y-3 text-slate-600 dark:text-slate-300 list-decimal list-inside">
            <li><strong>Record your pitch</strong> – Answer a startup question</li>
            <li><strong>Share your GitHub</strong> – Paste your repository link</li>
            <li><strong>Get evaluated</strong> – AI compares your pitch against your code</li>
          </ol>
        </div>
        <div className="flex gap-4 flex-wrap">
          <Link href="/evaluate" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">
            Start Interview →
          </Link>
          <Link href="/demo" className="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-medium rounded-lg transition-colors">
            Try Demo Mode
          </Link>
        </div>
      </main>
    </div>
  )
}
