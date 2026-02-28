import Link from 'next/link'
import PageTabs from '@/components/page-tabs'

export default function MainPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hackathon V2</h1>
          <PageTabs />
        </div>

        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="mb-3 text-4xl font-bold text-slate-900 dark:text-white">Main Page</h2>
          <p className="mb-8 max-w-xl text-slate-600 dark:text-slate-300">
            Starter page for your team. Keep this structure and add your own features when you are ready.
          </p>
          <Link
            href="/assessment"
            className="rounded-lg bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Start Assessment
          </Link>
        </section>
      </main>
    </div>
  )
}
