import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { motion } from 'framer-motion'
import { Check, Sparkles, ArrowLeft, Zap, Shield, Crown, ChevronRight, Users } from 'lucide-react'

const plans = [
  {
    id: 'free',
    name: '免费版',
    price: '¥0',
    period: '',
    icon: Zap,
    color: '#60A5FA',
    badge: '',
    desc: '体验靶场玩法，感受AI安全魅力',
    features: [
      { text: '3关靶场免费体验', included: true },
      { text: '知识库浏览（部分）', included: true },
      { text: '每日3次面试模拟', included: true },
      { text: '社区讨论参与', included: true },
      { text: '全部25关靶场', included: false },
      { text: '无限次面试训练', included: false },
      { text: 'AI能力图谱', included: false },
      { text: '1对1学长答疑', included: false },
    ]
  },
  {
    id: 'student',
    name: '学员版',
    price: '¥29',
    period: '/月',
    icon: Shield,
    color: '#A78BFA',
    badge: '推荐',
    desc: '求职者首选，性价比最高',
    features: [
      { text: '全部25关靶场', included: true },
      { text: '知识库全部文章', included: true },
      { text: '无限次面试训练', included: true },
      { text: 'AI能力图谱 + 学习路径', included: true },
      { text: '认证模拟考试', included: true },
      { text: 'promptfoo深度测试', included: false },
      { text: '1对1学长答疑', included: false },
      { text: '简历优化服务', included: false },
    ]
  },
  {
    id: 'expert',
    name: '专家版',
    price: '¥99',
    period: '/月',
    icon: Crown,
    color: '#FBBF24',
    badge: '深度',
    desc: '职场进阶，含1对1专属服务',
    features: [
      { text: '全部25关靶场', included: true },
      { text: '无限次面试训练', included: true },
      { text: 'AI能力图谱 + 学习路径', included: true },
      { text: '认证模拟考试', included: true },
      { text: 'promptfoo深度测试', included: true },
      { text: '1对1学长答疑（每月2次）', included: true },
      { text: '简历优化 + 内推机会', included: true },
      { text: '企业定制靶场', included: false },
    ]
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: '¥999',
    period: '/月起',
    icon: Users,
    color: '#34D399',
    badge: '定制',
    desc: '企业级安全培训与团队管理',
    features: [
      { text: '全部专家版功能', included: true },
      { text: '团队管理后台', included: true },
      { text: '批量能力测评', included: true },
      { text: '定制靶场关卡', included: true },
      { text: 'API 接口调用', included: true },
      { text: '安全评估报告定制', included: true },
      { text: '专属安全顾问', included: true },
      { text: '培训工作坊（季度）', included: true },
    ]
  }
]

const FAQ = [
  { q: '免费版够用吗？', a: '免费版可以体验前3关靶场和每日3次面试模拟，适合先感受平台风格。如果认真准备AI安全方向求职，建议开通学员版解锁全部内容。' },
  { q: '学员版和专家版有什么区别？', a: '学员版适合自主学习的求职者；专家版额外包含promptfoo深度测试、1对1学长答疑（每月2次）和简历优化+内推机会，适合求职冲刺期。' },
  { q: '可以随时取消订阅吗？', a: '支持随时取消，取消后当月仍可使用到月底。学员版/专家版支持7天无理由退款。' },
  { q: '企业版最低几人起订？', a: '企业版5人起订，含团队管理后台和专属安全顾问。支持定制靶场关卡和企业培训工作坊，支持对公转账并可开具增值税发票。' },
  { q: '内推机会是怎么运作的？', a: '专家版用户完成能力测评后，如达到合格线，学长和合作企业会提供内推机会。覆盖互联网、金融、安全厂商等多类型企业的 AI 安全团队。' },
  { q: '支持哪些支付方式？', a: '目前支持微信支付和支付宝。企业版支持对公转账，可开具增值税发票。学生凭学生证可享学员版8折优惠。' },
]

const TRUST_ITEMS = ['7天无理由退款', '学生证享8折', '随时取消订阅', '数据安全加密']

