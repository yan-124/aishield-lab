/**
 * 虎皮椒支付工具集 - MD5 + 签名 + 验签
 * 虎皮椒 API 文档: https://www.xunhupay.com/doc/api/page/index.html
 */

// ═══════════════════════════════════════════════════
// MD5 — 使用 js-md5（经过广泛验证的纯 JS 实现，兼容 Cloudflare Workers）
// ═══════════════════════════════════════════════════

import md5 from 'js-md5'

export { md5 }

// ═══════════════════════════════════════════════════
// 虎皮椒签名工具
// ═══════════════════════════════════════════════════

export const HUPIJIAO_API_BASE = 'https://api.xunhupay.com'

/** 生成签名: 排序参数 → 拼接 → 直接追加 appsecret → MD5 → 大写 */
export function generateSign(params: Record<string, string>, appSecret: string): string {
  const sortedKeys = Object.keys(params).filter(k => params[k] && k !== 'hash').sort()
  const queryStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&')
  return md5(queryStr + appSecret)
}

/** 验证签名 */
export function verifySign(params: Record<string, string>, appSecret: string): boolean {
  const receivedHash = params.hash
  if (!receivedHash) return false
  const expectedHash = generateSign(params, appSecret)
  return receivedHash === expectedHash
}

/** 生成随机字符串 */
export function generateNonceStr(length = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/** 检查虎皮椒是否已配置 */
export function isHupijiaoConfigured(env: any): boolean {
  const isValidId = env.HUPIJIAO_APP_ID && typeof env.HUPIJIAO_APP_ID === 'string' && env.HUPIJIAO_APP_ID.length > 0
  const isValidSecret = env.HUPIJIAO_APP_SECRET && typeof env.HUPIJIAO_APP_SECRET === 'string' && env.HUPIJIAO_APP_SECRET.length > 0
  return isValidId && isValidSecret
}
