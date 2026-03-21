import { NextRequest, NextResponse } from 'next/server'
import { summarizeTextWithBaidu } from '@/lib/baidu-ai'

function normalizeUrl(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

function stripHtmlToText(html: string) {
  // 移除 script/style，避免噪音文本
  const noScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')

  const bodyMatch = noScript.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const bodyContent = bodyMatch?.[1] || noScript

  return bodyContent
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      url?: string
      noteId?: string
      /** 直接传入正文时走文本摘要，无需抓取网页 */
      text?: string
    }
    const noteId = body.noteId || ''
    const directText = typeof body.text === 'string' ? body.text.trim() : ''

    let clippedText = ''
    let url = ''

    if (directText) {
      clippedText = directText.slice(0, 12000)
    } else {
      const rawUrl = body.url || ''
      url = normalizeUrl(rawUrl)

      if (!url) {
        return NextResponse.json(
          { error: '请提供 url 或 text 其一' },
          { status: 400 }
        )
      }

      const htmlResponse = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; PersonalKnowledgeBot/1.0; +https://example.local)',
        },
        cache: 'no-store',
      })

      if (!htmlResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch target url' },
          { status: 400 }
        )
      }

      const html = await htmlResponse.text()
      const text = stripHtmlToText(html)
      clippedText = text.slice(0, 12000)

      if (!clippedText) {
        return NextResponse.json(
          { error: 'No readable text found from url' },
          { status: 400 }
        )
      }
    }

    if (!clippedText) {
      return NextResponse.json(
        { error: '没有可用于摘要的正文' },
        { status: 400 }
      )
    }

    const summary = await summarizeTextWithBaidu(clippedText)
    return NextResponse.json({
      noteId,
      url: url || undefined,
      summary,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown summarize error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