export const PricingPage = () => {
  const { dispatch } = useAppContext()
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen" style={{ background: '#060B14' }}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })}
          className="flex items-center gap-2 text-sm cursor-pointer mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <ArrowLeft size={16} /> 返回首页
        </button>

        {/* header */}
        <div className="mb-10">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ background: 'rgba(167,139,250,0.1)' }}>
              <Sparkles size={24} className="text-purple-400" />
            </div>
            <div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide"
                style={{ color: '#A78BFA', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
                PRICING
              </span>
              <h1 className="text-4xl font-black mb-1" style={{ color: '#A78BFA' }}>选择适合你的方案</h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>AI安全求职专属 · 从入门到内推一条龙</p>
            </div>
          </div>
        </div>

        {/* trust badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {TRUST_ITEMS.map(item => (
            <div key={item} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <Check size={12} style={{ color: '#34D399' }} /> {item}
            </div>
          ))}
        </div>

        {/* pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {plans.map((plan, idx) => {
            const Icon = plan.icon
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className="relative rounded-2xl p-5 flex flex-col"
                style={{
                  background: plan.badge ? 'linear-gradient(180deg, rgba(167,139,250,0.06) 0%, rgba(255,255,255,0.02) 100%)' : 'rgba(255,255,255,0.02)',
                  border: plan.badge ? `1px solid ${plan.color}33` : '1px solid rgba(255,255,255,0.06)',
                }}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: plan.color, color: '#0d1117' }}>{plan.badge}</div>
                )}
                <div className="mb-5">
                  <Icon size={22} style={{ color: plan.color }} className="mb-3" />
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black" style={{ color: plan.color }}>{plan.price}</span>
                    {plan.period && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{plan.period}</span>}
                  </div>
                </div>
                <div className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {f.included ? <Check size={13} style={{ color: plan.color }} className="shrink-0" /> : <span className="w-[13px] h-[13px] rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />}
                      <span className="text-[11px]" style={{ color: f.included ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>{f.text}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:opacity-90"
                  style={{
                    background: plan.id === 'free' ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                    color: plan.id === 'free' ? 'rgba(255,255,255,0.5)' : '#0d1117',
                    border: plan.id === 'free' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  }}>
                  {plan.id === 'free' ? '当前免费' : plan.id === 'student' ? '立即开通' : plan.id === 'expert' ? '升级专家版' : '联系销售'}
                </button>
              </motion.div>
            )
          })}
        </div>

        {/* feature comparison table */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-white text-center mb-6">功能对比</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: '640px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>功能</th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: '#60A5FA' }}>免费版</th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: '#A78BFA' }}>学员版</th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: '#FBBF24' }}>专家版</th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: '#34D399' }}>企业版</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['靶场关卡', '3关', '25关', '25关+定制', '无限+定制'],
                  ['知识库', '部分浏览', '全部文章', '全部+离线', '全部+定制'],
                  ['面试训练', '3次/天', '无限次', '无限次+双AI', '团队测评'],
                  ['AI能力图谱', '-', '✅', '✅', '团队报告'],
                  ['promptfoo测试', '-', '-', '✅', '✅'],
                  ['1对1学长答疑', '-', '-', '每月2次', '专属顾问'],
                  ['简历优化+内推', '-', '-', '✅', '企业内推'],
                  ['团队管理', '-', '-', '-', '✅'],
                ].map(([feature, ...vals], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="py-3 px-4 font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{feature}</td>
                    {vals.map((v, j) => (
                      <td key={j} className="text-center py-3 px-4" style={{ color: v === '-' ? 'rgba(255,255,255,0.15)' : v === '✅' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.5)' }}>
                        {v === '-' ? <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span> : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white text-center mb-6">常见问题</h2>
          <div className="space-y-2 max-w-2xl mx-auto">
            {FAQ.map((faq, i) => (
              <div key={i} className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-left cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <span>{faq.q}</span>
                  <ChevronRight size={14} style={{ transform: expandedFaq === i ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s', color: 'rgba(255,255,255,0.3)' }} />
                </button>
                {expandedFaq === i && (
                  <div className="px-5 pb-4 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
          所有方案均支持7天无理由退款 · 学生凭学生证可享学员版8折优惠 · 随时取消订阅
        </p>
      </div>
    </div>
  )
}
