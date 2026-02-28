import { ReviewFeedback } from './reviewService'

export interface HistoryEntry {
  feedback: ReviewFeedback
  timestamp: string
}

const STORAGE_KEY = 'feedbackHistory'
const LATEST_FEEDBACK_KEY = 'latestFeedback'

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  return JSON.parse(stored)
}

export function addToHistory(feedback: ReviewFeedback): void {
  const history = getHistory()
  history.push({
    feedback,
    timestamp: new Date().toISOString(),
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  localStorage.setItem(LATEST_FEEDBACK_KEY, JSON.stringify(feedback))
}

export function getLatestFeedback(): ReviewFeedback | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(LATEST_FEEDBACK_KEY)
  if (!stored) return null
  return JSON.parse(stored)
}
