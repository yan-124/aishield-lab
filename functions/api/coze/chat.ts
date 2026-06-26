/**
 * Coze API SSE 流式代理
 * 面试训练场专用，通过 Cloudflare Pages Functions 调用
 * Token 存储在 Workers 环境变量中，前端不可见
 */

const ALLOWED_ORIGINS = [
  'https://aiseclearn.com',
  'https://www.aiseclearn.com',
  'http://localhost:5201',
  'http://127.0.0.1:5201',
]

// 简易 IP 速率限制：每个 IP 每分钟最多 20 次请求
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  entry.count++
  return entry.count <= 20
}

// 清理过期记录（在请求处理中顺带执行，避免全局 setInterval）
function cleanupRateLimit() {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip)
  }
}

function getCorsHeaders(origin: string): Record<string, string> {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function onRequestPost(context) {
  const { request, env } = context

  // CORS 检查 - 允许 Pages 临时域名和自定义域名
  const origin = request.headers.get('Origin') || ''
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || 
                    (origin.includes('.pages.dev') && origin.includes('aishield-lab')) ||
                    !origin
  
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
    })
  }

  // 速率限制
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
  if (!checkRateLimit(clientIP)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  cleanupRateLimit()
  
  const COZE_TOKEN = env.COZE_TOKEN || ''
  if (!COZE_TOKEN) {
    return new Response(JSON.stringify({ error: 'Server configuration error: missing COZE_TOKEN' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
    })
  }
  
  try {
    let body = await request.json()
    
    if (typeof body.stream === 'undefined') {
      body = { ...body, stream: true }
    }
    
    const cozeResponse = await fetch('https://api.coze.cn/v3/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COZE_TOKEN}`,
      },
      body: JSON.stringify(body),
    })
    
    if (!cozeResponse.ok) {
      const errText = await cozeResponse.text()
      return new Response(
        JSON.stringify({ error: `Coze API error: ${cozeResponse.status}`, detail: errText }),
        {
          status: cozeResponse.status,
          headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        }
      )
    }
    
    return new Response(cozeResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...getCorsHeaders(origin),
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy error', detail: err.message }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      }
    )
  }
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
