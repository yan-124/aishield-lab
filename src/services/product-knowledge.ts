/**
 * 产品知识库服务
 * 从 /product-knowledge.json 读取单一真相源，供 Shieldy / 面试搭子 / 教学助手注入 system prompt
 * 改 JSON 文件即生效，不用改代码
 */

export interface ProductKnowledge {
  version: string
  updatedAt: string
  platform: {
    name: string
    domain: string
    positioning: string
    tagline: string
  }
  features: {
    free: string[]
    paid: Array<{
      name: string
      price: string
      priceDisplay: string
      type: string
      duration: string
      content: string
      process: string
      delivery: string
      entry: string
    }>
    notAvailable: string[]
  }
  freeBoundary: {
    guest: string
    loggedIn: string
    paidOnly: string
  }
  contact: {
    wechat: string
    note: string
    entry: string
    qrCode: string
  }
  aiRules: {
    productName: string
    pricing: string
    serviceFlow: string
    freeFeatures: string
    contactGuidance: string
    forbidden: string[]
  }
}

let cachedKnowledge: ProductKnowledge | null = null
let fetchPromise: Promise<ProductKnowledge | null> | null = null

/** 获取产品知识库（带缓存，避免重复请求） */
export async function getProductKnowledge(): Promise<ProductKnowledge | null> {
  if (cachedKnowledge) return cachedKnowledge
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch('/product-knowledge.json?t=' + Date.now())
    .then(r => {
      if (!r.ok) return null
      return r.json()
    })
    .then((data: ProductKnowledge | null) => {
      cachedKnowledge = data
      return data
    })
    .catch(() => null)

  return fetchPromise
}

/** 将知识库转为 system prompt 片段，供大模型注入 */
export function knowledgeToPrompt(k: ProductKnowledge): string {
  const paidList = k.features.paid
    .map(p => `  · ${p.name} ¥${p.priceDisplay}（${p.type}）：${p.content}。${p.process}`)
    .join('\n')

  const notAvail = k.features.notAvailable.length > 0
    ? `\n- 暂未开放：${k.features.notAvailable.join('、')}`
    : ''

  return `## 产品知识库（权威信息，回答时必须以此为准）

### 平台定位
${k.platform.positioning}。${k.platform.tagline}

### 免费功能（登录即可用）
${k.features.free.map(f => `- ${f}`).join('\n')}

### 付费产品
${paidList}${notAvail}

### 免费与付费边界
- ${k.freeBoundary.guest}
- ${k.freeBoundary.loggedIn}
- ${k.freeBoundary.paidOnly}

### 联系方式
- 微信号：${k.contact.wechat}（${k.contact.note}）
- ${k.contact.entry}

### AI回答约束（必须严格遵守）
1. ${k.aiRules.productName}
2. ${k.aiRules.pricing}
3. ${k.aiRules.serviceFlow}
4. ${k.aiRules.freeFeatures}
5. ${k.aiRules.contactGuidance}
${k.aiRules.forbidden.map(f => `6. ${f}`).join('\n')}`
}
