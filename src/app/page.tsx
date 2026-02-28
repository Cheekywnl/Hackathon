'use client'

import Link from 'next/link'

const navigationCards = [
  {
    href: '/review',
    title: 'Review Page',
    description: 'Open the review workspace to inspect and discuss submissions.',
  },
  {
    href: '/account',
    title: 'Account Page',
    description: 'Open account settings and profile management (coming soon).',
  },
]

export default function MainPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="max-w-4xl mx-auto px-6 py-16" aria-labelledby="main-page-title">
        <h1 id="main-page-title" className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Main Page
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
          Use the widgets below to navigate to the shared pages for collaborative work.
        </p>
        <nav aria-label="Primary navigation">
          <ul className="grid gap-4 sm:grid-cols-2">
            {navigationCards.map((card) => (
              <li key={card.href}>
                <Link
                  href={card.href}
                  className="block h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                  aria-label={`Go to ${card.title}`}
                >
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{card.title}</h2>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{card.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </div>
  )
}
