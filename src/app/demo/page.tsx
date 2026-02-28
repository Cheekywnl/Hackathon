'use client'

import { useState } from 'react'
import Link from 'next/link'

const DEMO_GITHUB = 'https://github.com/vercel/next.js'
const DEMO_TRANSCRIPT = `We're building a modern web framework that makes it easy to build fast, scalable applications. Our solution combines server-side rendering with client-side hydration. We use React under the hood and have a strong ecosystem with thousands of contributors. We've seen massive adoption with over 100,000 GitHub stars.`

export default function DemoPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runDemo = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo: true, transcript: DEMO_TRANSCRIPT, githubUrl: DEMO_GITHUB, question: 'Tell us about your startup.' }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed')
      setResult(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Demo failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b bg-white dark:bg-slate-800 px-6 py-4">
        <Link href="/" className="text-emerald-600 font-medium">← Back</Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">Demo Mode</h1>
        <p className="text-slate-600 mb-8">Test with placeholder data. No recording needed.</p>
        <div className="bg-white dark:bg-slate-800 rounded-xl border p-6 mb-8">
          <p className="text-sm text-slate-500 mb-2">GitHub: {DEMO_GITHUB}</p>
          <p className="text-sm italic">{DEMO_TRANSCRIPT.slice(0, 150)}...</p>
        </div>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <button onClick={runDemo} disabled={loading} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg">
          {loading ? 'Evaluating...' : 'Run Demo'}
        </button>
        {result && (
          <div className="mt-12 space-y-6">
            <h2 className="text-xl font-bold">Results</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="border p-4 rounded-lg"><p className="text-sm text-slate-500">Technical</p><p className="text-2xl font-bold text-emerald-600">{(result as any).technicalCredibility}/10</p></div>
              <div className="border p-4 rounded-lg"><p className="text-sm text-slate-500">Pitch</p><p className="text-2xl font-bold text-emerald-600">{(result as any).pitchClarity}/10</p></div>
              <div className="border p-4 rounded-lg"><p className="text-sm text-slate-500">Fundability</p><p className="text-2xl font-bold text-emerald-600">{(result as any).fundability}/100</p></div>
            </div>
            {(result as any).strengths?.length > 0 && <div><h3 className="font-semibold mb-2">Strengths</h3><ul className="list-disc list-inside">{(result as any).strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></div>}
            {(result as any).suggestions?.length > 0 && <div><h3 className="font-semibold mb-2">Suggestions</h3><ul className="list-disc list-inside">{(result as any).suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></div>}
          </div>
        )}
      </main>
    </div>
  )
}
