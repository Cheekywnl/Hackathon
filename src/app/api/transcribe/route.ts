import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const body = new FormData()
    body.append('file', file, 'recording.webm')
    body.append('model', 'whisper-1')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json(
        { error: err || 'Transcription failed' },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json({ text: result.text })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Transcription failed' },
      { status: 500 }
    )
  }
}
