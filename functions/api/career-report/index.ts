/**
 * AI Career Report Generation API
 * POST /api/career-report
 * Body: { answers, role, years, totalScore }
 * Uses DashScope qwen-plus to generate 7-section career report
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
  if (ALLOWED_ORIGINS.includes(origin)) return true
  if (origin.match(/^https:\/\/[a-z0-9-]+\.aishield-lab\.pages\.dev$/)) return true
  return false
}

const SYSTEM_PROMPT = `你是AIShield Lab的职业规划AI顾问，专注于AI安全领域。根据用户的测评数据，生成一份专业的AI安全职业规划报告。

报告必须包含以下7个板块，每个板块用 ## 标题分隔：

## 职业画像
根据用户的背景硬指标和职业稳定性维度，描绘当前职业状态和核心特征。2-3句话。

## 目标岗位匹配
推荐3-5个最适合的目标岗位，按匹配度排序。每个岗位包含：岗位名称、匹配理由（1句）、薪资范围。参考：AI安全工程师40-80K、AI安全架构师80-150K、LLM安全研究员60-100K、AI安全治理专家70-120K、AI红队工程师50-90K。

## 差距拆解
分析用户当前能力与目标岗位的核心差距，分3-5个要点，每个要点包含：差什么、怎么补、预计时间。

## 6月行动方案
制定分阶段的6个月学习计划，按月划分，每月包含：阶段目标、核心任务、推荐资源类型。

## 认证优先级
推荐3-4个认证，按优先级排序。每个包含：认证名称、优先级（强烈推荐/推荐/可选）、理由。参考：CISP-PTE、CISSP、AWS Security Specialty、ISO 42001 Lead Auditor。

## 薪资对标
根据用户背景和目标方向，给出薪资区间预测和谈判建议。包含：当前估值、6个月后预期、1年后预期、谈判策略。

## 简历定位建议
给出简历关键词、核心卖点、需要弱化的点。2-3句话。

报告要求：
- 数据驱动，引用行业数据
- 具体可操作，不说空话
- 语气专业但不冰冷
- 总字数1500-2500字`

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
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

  // Rate limit: 3 requests per IP per hour
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
  const rateKey = `career_report_${clientIP}`
  // Simple rate limit via CF cache (best-effort)
  const rateLimit = parseInt((await env.CAREER_RATE_LIMIT?.get(rateKey)) || '0', 10)
  if (rateLimit >= 3) {
    return new Response(JSON.stringify({
      error: '请求过于频繁，请一小时后再试',
    }), { status: 429, headers: corsHeaders })
  }
  try {
    await env.CAREER_RATE_LIMIT?.put(rateKey, String(rateLimit + 1), { expirationTtl: 3600 })
  } catch {}

  // Require authentication — prevents anonymous API quota abuse
  const token = extractToken(request)
  if (!token || !env.JWT_SECRET) {
    return new Response(JSON.stringify({ error: '请先登录后使用' }), {
      status: 401, headers: corsHeaders,
    })
  }
  const decoded = await verifyJWT(token, env.JWT_SECRET)
  if (!decoded) {
    return new Response(JSON.stringify({ error: '登录已过期，请重新登录' }), {
      status: 401, headers: corsHeaders,
    })
  }

  // Validate API key
  if (!env.DASHSCOPE_API_KEY) {
    return new Response(JSON.stringify({
      error: '服务端配置错误，请联系管理员',
    }), { status: 500, headers: corsHeaders })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: '请求参数格式错误' }), { status: 400, headers: corsHeaders })
  }

  const { answers, role, years, totalScore } = body

  if (!answers || !totalScore) {
    return new Response(JSON.stringify({ error: '缺少必要参数' }), { status: 400, headers: corsHeaders })
  }

  // Build user message from answers
  const answerSummary = Object.entries(answers as Record<string, string[]>)
    .map(([dim, vals]) => {
      const dimNames: Record<string, string> = {
        skill: '技能水平',
        direction: '职业方向',
        experience: '实战经验',
        background: '背景硬指标',
        stability: '职业稳定性',
        certification: '认证与学习',
      }
      return `${dimNames[dim] || dim}: ${(vals as string[]).join('、')}`
    })
    .join('\n')

  const userMessage = `用户测评数据：
${answerSummary}

当前角色: ${role || '未填写'}
工作年限: ${years || '未填写'}
综合得分: ${totalScore}/6

请根据以上数据生成完整的7板块AI安全职业规划报告。`

  try {
    const resp = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      console.error('DashScope error:', resp.status, errText)
      return new Response(JSON.stringify({
        error: '报告生成失败，请稍后重试',
      }), { status: 502, headers: corsHeaders })
    }

    const data = await resp.json() as any
    const report = data.choices?.[0]?.message?.content || ''

    if (!report) {
      return new Response(JSON.stringify({
        error: '报告生成失败，请重新尝试',
      }), { status: 502, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ report }), { headers: corsHeaders })
  } catch (err: any) {
    console.error('Career report error:', err.message)
    return new Response(JSON.stringify({
      error: '服务异常，请稍后重试',
    }), { status: 500, headers: corsHeaders })
  }
}
