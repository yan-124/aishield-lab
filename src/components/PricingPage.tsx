import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { motion } from 'framer-motion'
import { Check, X, Sparkles, ArrowLeft, Zap, Shield, Crown, ChevronRight } from 'lucide-react'

const plans = [
  {
    id: 'basic', name: '入门版', price: '¥49', period: '/月', icon: Zap, color: '#60A5FA', badge: '',
    desc: '适合刚接触AI安全的学习者',
    features: [
      { text: '25关靶场全部开放', included: true },
      { text: '知识库全部文章', included: true },
      { text: '面试训练场基础功能', included: true },
      { text: '社区讨论参与', included: true },
      { text: 'AI盾牌助手对话', included: false },
      { text: '职业引导完整报告', included: false },
      { text: '漏洞分析报告生成', included: false },
      { text: '1对1导师辅导', included: false },
    ]
  },
  {
    id: 'expert', name: '专家版', price: '¥149', period: '/月', icon: Shield, color: '#A78BFA', badge: '推荐',
    desc: '全面掌握AI安全攻防，最受欢迎',
    features: [
      { text: '25关全模型场', included: true },
      { text: '知识库全部文章', included: true },
      { text: '面试训练场双AI陪练', included: true },
      { text: '社区讨论 + 优先展示', included: true },
      { text: 'AI盾牌助手无限对话', included: true },
      { text: '职业引导完整报告', included: true },
      { text: '漏洞分析报告生成', included: true },
      { text: '1对1导师辅导', included: false },
    ]
  },
  {
    id: 'enterprise', name: '企业版', price: '¥1,999', period: '/月', icon: Crown, color: '#FBBF24', badge: '定制',
    desc: '企业级安全培训与团队管理',
    features: [
      { text: '全部专家版功能', included: true },
      { text: '自定义靶场关卡', included: true },
      { text: '团队管理后台', included: true },
      { text: 'API 接口调用', included: true },
      { text: '安全评估报告定制', included: true },
      { text: '1对1安全顾问', included: true },
      { text: '培训工作坊（季度）', included: true },
      { text: 'SLA 保障 + 专属支持', included: true },
    ]
  }
]

const FAQ = [
  { q: '靶场难度适合什么水平？', a: '靶场从3大模型分组，难度逐步递进。入门用户可以从基础Prompt注入学起，专家用户可以挑战高级绕过技巧和实战对抗。' },
  { q: '双AI面试训练场是什么？', a: '专家版独有功能：一个AI模拟面试官提问，另一个AI作为教练实时点评你的回答，帮助你针对性提升面试表现。' },
  { q: '可以随时取消订阅吗？', a: '所有方案支持7天无理由退款，取消后当月仍可使用到月底。不设自动续费陷阱。' },
  { q: '企业版最低几人起订？', a: '企业版5人起订，含团队管理后台和专属安全顾问。支持自定义靶场关卡和培训工作坊。' },
  { q: 'AI盾牌助手能回答哪些问题？', a: 'AI盾牌助手覆盖AI安全知识问答、靶场攻略提示、面试题解析、职业路径规划等场景。专家版支持无限对话，入门版暂不开放。' },
  { q: '职业引导报告包含什么？', a: '专家版职业引导报告包含：能力画像评估、岗位匹配推荐、职业路径规划、面试重点方向。由AI分析你的学习数据后生成个性化报告。' },
  { q: '支持哪些支付方式？', a: '目前支持微信支付和支付宝。企业版支持对公转账，可开具增值税发票。' },
]

const TRUST_ITEMS = ['7天无理由退款', '学生证享8折', '无自动续费', '数据安全加密']

export const PricingPage = () => {
  const { dispatch } = useAppContext()
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen" style={{ background: '#060B14' }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })}
          className="flex items-center gap-2 text-sm cursor-pointer mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <ArrowLeft size={16} /> 返回首页
        </button>

        <div className="mb-10">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ background: 'rgba(251,191,36,0.1)' }}>
              <Crown size={24} className="text-amber-400" />
            </div>
            <div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide"
                style={{ color: '#FBBF24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                PRICING
              </span>
              <h1 className="text-4xl font-black  mb-1" style={{ color: '#FBBF24' }}>选择适合你的方案</h1>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {TRUST_ITEMS.map(item => (
            <div key={item} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <Check size={12} style={{ color: '#34D399' }} /> {item}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, idx) => {
            const Icon = plan.icon
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className="relative rounded-2xl p-6 flex flex-col"
                style={{
                  background: plan.badge === '推荐' ? 'linear-gradient(180deg, rgba(167,139,250,0.06) 0%, rgba(255,255,255,0.02) 100%)' : 'rgba(255,255,255,0.02)',
                  border: plan.badge === '推荐' ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: plan.color, color: '#fff' }}>{plan.badge}</div>
                )}
                <div className="mb-5">
                  <Icon size={22} style={{ color: plan.color }} className="mb-3" />
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black" style={{ color: plan.color }}>{plan.price}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{plan.period}</span>
                  </div>
                </div>
                <div className="space-y-3 flex-1 mb-6">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      {f.included ? <Check size={14} style={{ color: plan.color }} className="shrink-0" /> : <X size={14} style={{ color: 'rgba(255,255,255,0.15)' }} className="shrink-0" />}
                      <span className="text-xs" style={{ color: f.included ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>{f.text}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                  style={{
                    background: plan.badge === '推荐' ? 'linear-gradient(135deg, #A78BFA, #60A5FA)' : 'rgba(255,255,255,0.05)',
                    color: plan.badge === '推荐' ? 'white' : 'rgba(255,255,255,0.5)',
                    border: plan.badge === '推荐' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                  {plan.badge === '推荐' ? '立即订阅' : '选择方案'}
                </button>
              </motion.div>
            )
          })}
        </div>

        <div className="mb-16">
          <h2 className="text-xl font-bold text-white text-center mb-6">功能对比</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: '480px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>功能</th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: '#60A5FA' }}>入门版</th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: '#A78BFA' }}>专家版</th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: '#FBBF24' }}>企业版</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Prompt注入靶场', '10关基础', '10关+高级模式', '自定义关卡'],
                  ['知识库', '全部文章', '全部文章', '全部+定制内容'],
                  ['面试训练', '基础模式', '双AI陪练', '双AI+定制题库'],
                  ['AI助手', '-', '无限对话', '专属模型'],
                  ['职业引导', '简版结论', '完整报告', '定制方案'],
                  ['报告生成', '-', '漏洞分析', '安全评估定制'],
                  ['团队管理', '-', '-', '管理后台+API'],
                  ['专属支持', '-', '-', '1对1顾问+SLA'],
                ].map(([feature, ...vals], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="py-3 px-4 font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{feature}</td>
                    {vals.map((v, j) => (
                      <td key={j} className="text-center py-3 px-4" style={{ color: v === '-' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)' }}>
                        {v === '-' ? <X size={12} className="mx-auto" style={{ color: 'rgba(255,255,255,0.15)' }} /> : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
          所有方案均支持7天无理由退款 · 学生凭学生证可享8折优惠
        </p>
      </div>
    </div>
  )
}
