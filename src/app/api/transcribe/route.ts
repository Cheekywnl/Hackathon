import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    const t = await openai.audio.transcriptions.create({ file, model: 'whisper-1' })
    return NextResponse.json({ transcript: t.text })
  } catch (e) {
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
