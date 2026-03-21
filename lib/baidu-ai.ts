const BAIDU_OAUTH_URL = 'https://aip.baidubce.com/oauth/2.0/token'
const BAIDU_CHAT_URL = 'https://qianfan.baidubce.com/v2/chat/completions'

export type AiSummaryResult = {
  title: string
  summary: string
  keyPoints: string[]
  readTime: string
}

function getRequiredEnv(name: 'BAIDU_API_KEY' | 'BAIDU_SECRET_KEY') {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

type BaiduOAuthSuccess = { access_token: string; expires_in?: number }
type BaiduOAuthError = { error?: string; error_description?: string }

/**
 * 与百度官方示例一致：参数放在 query，POST 空体，Content-Type 为 application/json。
 * @see https://ai.baidu.com/ai-doc/REFERENCE/Ck3dwjhhu
 */
export async function getBaiduAccessToken() {
  const apiKey = getRequiredEnv('BAIDU_API_KEY')
  const secretKey = getRequiredEnv('BAIDU_SECRET_KEY')

  const query = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: apiKey,
    client_secret: secretKey,
  })

  const response = await fetch(`${BAIDU_OAUTH_URL}?${query.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  const raw = await response.text()
  let data: BaiduOAuthSuccess & BaiduOAuthError
  try {
    data = JSON.parse(raw) as BaiduOAuthSuccess & BaiduOAuthError
  } catch {
    throw new Error(`Baidu OAuth: invalid JSON: ${raw.slice(0, 500)}`)
  }

  if (data.error) {
    throw new Error(
      `Baidu OAuth: ${data.error}${data.error_description ? ` — ${data.error_description}` : ''}`
    )
  }

  if (!response.ok) {
    throw new Error(`Baidu OAuth HTTP ${response.status}: ${raw.slice(0, 500)}`)
  }

  if (!data.access_token) {
    throw new Error('Baidu OAuth response missing access_token')
  }

  return data.access_token
}

function extractJsonObject(text: string) {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed
  }

  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return JSON content')
  }
  return trimmed.slice(start, end + 1)
}

function normalizeSummary(input: Partial<AiSummaryResult>): AiSummaryResult {
  const keyPoints = Array.isArray(input.keyPoints)
    ? input.keyPoints.filter((x): x is string => typeof x === 'string').slice(0, 3)
    : []

  return {
    title: String(input.title || '').trim(),
    summary: String(input.summary || '').trim(),
    keyPoints,
    readTime: String(input.readTime || '').trim(),
  }
}

export async function summarizeTextWithBaidu(text: string): Promise<AiSummaryResult> {
  const accessToken = await getBaiduAccessToken()
  // 模型 ID 需与千帆控制台一致；若报 invalid_model，可改为 ernie-4.0-8k / ernie-3.5-8k 等
  const model = process.env.BAIDU_MODEL || 'ernie-4.0-8k'

  const prompt = [
    '你是一个信息提炼助手。',
    '请根据提供的网页正文生成摘要，且必须严格返回 JSON（不要 Markdown 代码块，不要解释性文字）。',
    'JSON 字段必须包含：',
    'title: string（标题）',
    'summary: string（一句话精华）',
    'keyPoints: string[]（恰好 3 个要点）',
    'readTime: string（阅读时间，例如 "<3min"、"<7min"）',
  ].join('\n')

  const body = {
    model,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: `网页正文如下：\n${text}`,
      },
    ],
  }

  const response = await fetch(BAIDU_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const rawBody = await response.text()
  let data: {
    error?: { code?: number | string; message?: string; type?: string }
    result?: string
    choices?: Array<{ message?: { content?: string } }>
  }
  try {
    data = JSON.parse(rawBody) as typeof data
  } catch {
    throw new Error(`Baidu summarize: invalid JSON: ${rawBody.slice(0, 500)}`)
  }

  if (data.error) {
    const msg =
      typeof data.error === 'object'
        ? `${data.error.message || ''} (${data.error.code ?? ''})`.trim()
        : String(data.error)
    throw new Error(`Baidu chat API error: ${msg || rawBody.slice(0, 500)}`)
  }

  if (!response.ok) {
    throw new Error(`Baidu summarize failed HTTP ${response.status}: ${rawBody.slice(0, 800)}`)
  }

  const rawContent =
    data.result || data.choices?.[0]?.message?.content || ''

  if (!rawContent) {
    throw new Error('Baidu summarize response is empty')
  }

  const jsonText = extractJsonObject(rawContent)
  const parsed = JSON.parse(jsonText) as Partial<AiSummaryResult>
  return normalizeSummary(parsed)
}
