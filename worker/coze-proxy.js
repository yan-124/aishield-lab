// Cloudflare Worker — Coze API 代理
// 部署后 Token 只存在于 Workers 环境变量中，前端不可见
// 路径：/api/coze/chat

const ALLOWED_ORIGINS = [
  'https://aiseclearn.com',
  'https://www.aiseclearn.com',
  'http://localhost:5201',
  'http://127.0.0.1:5201',
]
function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin') || ''
  if (ALLOWED_ORIGINS.includes(origin)) return origin
  if (origin.match(/^https:\/\/[a-z0-9-]+\.aishield-lab\.pages\.dev$/)) return origin
  return ALLOWED_ORIGINS[0]
}

export default {
  async fetch(request, env) {
    // 只允许 POST 方法
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': getAllowedOrigin(request) },
      })
    }

    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
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
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': getAllowedOrigin(request) },
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
        return new Response(JSON.stringify({ error: `Coze API error: ${cozeResponse.status}` }), {
          status: cozeResponse.status,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': getAllowedOrigin(request) },
        })
      }

      // SSE 流式透传
      return new Response(cozeResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
        },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Proxy error' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': getAllowedOrigin(request) },
      })
    }
  }
}
