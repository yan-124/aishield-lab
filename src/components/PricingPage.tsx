import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { motion } from 'framer-motion'
import { Check, Sparkles, ArrowLeft, Zap, Crown, ChevronRight, Building2, Infinity as InfinityIcon } from 'lucide-react'

const freeFeatures = [
  '前5关 Agent 安全靶场',
  '知识库预览（前300字）',
  '视频预览（前3分钟）',
  '面试搭子（每天3次）',
  'Shieldy AI助教',
  '跑马灯新闻',
]

const memberFeatures = [
  '全部25关 Agent 安全靶场',
  '全知识库（无字数限制）',
  '全视频（无时长限制）',
  '面试搭子（无限次）',
  'Shieldy AI助教',
  '持续更新',
]

const services = [
  {
    name: '1v1职业规划',
    desc: '学长1v1语音咨询，岗位定位 · 学习路径 · 入行规划',
    icon: '🎯',
  },
  {
    name: '简历精修',
    desc: 'AI安全岗位简历定向优化，学长逐句改写',
    icon: '📝',
  },
  {
    name: '学长模拟面',
    desc: '学长亲自模拟面试 + 面试后辅助复盘',
    icon: '🎤',
  },
  {
    name: '全流程陪跑',
    desc: '职业规划+简历精修+模拟面+持续督学，4-6周',
    icon: '🚀',
    hot: true,
  },
]

const FAQ = [
  { q: '免费版有什么限制？', a: '免费可体验前5关靶场、知识库文章前300字、视频前3分钟、面试搭子每天3次。购买会员后解锁全部25关靶场、完整知识库和视频、面试搭子无限次。' },
  { q: '会员三种套餐怎么选？', a: '月度19.9元适合短期体验；年度99元（月均8.25元）最划算；终身299元一次买断+持续更新，以后涨价也不影响你。推荐年度或终身。' },
  { q: '1v1服务怎么购买？', a: '1v1服务不在网站直接收费。点击「联系学长」加微信，跟学长沟通需求后微信转账，学长亲自服务。' },
  { q: '全流程陪跑包含什么？', a: '4-6周全流程陪伴：包含职业规划、简历精修、模拟面试、持续督学答疑等。具体方案加微信与学长沟通定制。' },
  { q: '企业服务怎么对接？', a: '点击导航栏「企业版」提交需求，我们提供AI安全内训、安全测评、定制靶场等服务，销售会在48小时内联系你。' },
]

const TRUST_ITEMS = ['会员持续更新', '学长亲自服务', '数据安全加密', '48小时内响应']

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
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>免费体验 · 会员订阅 · 1v1定制服务</p>
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

        {/* ── 第一层：免费体验 + 会员订阅 ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 max-w-3xl mx-auto">
          {/* 免费体验 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl p-6 flex flex-col"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Zap size={22} style={{ color: '#60A5FA' }} className="mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">免费体验</h3>
            <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>注册即用，不限时</p>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-3xl font-black" style={{ color: '#60A5FA' }}>¥0</span>
            </div>
            <div className="space-y-2.5 flex-1 mb-6">
              {freeFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check size={13} style={{ color: '#60A5FA' }} className="shrink-0" />
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'range' })}
              className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              免费开始学习
            </button>
          </motion.div>

          {/* 会员订阅 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="relative rounded-2xl p-6 flex flex-col"
            style={{
              background: 'linear-gradient(180deg, rgba(167,139,250,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(167,139,250,0.2)',
            }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: '#A78BFA', color: '#0d1117' }}>推荐</div>
            <div className="flex items-center gap-2 mb-3">
              <Crown size={22} style={{ color: '#A78BFA' }} />
              <InfinityIcon size={16} style={{ color: '#A78BFA' }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">会员订阅</h3>
            <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>解锁全部内容，持续更新</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black" style={{ color: '#A78BFA' }}>¥19.9</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>/月起</span>
            </div>
            <div className="flex gap-3 mb-4">
              <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: 'rgba(167,139,250,0.1)', color: '#A78BFA' }}>月度 ¥19.9</span>
              <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: 'rgba(167,139,250,0.1)', color: '#A78BFA' }}>年度 ¥99</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(167,139,250,0.2)', color: '#C4B5FD', border: '1px solid rgba(167,139,250,0.3)' }}>终身 ¥299</span>
            </div>
            <div className="space-y-2.5 flex-1 mb-6">
              {memberFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check size={13} style={{ color: '#A78BFA' }} className="shrink-0" />
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={() => window.dispatchEvent(new Event('open-payment-modal'))}
              className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)', color: '#0d1117' }}>
              开通会员
            </button>
          </motion.div>
        </div>

        {/* ── 第二层：1v1定制服务 ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white">1v1 定制服务</h2>
            <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>学长亲自服务</span>
          </div>
          <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>不在网站直接收费，加微信私域成交</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {services.map((s, idx) => (
              <motion.div key={s.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className="relative rounded-xl p-4 flex flex-col"
                style={{
                  background: s.hot ? 'linear-gradient(180deg, rgba(167,139,250,0.08) 0%, rgba(255,255,255,0.02) 100%)' : 'rgba(255,255,255,0.02)',
                  border: s.hot ? '1px solid rgba(167,139,250,0.25)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                {s.hot && (
                  <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ background: '#A78BFA', color: '#0d1117' }}>热门</div>
                )}
                <div className="text-2xl mb-2">{s.icon}</div>
                <h4 className="text-sm font-bold text-white mb-1">{s.name}</h4>
                <p className="text-[10px] mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.desc}</p>
                <button onClick={() => window.dispatchEvent(new Event('open-consult-modal'))}
                  className="w-full py-2 rounded-lg text-[11px] font-semibold cursor-pointer transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  加微信咨询
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── 第三层：企业服务 ── */}
        <div className="mb-12">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <Building2 size={28} style={{ color: '#60A5FA' }} />
              <div>
                <h3 className="text-base font-bold text-white mb-1">企业服务</h3>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>AI安全内训 · 安全测评 · 定制靶场 · ¥8K-30K/项目</p>
              </div>
            </div>
            <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'enterprise' })}
              className="px-6 py-2.5 rounded-lg font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer whitespace-nowrap">
              企业咨询
            </button>
          </motion.div>
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
          免费体验 · 会员19.9元/月起 · 1v1服务加微信 · 企业服务另议
        </p>
      </div>
    </div>
  )
}
