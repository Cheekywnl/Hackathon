import { AccountData } from './useAccountData'

export interface ReviewInput {
  account: AccountData | null
  video?: File | null
  transcription?: string | null
}

export interface ReviewFeedback {
  rating: number
}

// Pass account data and video, returns feedback as JSON
export function getReview(input: ReviewInput): ReviewFeedback {
  // TODO: implement actual review logic
  return { rating: 0 }
}
