'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function GitHubPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/evaluate') }, [router])
  return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" /></div>
}
