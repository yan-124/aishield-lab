// Cloudflare Worker — Coze API 代理
// 部署后 Token 只存在于 Workers 环境变量中，前端不可见
// 路径：/api/coze/chat

export default {
  async fetch(request, env) {
    // 只允许 POST 方法
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    // 从环境变量读取 Token（在 Cloudflare Dashboard 设置）
    const COZE_TOKEN = env.COZE_TOKEN || ''
    if (!COZE_TOKEN) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    try {
      const body = await request.json()

      // 转发请求到 Coze API（SSE 流式）
      const cozeResponse = await fetch('https://api.coze.cn/v3/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${COZE_TOKEN}`,
        },
        body: JSON.stringify(body),
      })

      if (!cozeResponse.ok) {
        const errText = await cozeResponse.text()
        return new Response(JSON.stringify({ error: `Coze API error: ${cozeResponse.status}`, detail: errText }), {
          status: cozeResponse.status,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }

      // SSE 流式透传
      return new Response(cozeResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Proxy error', detail: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
  }
}
