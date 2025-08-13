type ModerationDecision = {
  flag: boolean
  status?: number
  reason?: string
  category?: string
}

export async function moderateCommentWithSLM(content: string): Promise<ModerationDecision> {
  const enabled = process.env.SLM_MODERATION_ENABLED
  if (enabled && enabled.toLowerCase() === 'false') {
    return { flag: false }
  }

  // Do not short-circuit here; always defer to SLM API for moderation decisions.

  const baseUrl = process.env.SLM_API_URL || 'http://localhost:8000'
  const apiKey = process.env.SLM_API_KEY || 'changeme'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2000)
  try {
    const res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ prompt: content }),
      signal: controller.signal
    })
    if (!res.ok) return { flag: false }
    const data = await res.json() as { response: string }

    // Handle simplified word responses first
    if (data.response === 'flagged') {
      return { flag: true, status: 406, reason: 'auto-flagged' }
    }
    if (data.response === 'okay') {
      return { flag: false, status: 200 }
    }
    // Numeric status as plain string (legacy simplified)
    if (data.response === '406') {
      return { flag: true, status: 406, reason: 'auto-flagged' }
    }
    if (data.response === '200') {
      return { flag: false, status: 200 }
    }

    // Legacy: The model returns a JSON string in data.response. Try to parse it.
    try {
      const parsed = JSON.parse(data.response)
      const flag = parsed.flag === true || parsed.status === 406
      return {
        flag,
        status: parsed.status,
        reason: parsed.rationale || parsed.response || parsed.reason,
        category: parsed.category,
      }
    } catch {
      // Fallback: look for status 406 in raw string
      const flag = /"status"\s*:\s*406/.test(data.response)
      return { flag }
    }
  } catch {
    // On any error or timeout, do not flag
    return { flag: false }
  } finally {
    clearTimeout(timeout)
  }
}


