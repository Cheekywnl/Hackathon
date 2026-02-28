'use client'

import { useEffect, useState } from 'react'
import PageTabs from '@/components/page-tabs'
import { getHistory, HistoryEntry } from '@/lib/historyService'

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-6 py-10 dark:from-slate-900 dark:to-slate-800">
      <main className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hackathon V2</h1>
          <PageTabs />
        </div>

        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <h2 className="text-3xl font-semibold">History</h2>
          {history.length === 0 ? (
            <p className="mt-3 text-slate-600 dark:text-slate-300">No assessments yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {history.map((entry, index) => (
                <li key={index} className="rounded-lg border border-slate-200 p-4 dark:border-slate-600">
                  <p>Rating: {entry.feedback.rating}</p>
                  <p className="text-sm text-slate-500">{new Date(entry.timestamp).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
