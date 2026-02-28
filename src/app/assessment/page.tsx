'use client'

import Link from 'next/link'
import { useRecordWebcam } from 'react-record-webcam'
import PageTabs from '@/components/page-tabs'
import { useState, useEffect } from 'react'
import { getReview, ReviewFeedback } from '@/lib/reviewService'
import { addToHistory } from '@/lib/historyService'
import { getAccountData, AccountData } from '@/lib/useAccountData'

type Step = 'ready' | 'preview' | 'recording' | 'complete' | 'transcribed'

export default function AssessmentPage() {
  const [step, setStep] = useState<Step>('ready')
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [transcription, setTranscription] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [recordError, setRecordError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<ReviewFeedback | null>(null)
  const [account, setAccount] = useState<AccountData | null>(null)

  // Load account data on mount
  useEffect(() => {
    setAccount(getAccountData())
  }, [])

  const {
    createRecording,
    openCamera,
    startRecording,
    stopRecording,
    clearAllRecordings,
    activeRecordings,
    errorMessage,
    clearError,
  } = useRecordWebcam()

  const recording = recordingId ? activeRecordings.find((r) => r.id === recordingId) : null

  // Force webcam video to play when stream is ready (helps with "can't see myself" issue)
  // Only set up once to avoid flashing
  useEffect(() => {
    if ((step === 'preview' || step === 'recording') && recording?.webcamRef.current) {
      const video = recording.webcamRef.current
      const stream = video.srcObject as MediaStream | null
      // Only play if stream exists and video is paused - don't reassign srcObject
      if (stream instanceof MediaStream && stream.active && video.paused) {
        video.play().catch(() => {})
      }
    }
  }, [step, recording])

  const handleOpenCamera = async () => {
    clearError()
    const rec = await createRecording()
    if (!rec) return
    setRecordingId(rec.id)
    setStep('preview')
  }

  // openCamera must run AFTER the video element is mounted (library requirement)
  useEffect(() => {
    if (step === 'preview' && recordingId) {
      openCamera(recordingId).catch(() => {})
    }
  }, [step, recordingId, openCamera])

  const handleStartRecording = async () => {
    if (!recordingId || !recording) return
    setRecordError(null)
    clearError()
    // Ensure stream is ready before starting (fixes MediaRecorder "Argument 1 is not valid" error)
    const waitForStream = (): Promise<MediaStream> =>
      new Promise((resolve, reject) => {
        let attempts = 0
        const maxAttempts = 200
        const check = () => {
          const stream = recording.webcamRef.current?.srcObject
          if (stream instanceof MediaStream) {
            resolve(stream)
            return
          }
          attempts++
          if (attempts > maxAttempts) {
            reject(new Error('Camera not ready. Wait for the video to appear, then click Start Recording.'))
            return
          }
          setTimeout(check, 100)
        }
        setTimeout(check, 500)
      })
    try {
      await waitForStream()
      await startRecording(recordingId)
      setStep('recording')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start recording'
      setRecordError(msg)
    }
  }

  const handleStopRecording = async () => {
    if (!recordingId) return
    setIsStopping(true)
    clearError()
    try {
      const stopped = await stopRecording(recordingId)
      setStep('complete')
      // Auto-transcribe when recording stops (user sees transcript right away)
      if (stopped?.blob) {
        setIsSubmitting(true)
        setSubmitError(null)
        try {
          const formData = new FormData()
          formData.append('file', stopped.blob, 'recording.webm')
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
          const data = await res.json()
          if (res.ok) {
            setTranscription(data.text)
            setStep('transcribed')
            const reviewResult = getReview({
              account,
              transcription: data.text
            })
            setFeedback(reviewResult)
            addToHistory(reviewResult)
          } else {
            setSubmitError(data.error || 'Transcription failed')
          }
        } catch {
          setSubmitError('Transcription failed')
        } finally {
          setIsSubmitting(false)
        }
      }
    } catch {
      // Error surfaced via errorMessage from hook
    } finally {
      setIsStopping(false)
    }
  }

  const handleReset = () => {
    // Reset state immediately (before async cleanup)
    setStep('ready')
    setRecordingId(null)
    setTranscription(null)
    setSubmitError(null)
    setFeedback(null)
    setRecordError(null)
    clearError()

    // Cleanup recordings in background
    clearAllRecordings().catch(() => {})
  }

  const handleSubmit = async () => {
    if (!recording?.blob) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const formData = new FormData()
      formData.append('file', recording.blob, 'recording.webm')

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Transcription failed')
      }

      setTranscription(data.text)
      setStep('transcribed')
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Transcription failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hackathon V2</h1>
          <PageTabs />
        </div>

        <section className="flex flex-1 flex-col items-center justify-center">
          <h2 className="mb-6 text-3xl font-bold text-slate-900 dark:text-white">
            Pitch Assessment
          </h2>

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              {errorMessage}
            </div>
          )}

          {step === 'ready' && (
            <div className="flex flex-col items-center gap-6 text-center">
              <p className="max-w-xl text-slate-600 dark:text-slate-300">
                Record your startup pitch. You&apos;ll get AI-powered feedback on technical
                credibility, clarity, and fundability.
              </p>
              <button
                type="button"
                onClick={handleOpenCamera}
                className="rounded-lg bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Open Camera & Start
              </button>
              <Link
                href="/mainpage"
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ← Back to Main Page
              </Link>
            </div>
          )}

          {(step === 'preview' || step === 'recording') && recording && (
            <div className="flex w-full max-w-2xl flex-col items-center gap-6">
              {recordError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                  {recordError}
                </div>
              )}
              <div className="relative w-full overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-900 shadow-xl dark:border-slate-700" style={{ minHeight: 360 }}>
                <video
                  ref={recording.webcamRef}
                  autoPlay
                  muted
                  playsInline
                  className="aspect-video w-full min-h-[360px] object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  aria-label="Live camera preview"
                  onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
                />
                {step === 'recording' && (
                  <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-sm font-medium text-white">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    Recording
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                {step === 'preview' && (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="rounded-lg bg-red-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-red-700"
                  >
                    Start Recording
                  </button>
                )}
                {step === 'recording' && (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    disabled={isStopping}
                    className="rounded-lg bg-slate-700 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                  >
                    {isStopping ? 'Stopping…' : 'Stop Recording'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-slate-300 px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === 'complete' && recording && (
            <div className="flex w-full max-w-2xl flex-col items-center gap-6">
              <p className="text-slate-600 dark:text-slate-300">
                {isSubmitting ? 'Transcribing your pitch…' : 'Your recording is ready.'}
              </p>
              <div className="w-full overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-900 shadow-xl dark:border-slate-700">
                <video
                  ref={recording.previewRef}
                  autoPlay
                  loop
                  playsInline
                  controls
                  className="aspect-video w-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  aria-label="Recording preview"
                />
              </div>
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                  {submitError}
                </div>
              )}
              <div className="flex gap-4">
                {!isSubmitting && !transcription && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-lg bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    Get Transcript
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-slate-300 px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Record Again
                </button>
                <Link
                  href="/mainpage"
                  className="rounded-lg border border-slate-300 px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Back to Main
                </Link>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Transcript is generated automatically. Use Get Transcript if it didn&apos;t start.
              </p>
            </div>
          )}

          {step === 'transcribed' && transcription !== null && (
            <div className="flex w-full max-w-2xl flex-col gap-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Transcription
              </h3>
              {recording && (
                <div className="w-full">
                  <h4 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    Watch back
                  </h4>
                  <div className="overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-900 shadow-xl dark:border-slate-700">
                    <video
                      ref={recording.previewRef}
                      controls
                      playsInline
                      className="aspect-video w-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                      aria-label="Recording playback"
                    />
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <p className="whitespace-pre-wrap">
                  {transcription || 'No speech detected in recording.'}
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  Record Another
                </button>
                <Link
                  href="/mainpage"
                  className="rounded-lg border border-slate-300 px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Back to Main
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

