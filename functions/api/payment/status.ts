/**
 * 查询支付状态
 * GET /api/payment/status?orderId=xxx
 * Returns: { paid: boolean, status: string }
 */

import { generateSign, generateNonceStr, isHupijiaoConfigured, HUPIJIAO_API_BASE } from '../../_utils/payment'

const ALLOWED_ORIGINS = [
  'https://aiseclearn.com',
  'https://www.aiseclearn.com',
  'http://localhost:5201',
  'http://127.0.0.1:5201',
]

const DEBUG_MODE = false

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true
  if (origin.match(/^https:\/\/[a-z0-9-]+\.aishield-lab\.pages\.dev$/)) return true
  return false
}

export async function onRequestGet(context: any) {
  const { request, env } = context

  const origin = request.headers.get('Origin') || ''
  const corsHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : '',
  }

  if (!isHupijiaoConfigured(env)) {
    if (DEBUG_MODE) {
      return new Response(JSON.stringify({
        paid: false,
        status: 'pending',
        debug: '支付功能尚未配置，返回模拟数据',
      }), { headers: corsHeaders })
    }
    return new Response(JSON.stringify({
      paid: false,
      error: '支付功能尚未配置',
    }), { status: 503, headers: corsHeaders })
  }

  const url = new URL(request.url)
  const orderId = url.searchParams.get('orderId')

  if (!orderId) {
    return new Response(JSON.stringify({ paid: false, error: '缺少订单号' }), { status: 400, headers: corsHeaders })
  }

  const params: Record<string, string> = {
    appid: env.HUPIJIAO_APP_ID,
    out_trade_order: orderId,
    time: Math.floor(Date.now() / 1000).toString(),
    nonce_str: generateNonceStr(16),
  }

  params.hash = generateSign(params, env.HUPIJIAO_APP_SECRET)

  const formData = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    formData.append(k, v)
  }

  const MAX_RETRIES = 3
  const REQUEST_TIMEOUT = 10000
  let lastError: any

  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

      const resp = await fetch(`${HUPIJIAO_API_BASE}/payment/query.html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`)
      }

      const text = await resp.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (parseErr) {
        throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`)
      }

      if (data.err === 0 && data.data) {
        const paid = data.data.status === 'success' || data.data.pay_status === 'success'
        return new Response(JSON.stringify({ paid, status: data.data.status }), { headers: corsHeaders })
      } else {
        return new Response(JSON.stringify({ paid: false, status: 'pending' }), { headers: corsHeaders })
      }

    } catch (err: any) {
      lastError = err
      if (retry < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 500 * (retry + 1)))
      }
    }
  }

  return new Response(JSON.stringify({
    paid: false,
    error: '查询失败: ' + (lastError.message || 'unknown'),
  }), { status: 500, headers: corsHeaders })
}
