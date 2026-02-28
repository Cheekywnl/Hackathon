'use client'

import { useEffect, useState } from 'react'
import { getAccountData, AccountData } from '@/lib/useAccountData'
import { getReview, ReviewFeedback } from '@/lib/reviewService'
import { addToHistory } from '@/lib/historyService'

export default function AssessmentPage() {
  const [account, setAccount] = useState<AccountData | null>(null)
  const [feedback, setFeedback] = useState<ReviewFeedback | null>(null)

  useEffect(() => {
    setAccount(getAccountData())
  }, [])

  function handleReview() {
    const result = getReview({ account })
    setFeedback(result)
    addToHistory(result)
  }

  return (
    <div>
      <h1>Assessment Page</h1>
      <button onClick={handleReview}>Get Review</button>

      {feedback && (
        <div>
          <p>Rating: {feedback.rating}</p>
          {feedback.rating > 4 ? (
            <p>This has been passed to investors.</p>
          ) : (
            <p>This has not passed. Please refer to the improvement page for more details.</p>
          )}
        </div>
      )}
    </div>
  )
}