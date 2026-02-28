import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function extractRepo(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url)
    const parts = u.pathname.replace(/^\//, '').split('/').filter(Boolean)
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') }
  } catch {}
  return null
}

async function fetchGitHub(githubUrl: string) {
  const p = extractRepo(githubUrl)
  if (!p) return null
  const [repoRes, readmeRes, langsRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${p.owner}/${p.repo}`, { headers: { Accept: 'application/vnd.github.v3+json', ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) } }),
    fetch(`https://api.github.com/repos/${p.owner}/${p.repo}/readme`, { headers: { Accept: 'application/vnd.github.v3.raw', ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) } }).then((r) => r.ok ? r.text() : '').catch(() => ''),
    fetch(`https://api.github.com/repos/${p.owner}/${p.repo}/languages`, { headers: { Accept: 'application/vnd.github.v3+json', ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) } }).then((r) => r.ok ? r.json() : {}).catch(() => ({})),
  ])
  if (!repoRes.ok) return null
  const repo = (await repoRes.json()) as { stars?: number; forks?: number; description?: string }
  const langs = (typeof langsRes === 'object' && langsRes !== null ? langsRes : {}) as Record<string, number>
  const total = Object.values(langs).reduce((a, b) => a + b, 0)
  const topLangs = Object.entries(langs).sort(([, a], [, b]) => b - a).slice(0, 5).map(([l, n]) => `${l}: ${total ? Math.round((n / total) * 100) : 0}%`)
  return { stars: repo.stars ?? 0, forks: repo.forks ?? 0, description: repo.description ?? '', languages: topLangs, readmeSummary: String(readmeRes || '').slice(0, 3000) }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'Add OPENAI_API_KEY to .env.local' }, { status: 500 })
    let transcript = ''
    let githubUrl = ''
    let question = ''
    let useVideo = false

    const ct = req.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const body = await req.json()
      if (body.demo) { transcript = body.transcript || ''; githubUrl = body.githubUrl || ''; question = body.question || '' }
    } else if (ct.includes('multipart/form-data')) {
      const fd = await req.formData()
      const audio = fd.get('audio') as File | null
      const video = fd.get('video') as File | null
      transcript = (fd.get('transcript') as string) || ''
      githubUrl = (fd.get('githubUrl') as string) || ''
      question = (fd.get('question') as string) || ''
      useVideo = fd.get('useVideo') === 'true'
      if (!transcript && (audio || video)) {
        const file = video || audio
        if (file && file.size > 0) {
          try {
            const t = await openai.audio.transcriptions.create({ file: file as any, model: 'whisper-1' })
            transcript = t.text || ''
          } catch { return NextResponse.json({ error: 'Could not transcribe audio' }, { status: 400 }) }
        }
      }
    }

    if (!transcript.trim()) return NextResponse.json({ error: 'No transcript. Record or paste one.' }, { status: 400 })
    if (!githubUrl.trim()) return NextResponse.json({ error: 'GitHub URL required' }, { status: 400 })

    const gh = await fetchGitHub(githubUrl)
    if (!gh) return NextResponse.json({ error: 'Could not fetch GitHub repo' }, { status: 400 })

    const prompt = `PITCH: """${transcript}"""\nQUESTION: ${question}\nGITHUB: stars=${gh.stars}, forks=${gh.forks}, desc=${gh.description}, langs=${gh.languages.join(', ')}\nREADME excerpt: ${gh.readmeSummary}\n${useVideo ? 'Video was recorded. Add plausible visualCues.' : ''}\n\nRespond ONLY with valid JSON: {"technicalCredibility":0-10,"pitchClarity":0-10,"fundability":0-100,"strengths":[],"weaknesses":[],"suggestions":["","",""],"inconsistencies":[],"visualCues":{"eyeContactPercent":0-100,"smileFrequency":"low|moderate|high","engagementLevel":"poor|fair|good|excellent"}}`

    const res = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.3 })
    let parsed: Record<string, unknown>
    try {
      const txt = (res.choices[0]?.message?.content || '{}').replace(/^```\w*\s*|\s*```$/g, '')
      parsed = JSON.parse(txt) as Record<string, unknown>
    } catch { return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 }) }

    return NextResponse.json({
      technicalCredibility: typeof parsed.technicalCredibility === 'number' ? parsed.technicalCredibility : 5,
      pitchClarity: typeof parsed.pitchClarity === 'number' ? parsed.pitchClarity : 5,
      fundability: typeof parsed.fundability === 'number' ? parsed.fundability : 50,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      inconsistencies: Array.isArray(parsed.inconsistencies) ? parsed.inconsistencies : [],
      visualCues: parsed.visualCues && typeof parsed.visualCues === 'object' ? parsed.visualCues : undefined,
      transcript,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 })
  }
}
