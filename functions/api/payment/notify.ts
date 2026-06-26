/**
 * 虎皮椒支付回调通知
 * GET/POST /api/payment/notify
 * 虎皮椒在支付成功后回调此接口，返回 "success" 确认收到
 */

import { verifySign } from '../../_utils/payment'

export async function onRequestGet(context: any) {
  return handleNotify(context)
}

export async function onRequestPost(context: any) {
  return handleNotify(context)
}

async function handleNotify(context: any) {
  const { request, env } = context

  try {
    const url = new URL(request.url)
    const params: Record<string, string> = {}

    // 虎皮椒可能通过 query params 或 form body 发送通知
    if (request.method === 'GET') {
      url.searchParams.forEach((v, k) => { params[k] = v })
    } else {
      const formData = await request.formData()
      formData.forEach((v, k) => { params[k] = v as string })
    }

    // 验证签名
    if (!env.HUPIJIAO_APP_SECRET || !verifySign(params, env.HUPIJIAO_APP_SECRET)) {
      return new Response('fail: invalid signature', { status: 400 })
    }

    // 验证支付状态
    if (params.status === 'success' || params.pay_status === 'success') {
      // 支付成功 — 写入 KV 持久化订单记录
      const orderId = params.trade_order_id || params.out_trade_order || 'unknown'
      const paymentRecord = {
        orderId,
        amount: params.total_fee || '0',
        status: 'success',
        paidAt: new Date().toISOString(),
        rawParams: {
          trade_order_id: params.trade_order_id,
          total_fee: params.total_fee,
          open_order_id: params.open_order_id,
          transaction_id: params.transaction_id,
        },
      }

      // Write to KV for server-side payment tracking
      if (env.AUTH_KV) {
        try {
          await env.AUTH_KV.put(
            `payment:${orderId}`,
            JSON.stringify(paymentRecord),
            { expirationTtl: 86400 * 90 } // 90 days
          )
        } catch (kvErr) {
          console.error('KV write failed:', kvErr)
        }
      }

      console.log(`Payment success: ${orderId}, amount: ${params.total_fee}`)
      return new Response('success', { status: 200 })
    }

    return new Response('fail: payment not success', { status: 400 })
  } catch (err: any) {
    console.error('Notify error:', err.message)
    return new Response('fail', { status: 500 })
  }
}
