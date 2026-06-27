/**
 * 产品知识库服务
 * 从 /product-knowledge.json 读取单一真相源，供 Shieldy / 面试搭子 / 教学助手注入 system prompt
 * 改 JSON 文件即生效，不用改代码
 */

export interface MemberPlan {
  name: string
  price: string
  unit: string
}

export interface ServiceItem {
  name: string
  price: string
  unit: string
  content: string
  process: string
}

export interface ProductKnowledge {
  version: string
  updatedAt: string
  platform: {
    name: string
    domain: string
    positioning: string
    tagline: string
  }
  pricing: {
    free: {
      name: string
      price: number
      features: string[]
    }
    member: {
      name: string
      desc: string
      plans: MemberPlan[]
      features: string[]
    }
    services: ServiceItem[]
    enterprise: {
      name: string
      desc: string
      price: string
      process: string
    }
  }
  freeBoundary: {
    guest: string
    loggedIn: string
    memberOnly: string
    servicesOnly: string
  }
  contact: {
    wechat: string
    note: string
    entry: string
    qrCode: string
  }
  aiRules: {
    productName_1v1: string
    productName_mock: string
    pricing: string
    serviceFlow: string
    freeFeatures: string
    memberFeatures: string
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
  const memberPlans = k.pricing.member.plans
    .map(p => `${p.price}元${p.unit}`)
    .join(' / ')

  const serviceList = k.pricing.services
    .map(s => `  · ${s.name} ¥${s.price}（${s.unit}）：${s.content}。${s.process}`)
    .join('\n')

  return `## 产品知识库（权威信息，回答时必须以此为准）

### 平台定位
${k.platform.positioning}。${k.platform.tagline}

### 定价体系
**免费体验**：${k.pricing.free.features.join('、')}
**会员订阅**（${memberPlans}）：${k.pricing.member.features.join('、')}
**1v1定制服务**（加微信私域成交）：
${serviceList}
**企业服务**：${k.pricing.enterprise.desc}，${k.pricing.enterprise.price}元

### 免费与付费边界
- ${k.freeBoundary.guest}
- ${k.freeBoundary.loggedIn}
- ${k.freeBoundary.memberOnly}
- ${k.freeBoundary.servicesOnly}

### 联系方式
- 微信号：${k.contact.wechat}（${k.contact.note}）
- ${k.contact.entry}

### AI回答约束（必须严格遵守）
1. ${k.aiRules.productName_1v1}
2. ${k.aiRules.productName_mock}
3. ${k.aiRules.pricing}
4. ${k.aiRules.serviceFlow}
5. ${k.aiRules.freeFeatures}
6. ${k.aiRules.memberFeatures}
7. ${k.aiRules.contactGuidance}
${k.aiRules.forbidden.map((f, i) => `${i + 8}. ${f}`).join('\n')}`
}
