import { NextRequest, NextResponse } from 'next/server'

function normalizeUrl(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url') || ''
  const url = normalizeUrl(rawUrl)

  if (!url) {
    return NextResponse.json({ title: '' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; PersonalKnowledgeBot/1.0; +https://example.local)',
      },
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      return NextResponse.json({ title: '' })
    }

    const html = await response.text()
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = match?.[1]?.replace(/\s+/g, ' ').trim() || ''

    return NextResponse.json({ title })
  } catch {
    return NextResponse.json({ title: '' })
  }
}
