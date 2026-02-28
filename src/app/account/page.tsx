'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageTabs from '@/components/page-tabs'
import { getAccountData, saveAccountData } from '@/lib/useAccountData'

export default function AccountPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [githubLink, setGithubLink] = useState('')
  const [productDescription, setProductDescription] = useState('')

  useEffect(() => {
    const data = getAccountData()
    setUserName(data.userName)
    setGithubLink(data.githubLink)
    setProductDescription(data.productDescription)
  }, [])

  function handleSave() {
    saveAccountData({ userName, githubLink, productDescription })
    router.push('/mainpage')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-6 py-10 dark:from-slate-900 dark:to-slate-800">
      <main className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hackathon V2</h1>
          <PageTabs />
        </div>

        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <h2 className="text-3xl font-semibold">Account</h2>
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">User Name</label>
              <input type="text" placeholder="Your name" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GitHub Link</label>
              <input type="url" placeholder="https://github.com/username" value={githubLink} onChange={(e) => setGithubLink(e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product Description</label>
              <textarea placeholder="Describe your product..." rows={4} value={productDescription} onChange={(e) => setProductDescription(e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-700" />
            </div>
            <button onClick={handleSave} className="mt-4 rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white">Save Details</button>
          </div>
        </section>
      </main>
    </div>
  )
}
