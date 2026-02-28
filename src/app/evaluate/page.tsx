'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'

const STARTUP_QUESTIONS = [
  "Tell us about your startup. What problem are you solving and for whom?",
  "What makes your solution unique compared to existing alternatives?",
  "Walk us through your technical architecture and key technologies.",
  "What traction or validation do you have so far?",
  "Where do you see your startup in 12 months?",
]

type Step = 'interview' | 'github' | 'submitting' | 'results'

interface EvaluationResult {
  technicalCredibility: number
  pitchClarity: number
  fundability: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  inconsistencies: string[]
  visualCues?: { eyeContactPercent?: number; smileFrequency?: string; engagementLevel?: string }
}

export default function EvaluatePage() {
  const [step, setStep] = useState<Step>('interview')
  const [selectedQuestion, setSelectedQuestion] = useState(0)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [useVideo, setUseVideo] = useState(false)
  const [githubUrl, setGithubUrl] = useState('')
  const [githubPreview, setGithubPreview] = useState<{ name: string; stars: number; forks: number; languages: string[] } | null>(null)
  const [githubLoading, setGithubLoading] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EvaluationResult | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const videoChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: useVideo ? { width: 640, height: 480 } : false,
      })
      streamRef.current = stream
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream
      if (useVideo) {
        const rec = new MediaRecorder(stream)
        videoChunksRef.current = []
        rec.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data) }
        rec.onstop = () => { if (videoChunksRef.current.length) setVideoBlob(new Blob(videoChunksRef.current, { type: 'video/webm' })) }
        rec.start(1000)
        mediaRecorderRef.current = rec
      } else {
        const rec = new MediaRecorder(stream)
        audioChunksRef.current = []
        rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
        rec.onstop = () => { if (audioChunksRef.current.length) setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' })) }
        rec.start(1000)
        mediaRecorderRef.current = rec
      }
      setRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000)
    } catch {
      setError('Could not access microphone or camera.')
    }
  }, [useVideo])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
  }, [])

  useEffect(() => {
    if (step !== 'github' || !githubUrl.includes('github.com')) { setGithubPreview(null); return }
    const t = setTimeout(async () => {
      setGithubLoading(true)
      try {
        const res = await fetch(`/api/github?url=${encodeURIComponent(githubUrl)}`)
        if (res.ok) {
          const d = await res.json()
          setGithubPreview({ name: d.name || '', stars: d.stars ?? 0, forks: d.forks ?? 0, languages: d.languages || [] })
        } else setGithubPreview(null)
      } catch { setGithubPreview(null) }
      finally { setGithubLoading(false) }
    }, 500)
    return () => clearTimeout(t)
  }, [step, githubUrl])

  const submitEvaluation = async () => {
    setError(null)
    if (!githubUrl.trim()) { setError('Please enter a GitHub repository URL.'); return }
    setStep('submitting')
    try {
      const formData = new FormData()
      if (audioBlob) formData.append('audio', audioBlob, 'audio.webm')
      if (videoBlob) formData.append('video', videoBlob, 'video.webm')
      formData.append('githubUrl', githubUrl)
      formData.append('question', STARTUP_QUESTIONS[selectedQuestion])
      if (transcript.trim()) formData.append('transcript', transcript)
      formData.append('useVideo', String(useVideo))
      const res = await fetch('/api/evaluate', { method: 'POST', body: formData })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed')
      setResult(await res.json())
      setStep('results')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Evaluation failed')
      setStep('github')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">← Back</Link>
          <span className="text-sm text-slate-500">{step === 'interview' ? 'Step 1' : step === 'github' ? 'Step 2' : step}</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        {step === 'interview' && (
          <>
            <h1 className="text-2xl font-bold mb-2">Record Your Pitch</h1>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Question</label>
              <select value={selectedQuestion} onChange={(e) => setSelectedQuestion(Number(e.target.value))} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                {STARTUP_QUESTIONS.map((q, i) => <option key={i} value={i}>{q}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input type="checkbox" checked={useVideo} onChange={(e) => setUseVideo(e.target.checked)} disabled={recording} className="rounded" />
              <span>Include webcam</span>
            </label>
            <div className="bg-white dark:bg-slate-800 rounded-xl border p-6 mb-6">
              {useVideo && <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full aspect-video bg-slate-900 rounded-lg mb-4" />}
              {!useVideo && !recording && <div className="w-full aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 mb-4">Audio only</div>}
              {!useVideo && recording && <div className="w-full aspect-video bg-slate-800 rounded-lg flex items-center justify-center text-emerald-400 mb-4">🔴 Recording...</div>}
              {error && <p className="text-red-600 mb-4">{error}</p>}
              <div className="flex items-center gap-4">
                {!recording ? <button onClick={startRecording} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg">Start</button> : <button onClick={stopRecording} className="px-6 py-2 bg-slate-700 text-white rounded-lg">Stop</button>}
                {recording && <span className="font-mono">{Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</span>}
              </div>
              {(audioBlob || videoBlob) && <p className="mt-4 text-emerald-600">✓ Recording ready</p>}
            </div>
            <button onClick={() => setStep('github')} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
              {(audioBlob || videoBlob) ? 'Continue to GitHub →' : 'Skip to GitHub (paste transcript) →'}
            </button>
          </>
        )}
        {step === 'github' && (
          <>
            <h1 className="text-2xl font-bold mb-2">GitHub Repository</h1>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Repository URL</label>
              <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username/repo" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
            </div>
            {githubLoading && <p className="text-sm text-slate-500 mb-4">Loading...</p>}
            {githubPreview && !githubLoading && (
              <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-sm">
                <p className="font-medium">{githubPreview.name}</p>
                <p className="text-slate-600">★ {githubPreview.stars} · Forks: {githubPreview.forks} · {githubPreview.languages.join(', ')}</p>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Transcript (optional – paste if you skipped recording)</label>
              <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste your transcript here..." rows={4} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
            </div>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <div className="flex gap-4">
              <button onClick={() => setStep('interview')} className="px-4 py-2 text-slate-600">← Back</button>
              <button onClick={submitEvaluation} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg">Evaluate My Startup</button>
            </div>
          </>
        )}
        {step === 'submitting' && (
          <div className="text-center py-16">
            <div className="inline-block w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-lg text-slate-600">Analyzing your pitch...</p>
          </div>
        )}
        {step === 'results' && result && (
          <div className="space-y-8">
            <h1 className="text-2xl font-bold">Results</h1>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border p-4"><p className="text-sm text-slate-500">Technical Credibility</p><p className="text-2xl font-bold text-emerald-600">{result.technicalCredibility}/10</p></div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border p-4"><p className="text-sm text-slate-500">Pitch Clarity</p><p className="text-2xl font-bold text-emerald-600">{result.pitchClarity}/10</p></div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border p-4"><p className="text-sm text-slate-500">Fundability</p><p className="text-2xl font-bold text-emerald-600">{result.fundability}/100</p></div>
            </div>
            {result.visualCues && <div className="bg-white dark:bg-slate-800 rounded-xl border p-6"><h2 className="font-semibold mb-2">Visual Cues</h2><p>Eye contact: {result.visualCues.eyeContactPercent}% · {result.visualCues.engagementLevel}</p></div>}
            <div className="rounded-xl border p-6"><h2 className="font-semibold mb-3">Strengths</h2><ul className="list-disc list-inside">{result.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
            <div className="rounded-xl border p-6"><h2 className="font-semibold mb-3">Weaknesses</h2><ul className="list-disc list-inside">{result.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
            {result.inconsistencies?.length > 0 && <div className="rounded-xl border border-amber-500 p-6 bg-amber-50/50"><h2 className="font-semibold mb-3">Inconsistencies</h2><ul className="list-disc list-inside">{result.inconsistencies.map((i, idx) => <li key={idx}>{i}</li>)}</ul></div>}
            <div className="rounded-xl border p-6"><h2 className="font-semibold mb-3">Suggestions</h2><ul className="list-disc list-inside">{result.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
            <button onClick={async () => { const r = await fetch('/api/report-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) }); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'report.pdf'; a.click(); URL.revokeObjectURL(u); }} className="px-6 py-3 bg-slate-700 text-white rounded-lg">Download PDF Report</button>
          </div>
        )}
      </main>
    </div>
  )
}
