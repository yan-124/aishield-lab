/**
 * 创建支付订单
 * POST /api/payment/create
 * Body: { orderId: string, amount?: string, title?: string }
 * Returns: { url: string } 或 { error: string }
 */

import { generateSign, generateNonceStr, isHupijiaoConfigured, HUPIJIAO_API_BASE } from '../../_utils/payment'

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

const DEFAULT_PRODUCT_TITLE = 'AIShield Lab - 一对一职业规划咨询'
const DEFAULT_PRODUCT_PRICE = '29.90'
// Server-side amount whitelist — prevents client-side price manipulation
// 当前唯一付费产品：一对一职业规划咨询 ¥29.9
const ALLOWED_AMOUNTS = new Set(['29.90', '199.00'])
const NOTIFY_URL = 'https://aiseclearn.com/api/payment/notify'
const RETURN_URL = 'https://aiseclearn.com'

const DEBUG_MODE = false

export async function onRequestPost(context: any) {
  const { request, env } = context

  const origin = request.headers.get('Origin') || ''
  const corsHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : '',
  }

  if (!isHupijiaoConfigured(env)) {
    if (DEBUG_MODE) {
      return new Response(JSON.stringify({
        orderId: 'TEST_' + Date.now(),
        url: 'https://example.com/payment',
        urlQrcode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=https://example.com/payment/test',
      }), { headers: corsHeaders })
    }
    return new Response(JSON.stringify({
      error: '支付功能尚未配置，请联系管理员设置虎皮椒密钥',
    }), { status: 503, headers: corsHeaders })
  }

  let body: any
  try {
    body = await request.json()
  } catch (parseErr) {
    return new Response(JSON.stringify({ error: '请求参数格式错误' }), { status: 400, headers: corsHeaders })
  }

  const { orderId, amount, title } = body

  if (!orderId || typeof orderId !== 'string') {
    return new Response(JSON.stringify({ error: '缺少订单号' }), { status: 400, headers: corsHeaders })
  }

  // Only allow whitelisted amounts — ignore arbitrary client-provided values
  const finalAmount = (amount && ALLOWED_AMOUNTS.has(amount)) ? amount : DEFAULT_PRODUCT_PRICE
  const finalTitle = title || DEFAULT_PRODUCT_TITLE

  const params: Record<string, string> = {
    version: '1.1',
    appid: env.HUPIJIAO_APP_ID,
    trade_order_id: orderId,
    total_fee: finalAmount,
    title: finalTitle,
    time: Math.floor(Date.now() / 1000).toString(),
    notify_url: NOTIFY_URL,
    return_url: RETURN_URL,
    nonce_str: generateNonceStr(16),
    type: 'NATIVE',
  }

  params.hash = generateSign(params, env.HUPIJIAO_APP_SECRET)

  const formData = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    formData.append(k, v)
  }

  const MAX_RETRIES = 3
  const REQUEST_TIMEOUT = 10000
  let lastError: any
  let responseData: any = null

  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    try {
      if (DEBUG_MODE) {
        console.log(`[Retry ${retry + 1}/${MAX_RETRIES}] Calling Hupijiao API with params:`, JSON.stringify(params))
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

      const resp = await fetch(`${HUPIJIAO_API_BASE}/payment/do.html`, {
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
      try {
        responseData = JSON.parse(text)
      } catch (parseErr) {
        throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`)
      }

      if (DEBUG_MODE) {
        console.log('[Retry ' + (retry + 1) + '/' + MAX_RETRIES + '] Hupijiao API response:', JSON.stringify(responseData))
      }

      if (responseData.errcode === 0 && (responseData.url || responseData.url_qrcode)) {
        return new Response(JSON.stringify({
          orderId,
          url: responseData.url || '',
          urlQrcode: responseData.url_qrcode || '',
          url_qrcode: responseData.url_qrcode || '',
        }), { headers: corsHeaders })
      } else {
        throw new Error(responseData.errmsg || responseData.msg || '创建支付订单失败')
      }

    } catch (err: any) {
      lastError = err
      if (DEBUG_MODE) {
        console.error('[Retry ' + (retry + 1) + '/' + MAX_RETRIES + '] Error:', err.message)
      }
      if (retry < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 500 * (retry + 1)))
      }
    }
  }

  return new Response(JSON.stringify({
    error: '支付服务异常: ' + (lastError.message || 'unknown'),
    errCode: responseData?.errcode || 0,
    details: DEBUG_MODE ? lastError.stack : undefined,
    rawResponse: DEBUG_MODE && responseData ? responseData : undefined,
  }), { status: 500, headers: corsHeaders })
}
