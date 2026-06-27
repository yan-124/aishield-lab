/**
 * Coze API SSE 流式代理
 * 面试训练场专用，通过 Cloudflare Pages Functions 调用
 * Token 存储在 Workers 环境变量中，前端不可见
 */

import { verifyJWT, extractToken } from '../../_utils/auth'

const ALLOWED_ORIGINS = [
  'https://aiseclearn.com',
  'https://www.aiseclearn.com',
  'http://localhost:5201',
  'http://127.0.0.1:5201',
]

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false // 禁止空 origin
  if (ALLOWED_ORIGINS.includes(origin)) return true
  if (/^https:\/\/[a-z0-9-]+\.aishield-lab\.pages\.dev$/.test(origin)) return true
  return false
}

// 速率限制：使用 Cloudflare KV 以确保分布式环境下有效
// 如果没有 KV，降级到内存 Map（仅单实例有效）
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_RPM = 20

function getRateLimitKey(ip: string): string {
  return `ratelimit:coze:${ip}:${Math.floor(Date.now() / 60000)}`
}

async function checkRateLimit(kv: any, ip: string): Promise<boolean> {
  if (kv) {
    // 使用 KV 实现分布式速率限制
    const key = getRateLimitKey(ip)
    try {
      const current = await kv.get(key)
      const count = current ? parseInt(current) : 0
      if (count >= RATE_LIMIT_RPM) return false
      await kv.put(key, String(count + 1), { expirationTtl: 120 })
      return true
    } catch {
      // KV 失败，降级到内存
    }
  }

  // 内存降级
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT_RPM
}

function getCorsHeaders(origin: string): Record<string, string> {
  const allowed = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context

  // CORS 检查
  const origin = request.headers.get('Origin') || ''
  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 认证检查 — 防止未授权使用 Coze API 配额
  const token = extractToken(request)
  if (!token || !env.JWT_SECRET) {
    return new Response(JSON.stringify({ error: '请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
    })
  }
  const authUser = await verifyJWT(token, env.JWT_SECRET)
  if (!authUser) {
    return new Response(JSON.stringify({ error: '登录已过期，请重新登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
    })
  }

  // 速率限制
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
  if (!await checkRateLimit(env.AUTH_KV, clientIP)) {
    return new Response(JSON.stringify({ error: '请求过于频繁，请稍后再试' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
    })
  }

  const COZE_TOKEN = env.COZE_TOKEN || ''
  if (!COZE_TOKEN) {
    return new Response(JSON.stringify({ error: '服务暂不可用' }), {
      status: 503,
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
      console.error('Coze API error:', cozeResponse.status, errText.substring(0, 200))
      return new Response(
        JSON.stringify({ error: '服务暂不可用，请稍后重试' }),
        {
          status: 502,
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
  } catch (err: any) {
    console.error('Coze proxy error:', err.message)
    return new Response(
      JSON.stringify({ error: '服务暂不可用' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      }
    )
  }
}

export async function onRequestOptions(context: any) {
  const origin = context.request.headers.get('Origin') || ''
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ''
  if (!allowedOrigin) {
    return new Response(null, { status: 204 })
  }
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
