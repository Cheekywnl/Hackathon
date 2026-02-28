import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { technicalCredibility = 0, pitchClarity = 0, fundability = 0, strengths = [], weaknesses = [], suggestions = [], inconsistencies = [], visualCues = {} } = body

    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
    let page = doc.addPage([595, 842])
    const { height } = page.getSize()
    const m = 50
    let y = height - 50

    const addTitle = (t: string) => { page.drawText(t, { x: m, y, font: fontBold, size: 14, color: rgb(0.2, 0.2, 0.2) }); y -= 22 }
    const addText = (t: string) => { page.drawText(t, { x: m, y, font, size: 10, color: rgb(0.3, 0.3, 0.3) }); y -= 14 }

    addTitle('AI Due Diligence Report')
    addTitle('Scores')
    addText(`Technical Credibility: ${technicalCredibility}/10`)
    addText(`Pitch Clarity: ${pitchClarity}/10`)
    addText(`Fundability: ${fundability}/100`)
    addTitle('Strengths')
    strengths.forEach((s: string) => addText(`• ${s}`))
    addTitle('Weaknesses')
    weaknesses.forEach((w: string) => addText(`• ${w}`))
    addTitle('Suggestions')
    suggestions.forEach((s: string) => addText(`• ${s}`))
    if (Array.isArray(inconsistencies) && inconsistencies.length) { addTitle('Inconsistencies'); inconsistencies.forEach((i: string) => addText(`• ${i}`)) }
    if (visualCues && typeof visualCues === 'object') { addTitle('Visual Cues'); addText(`Eye contact: ${(visualCues as any).eyeContactPercent}%`); addText(`Engagement: ${(visualCues as any).engagementLevel}`) }

    const pdf = await doc.save()
    return new NextResponse(pdf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="report.pdf"' } })
  } catch (e) {
    return NextResponse.json({ error: 'PDF failed' }, { status: 500 })
  }
}
