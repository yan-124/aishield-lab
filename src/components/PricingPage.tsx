import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { motion } from 'framer-motion'
import { Check, Sparkles, ArrowLeft, Zap, Crown, ChevronRight, MessageCircle } from 'lucide-react'

const plans = [
  {
    id: 'free',
    name: '免费体验',
    price: '¥0',
    period: '',
    icon: Zap,
    color: '#60A5FA',
    badge: '',
    desc: '全部学习功能，登录即用',
    features: [
      { text: '全部25关 Agent 安全靶场', included: true },
      { text: 'AI安全知识库', included: true },
      { text: '面试搭子（真题+简历）', included: true },
      { text: '双AI面试训练场', included: true },
      { text: 'Shieldy AI助教', included: true },
      { text: '一对一职业规划咨询', included: false },
    ]
  },
  {
    id: 'consult',
    name: '一对一职业规划咨询',
    price: '¥29.9',
    period: '/次',
    icon: Crown,
    color: '#A78BFA',
    badge: '热门',
    desc: '学长亲自1V1，付款后48小时内交付',
    features: [
      { text: '全部免费功能', included: true },
      { text: '30分钟1v1语音咨询', included: true },
      { text: '岗位定位建议', included: true },
      { text: '学习路径规划', included: true },
      { text: '简历/面试建议', included: true },
      { text: '入行时间规划', included: true },
    ]
  }
]

const FAQ = [
  { q: '免费版够用吗？', a: '免费版包含全部25关靶场、知识库、面试搭子、面试训练场和Shieldy助教，登录即可用，没有隐藏收费。如果需要一对一职业规划指导，可以预约29.9元的1v1咨询。' },
  { q: '一对一咨询怎么预约？', a: '在「职业诊断」页面点「预约1v1咨询」按钮，微信/支付宝扫码支付。付款后学长会在48小时内联系你，安排语音咨询。' },
  { q: '咨询是真人还是AI？', a: '真人。学长亲自根据你的情况做职业评估和规划建议，不是自动生成的报告。30分钟1v1语音咨询，覆盖岗位定位、学习路径、简历/面试建议、入行时间规划。' },
  { q: '支持什么支付方式？', a: '目前支持微信支付和支付宝扫码支付。' },
]

const TRUST_ITEMS = ['48小时内交付', '学长亲自服务', '学习功能全免费', '数据安全加密']

export const PricingPage = () => {
  const { dispatch } = useAppContext()
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen" style={{ background: '#060B14' }}>
      <div className="max-w-4xl mx-auto px-6 py-10">
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
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>学习全免费 · 1v1咨询29.9元</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16 max-w-3xl mx-auto">
          {plans.map((plan, idx) => {
            const Icon = plan.icon
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className="relative rounded-2xl p-6 flex flex-col"
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
                {plan.id === 'free' ? (
                  <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'range' })}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:opacity-90"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    免费开始学习
                  </button>
                ) : (
                  <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'career-guide' })}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, color: '#0d1117' }}>
                    预约1v1咨询
                  </button>
                )}
              </motion.div>
            )
          })}
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

        {/* 联系学长 */}
        <div className="text-center py-6 rounded-2xl mb-6"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.08), transparent 60%)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircle size={18} className="text-purple-400" />
            <span className="text-sm font-medium text-white">还有疑问？联系学长</span>
          </div>
          <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            微信号：AIShieldLab · 备注「AI安全」优先通过
          </p>
          <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'career-guide' })}
            className="px-6 py-2.5 rounded-lg font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer">
            预约一对一职业规划咨询
          </button>
        </div>

        <p className="text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
          学习功能全免费 · 一对一咨询29.9元/次 · 48小时内交付
        </p>
      </div>
    </div>
  )
}
