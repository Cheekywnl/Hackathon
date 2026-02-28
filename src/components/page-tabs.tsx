'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/mainpage', label: 'Main Page' },
  { href: '/account', label: 'Account' },
  { href: '/history', label: 'History' },
]

export default function PageTabs() {
  const pathname = usePathname()

  return (
    <nav aria-label="Hackathon V2 pages">
      <ul className="flex flex-wrap gap-3">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`inline-flex rounded-lg border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isActive
                    ? 'border-emerald-700 bg-emerald-700 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-slate-900'
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
