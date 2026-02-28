import { NextRequest, NextResponse } from 'next/server'

function extractRepo(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url)
    const parts = u.pathname.replace(/^\//, '').split('/').filter(Boolean)
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') }
  } catch {}
  return null
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  const p = extractRepo(url)
  if (!p) return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })
  try {
    const [repoRes, readmeRes, langsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${p.owner}/${p.repo}`, { headers: { Accept: 'application/vnd.github.v3+json', ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) } }),
      fetch(`https://api.github.com/repos/${p.owner}/${p.repo}/readme`, { headers: { Accept: 'application/vnd.github.v3.raw', ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) } }).then((r) => r.ok ? r.text() : '').catch(() => ''),
      fetch(`https://api.github.com/repos/${p.owner}/${p.repo}/languages`, { headers: { Accept: 'application/vnd.github.v3+json', ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) } }).then((r) => r.ok ? r.json() : {}).catch(() => ({})),
    ])
    if (!repoRes.ok) return NextResponse.json({ error: 'Repo not found' }, { status: 404 })
    const repo = (await repoRes.json()) as { name: string; description?: string; stargazers_count?: number; forks_count?: number }
    const langs = (typeof langsRes === 'object' && langsRes !== null ? langsRes : {}) as Record<string, number>
    const total = Object.values(langs).reduce((a, b) => a + b, 0)
    const topLangs = Object.entries(langs).sort(([, a], [, b]) => b - a).slice(0, 5).map(([l, n]) => `${l} (${total ? Math.round((n / total) * 100) : 0}%)`)
    return NextResponse.json({ name: repo.name, stars: repo.stargazers_count ?? 0, forks: repo.forks_count ?? 0, languages: topLangs, readmeSummary: String(readmeRes || '').slice(0, 500) })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
