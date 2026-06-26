/**
 * Leaderboard API
 * GET /api/leaderboard?level=1  - 获取某关排行
 * POST /api/leaderboard         - 提交分数（需登录）
 * Body: { level: number, name: string, score: number, time: string }
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

const MAX_ENTRIES_PER_LEVEL = 50
const MIN_SCORE = 0
const MAX_SCORE = 1000
const MAX_NAME_LENGTH = 20

interface LeaderboardEntry {
  rank: number
  name: string
  score: number
  time: string
  date: string
  userId?: string  // server-side traceability
}

// Per-IP rate limit for submissions
const submitRateLimit = new Map<string, { count: number; resetAt: number }>()
const SUBMIT_RPM = 5

function checkSubmitRate(ip: string): boolean {
  const now = Date.now()
  const entry = submitRateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    submitRateLimit.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  entry.count++
  if (now > entry.resetAt) {
    submitRateLimit.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  return entry.count <= SUBMIT_RPM
}

export async function onRequestOptions(context: any) {
  const origin = context.request.headers.get('Origin') || ''
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0]
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function onRequestGet(context: any) {
  const { request, env } = context
  const origin = request.headers.get('Origin') || ''
  const corsHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : '',
  }

  const url = new URL(request.url)
  const level = url.searchParams.get('level')

  if (!level) {
    return new Response(JSON.stringify({ error: 'Missing level parameter' }), {
      status: 400, headers: corsHeaders,
    })
  }

  const kvKey = `lb:${level}`
  let entries: LeaderboardEntry[] = []

  try {
    const stored = await env.LEADERBOARD_KV.get(kvKey, 'json')
    if (stored && Array.isArray(stored)) {
      entries = stored
    }
  } catch {
    // KV not available yet, return empty
  }

  // Return top 10
  return new Response(JSON.stringify({
    level: parseInt(level),
    entries: entries.slice(0, 10),
    total: entries.length,
  }), { headers: corsHeaders })
}

export async function onRequestPost(context: any) {
  const { request, env } = context
  const origin = request.headers.get('Origin') || ''
  const corsHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : '',
  }

  // Require authentication — prevents anonymous score injection
  const token = extractToken(request)
  if (!token || !env.JWT_SECRET) {
    return new Response(JSON.stringify({ error: '请先登录后提交分数' }), {
      status: 401, headers: corsHeaders,
    })
  }
  const authUser = await verifyJWT(token, env.JWT_SECRET)
  if (!authUser) {
    return new Response(JSON.stringify({ error: '登录已过期，请重新登录' }), {
      status: 401, headers: corsHeaders,
    })
  }

  // Rate limit
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
  if (!checkSubmitRate(clientIP)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429, headers: corsHeaders,
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

  const { level, name, score, time } = body

  // Validate
  if (!level || typeof level !== 'number' || level < 1 || level > 25) {
    return new Response(JSON.stringify({ error: 'Invalid level (1-25)' }), {
      status: 400, headers: corsHeaders,
    })
  }
  if (!name || typeof name !== 'string' || name.length > MAX_NAME_LENGTH || name.length < 1) {
    return new Response(JSON.stringify({ error: 'Invalid name (1-20 chars)' }), {
      status: 400, headers: corsHeaders,
    })
  }
  if (typeof score !== 'number' || score < MIN_SCORE || score > MAX_SCORE) {
    return new Response(JSON.stringify({ error: 'Invalid score (0-1000)' }), {
      status: 400, headers: corsHeaders,
    })
  }
  if (!time || typeof time !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid time' }), {
      status: 400, headers: corsHeaders,
    })
  }

  // Sanitize name (strip HTML tags)
  const sanitizedName = name.replace(/<[^>]*>/g, '').substring(0, MAX_NAME_LENGTH)

  const kvKey = `lb:${level}`
  let entries: LeaderboardEntry[] = []

  try {
    const stored = await env.LEADERBOARD_KV.get(kvKey, 'json')
    if (stored && Array.isArray(stored)) {
      entries = stored
    }
  } catch {
    // KV not available
  }

  // Add new entry with server-side user ID for traceability
  const newEntry: LeaderboardEntry = {
    rank: 0,
    name: sanitizedName,
    score,
    time,
    date: new Date().toISOString().split('T')[0],
    userId: authUser.userId,
  }

  entries.push(newEntry)

  // Sort by score desc, then time asc
  entries.sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
    if (b.score !== a.score) return b.score - a.score
    return a.time.localeCompare(b.time)
  })

  // Update ranks and trim
  entries = entries.slice(0, MAX_ENTRIES_PER_LEVEL)
  entries.forEach((e: LeaderboardEntry, i: number) => { e.rank = i + 1 })

  // Save
  try {
    await env.LEADERBOARD_KV.put(kvKey, JSON.stringify(entries), { expirationTtl: 30 * 24 * 3600 })
  } catch {
    return new Response(JSON.stringify({ error: 'Storage error' }), {
      status: 500, headers: corsHeaders,
    })
  }

  // Find the rank of the new entry
  const rank = entries.findIndex((e: LeaderboardEntry) => e.name === sanitizedName && e.score === score && e.time === time) + 1

  return new Response(JSON.stringify({
    success: true,
    rank,
    total: entries.length,
  }), { headers: corsHeaders })
}
