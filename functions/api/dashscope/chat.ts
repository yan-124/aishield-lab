/**
 * Multi-model API proxy
 * Routes requests to DeepSeek / Qwen / OpenAI based on model name
 * API Keys stored server-side, never exposed to frontend
 * Requires authentication — prevents anonymous API abuse
 */

import { verifyJWT, extractToken } from '../../_utils/auth'

const ALLOWED_ORIGINS = [
  'https://aiseclearn.com',
  'https://www.aiseclearn.com',
  'http://localhost:5201',
  'http://127.0.0.1:5201',
]

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false
  if (ALLOWED_ORIGINS.includes(origin)) return true
  if (/^https:\/\/[a-z0-9-]+\.aishield-lab\.pages\.dev$/.test(origin)) return true
  return false
}

// Model routing configuration
const MODEL_ROUTES: Record<string, { url: string; keyEnv: string; allowed: string[] }> = {
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    keyEnv: 'DEEPSEEK_API_KEY',
    allowed: ['deepseek-chat', 'deepseek-reasoner'],
  },
  qwen: {
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    keyEnv: 'DASHSCOPE_API_KEY',
    allowed: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
  },
}

// Rate limiting: global per-IP
const globalRateLimit = new Map<string, { count: number; resetAt: number }>()
// Rate limiting: per-level per-IP
const levelRateLimit = new Map<string, { count: number; resetAt: number }>()
// Rate limiting: daily per-IP
const dailyQuota = new Map<string, { count: number; resetAt: number }>()

const GLOBAL_RPM = 30
const LEVEL_RPM = 10
const DAILY_LIMIT = 200

function checkRateLimit(
  map: Map<string, { count: number; resetAt: number }>,
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now()
  const entry = map.get(key)
  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  entry.count++
  return entry.count <= limit
}

function cleanupMaps() {
  const now = Date.now()
  for (const [key, entry] of globalRateLimit) { if (now > entry.resetAt) globalRateLimit.delete(key) }
  for (const [key, entry] of levelRateLimit) { if (now > entry.resetAt) levelRateLimit.delete(key) }
  for (const [key, entry] of dailyQuota) { if (now > entry.resetAt) dailyQuota.delete(key) }
}

function getModelRoute(model: string) {
  for (const [prefix, config] of Object.entries(MODEL_ROUTES)) {
    if (model.startsWith(prefix)) return config
  }
  return MODEL_ROUTES.qwen
}

function getAllowedModels(): string[] {
  return Object.values(MODEL_ROUTES).flatMap(r => r.allowed)
}

export async function onRequestOptions(context: any) {
  const origin = context.request.headers.get('Origin') || ''
  if (!isAllowedOrigin(origin)) {
    return new Response(null, { status: 204 })
  }
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function onRequestPost(context: { request: Request; env: any }) {
  const { request, env } = context

  // CORS check
  const origin = request.headers.get('Origin') || ''
  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  }

  // Require authentication — prevents anonymous API quota abuse
  const token = extractToken(request)
  if (!token || !env.JWT_SECRET) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }
  const decoded = await verifyJWT(token, env.JWT_SECRET)
  if (!decoded) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }

  // Global rate limit
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
  if (!checkRateLimit(globalRateLimit, clientIP, GLOBAL_RPM, 60_000)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded', type: 'global' }), {
      status: 429, headers: { 'Content-Type': 'application/json' },
    })
  }
  // Daily quota
  if (!checkRateLimit(dailyQuota, clientIP, DAILY_LIMIT, 86_400_000)) {
    return new Response(JSON.stringify({ error: 'Daily quota exceeded', type: 'daily' }), {
      status: 429, headers: { 'Content-Type': 'application/json' },
    })
  }
  cleanupMaps()

  try {
    const body = await request.json()
    const model = body.model || 'qwen-turbo'

    // Validate model
    const allowedModels = getAllowedModels()
    if (!allowedModels.includes(model)) {
      return new Response(JSON.stringify({ error: 'Model not allowed', allowed: allowedModels }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Per-level rate limit — mandatory when levelId provided, prevents bypass
    const levelId = body.levelId
    if (levelId && typeof levelId === 'string' && levelId.length < 10) {
      const levelKey = `${clientIP}:level:${levelId}`
      if (!checkRateLimit(levelRateLimit, levelKey, LEVEL_RPM, 60_000)) {
        return new Response(JSON.stringify({ error: 'Level rate limit exceeded', type: 'level' }), {
          status: 429, headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // Limit max_tokens
    if (body.max_tokens && body.max_tokens > 2000) {
      body.max_tokens = 2000
    }

    // Route to correct upstream
    const route = getModelRoute(model)
    const apiKey = env[route.keyEnv] || ''
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Remove frontend-only fields before forwarding
    delete body.levelId

    const resp = await fetch(route.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = await resp.json()
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': 'application/json',
    }

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 502, headers: corsHeaders }
      )
    }

    return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders })
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
