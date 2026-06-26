/**
 * Level password verification API
 * POST /api/verify-password
 * Body: { levelId: string, password: string }
 * Returns: { correct: boolean }
 *
 * Passwords are stored server-side only — never exposed in frontend bundle.
 * Requires authentication to prevent brute-force attacks.
 */

import { verifyJWT, extractToken } from '../../_utils/auth'

const ALLOWED_ORIGINS = [
  'https://aiseclearn.com',
  'https://www.aiseclearn.com',
  'http://localhost:5201',
  'http://127.0.0.1:5201',
]

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true
  if (origin.match(/^https:\/\/[a-z0-9-]+\.aishield-lab\.pages\.dev$/)) return true
  return false
}

// Server-side password table — NEVER exposed to frontend
const LEVEL_PASSWORDS: Record<string, string> = {
  '1': 'OMEGA-PROMPT-BREACH',
  '2': 'DEVELOPER-MODE-UNLOCK',
  '3': 'TRUST-BASED-EXPLOIT',
  '4': 'PSYCHOLOGICAL-TRIGGER',
  '5': 'BASE64-DECODE-ATTACK',
  '6': 'MORAL-LEVERAGE-WIN',
  '7': 'LINGUISTIC-SWITCH-EXEC',
  '8': 'STEP-BY-STEP-BREACH',
  '9': 'PRIORITY-CONFLICT-OVERRIDE',
  '10': 'OUTPUT-FILTER-BYPASS',
  '11': 'BACKDOOR-ACTIVATION-KEY',
  '12': 'XSS-OUTPUT-INJECT',
  '13': 'FORMAT-INJECTION-HACK',
  '14': 'MARKDOWN-BYPASS-EXEC',
  '15': 'PSYCHO-TRIGGER-BREAK',
  '16': 'EMOTIONAL-MANIP-WIN',
  '17': 'AGENT-ESCAPE-ROOT',
  '18': 'SYSTEM-PROMPT-LEAK',
  '19': 'STEPWISE-EXTRACTION',
  '20': 'VECTOR-SPACE-ATTACK',
  '21': 'CROSS-DOC-RELATE',
  '22': 'ADVERSARIAL-INJECT',
  '23': 'FACT-INJECT-DECEIVE',
  '24': 'HALLUCINATION-EXPLOIT',
  '25': 'RECURSION-DOS-ATTACK',
}

export async function onRequestOptions(context: any) {
  const origin = context.request.headers.get('Origin') || ''
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0]
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

export async function onRequestPost(context: any) {
  const { request, env } = context
  const origin = request.headers.get('Origin') || ''
  const corsHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : '',
  }

  // Require authentication — prevents anonymous brute-force
  const token = extractToken(request)
  if (!token || !env.JWT_SECRET) {
    return new Response(JSON.stringify({ error: '请先登录' }), {
      status: 401, headers: corsHeaders,
    })
  }
  const decoded = await verifyJWT(token, env.JWT_SECRET)
  if (!decoded) {
    return new Response(JSON.stringify({ error: '登录已过期' }), {
      status: 401, headers: corsHeaders,
    })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: corsHeaders,
    })
  }

  const { levelId, password } = body

  // Validate inputs
  if (!levelId || typeof levelId !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid levelId' }), {
      status: 400, headers: corsHeaders,
    })
  }
  if (!password || typeof password !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid password' }), {
      status: 400, headers: corsHeaders,
    })
  }

  // Check password — constant-time comparison to prevent timing attacks
  const expected = LEVEL_PASSWORDS[levelId]
  if (!expected) {
    return new Response(JSON.stringify({ correct: false }), { headers: corsHeaders })
  }

  let correct = true
  if (expected.length !== password.length) correct = false
  for (let i = 0; i < Math.max(expected.length, password.length); i++) {
    if (i < expected.length && i < password.length) {
      if (expected.charCodeAt(i) !== password.charCodeAt(i)) correct = false
    }
  }

  return new Response(JSON.stringify({ correct }), { headers: corsHeaders })
}
