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

const DEFAULT_PRODUCT_TITLE = 'AIShield Lab - 月度会员'
const DEFAULT_PRODUCT_PRICE = '19.9'
// Server-side amount whitelist — prevents client-side price manipulation
// 网站直接收钱的产品：会员订阅（月度19.9 / 年度99 / 终身299）
// 虎皮椒 total_fee 是 decimal(18,2)，文档说"没小数位不用强制保留2位小数"
// 所以 19.90 → 19.9，99.00 → 99，299.00 → 299
const ALLOWED_AMOUNTS = new Set(['9.9', '9.90', '19.9', '19.90', '39.9', '39.90', '69.9', '69.90', '99', '99.00', '129.9', '129.90', '299', '299.00', '299.9', '299.90', '499.9', '499.90'])
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

  // 验证 orderId 格式（防止注入和路径遍历）
  if (!orderId || typeof orderId !== 'string' || !/^[a-zA-Z0-9_-]{10,64}$/.test(orderId)) {
    return new Response(JSON.stringify({ error: '无效的订单号格式' }), { status: 400, headers: corsHeaders })
  }

  // Only allow whitelisted amounts — ignore arbitrary client-provided values
  const finalAmount = (amount && ALLOWED_AMOUNTS.has(amount)) ? amount : DEFAULT_PRODUCT_PRICE
  const finalTitle = title || DEFAULT_PRODUCT_TITLE

  // 虎皮椒 total_fee 是 decimal(18,2)，去掉末尾多余的零避免签名不一致
  // 19.90 → "19.9"，99.00 → "99"，299.00 → "299"
  // 保留两位小数，确保 19.90 不会变成 19.9（某些支付网关对格式敏感）
  const normalizedAmount = Number(finalAmount).toFixed(2)

  // Debug: log all payment creation details
  console.log('[PAYMENT_CREATE]', JSON.stringify({ orderId, finalAmount, normalizedAmount, title: finalTitle, appid: env.HUPIJIAO_APP_ID?.slice(0,6) }))

  const params: Record<string, string | number> = {
    version: '1.1',
    appid: env.HUPIJIAO_APP_ID,
    trade_order_id: orderId,
    total_fee: Number(normalizedAmount),
    title: finalTitle,
    time: Math.floor(Date.now() / 1000),
    notify_url: NOTIFY_URL,
    return_url: RETURN_URL,
    nonce_str: generateNonceStr(16),
  }

  params.hash = generateSign(params, env.HUPIJIAO_APP_SECRET)

  // 预先写入订单记录到 KV，供回调时验证订单真实性
  const orderRecord = {
    orderId,
    amount: finalAmount,
    title: finalTitle,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  if (env.AUTH_KV) {
    try {
      await env.AUTH_KV.put(
        `payment_order:${orderId}`,
        JSON.stringify(orderRecord),
        { expirationTtl: 86400 * 7 } // 7天过期
      )
    } catch (kvErr) {
      console.error('Failed to store order record:', kvErr)
      return new Response(JSON.stringify({ error: '订单创建失败，请重试' }), { status: 500, headers: corsHeaders })
    }
  }

  const MAX_RETRIES = 3
  const REQUEST_TIMEOUT = 10000
  let lastError: any
  let responseData: any = null

  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

      const resp = await fetch(`${HUPIJIAO_API_BASE}/payment/do.html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
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

      if (responseData.errcode === 0 && (responseData.url || responseData.url_qrcode)) {
        console.log('[PAYMENT_RESPONSE]', JSON.stringify({ orderId, total_fee: normalizedAmount, responseAmount: responseData.total_fee, responseUrl: responseData.url?.slice(0,60) }))
        return new Response(JSON.stringify({
          orderId,
          url: responseData.url || '',
          urlQrcode: responseData.url_qrcode || '',
          url_qrcode: responseData.url_qrcode || '',
          // DEBUG: 临时添加，用于排查金额问题，确认后删除
          _debug: { total_fee: normalizedAmount, title: finalTitle, raw_response_amount: responseData.total_fee || 'N/A' }
        }), { headers: corsHeaders })
      } else {
        throw new Error(responseData.errmsg || responseData.msg || '创建支付订单失败')
      }

    } catch (err: any) {
      lastError = err
      if (retry < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 500 * (retry + 1)))
      }
    }
  }

  return new Response(JSON.stringify({
    error: '支付服务异常: ' + (lastError.message || 'unknown'),
    errCode: responseData?.errcode || 0,
  }), { status: 500, headers: corsHeaders })
}
