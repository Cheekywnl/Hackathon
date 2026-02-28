export interface AccountData {
  userName: string
  githubLink: string
  productDescription: string
}

const STORAGE_KEY = 'accountData'

export function getAccountData(): AccountData {
  if (typeof window === 'undefined') {
    return { userName: '', githubLink: '', productDescription: '' }
  }
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return { userName: '', githubLink: '', productDescription: '' }
  }
  return JSON.parse(stored)
}

export function saveAccountData(data: AccountData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
