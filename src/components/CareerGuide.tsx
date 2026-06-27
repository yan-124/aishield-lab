import { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass, Brain, Shield, Target, ChevronDown, Sparkles,
  ArrowLeft, CheckCircle, TrendingUp, Award, Rocket,
  Users, Briefcase, FileText, Crown,
  Terminal, ChevronUp, MapPin, ScanLine
} from 'lucide-react'
// PaymentModal removed — 1v1 services redirect to WeChat private domain

// ═══════════════════════════════════════════════════
// 诊断维度（弱化理论，突出岗位匹配）
// ═══════════════════════════════════════════════════
const DIMENSIONS = [
  { id: 'skill', label: '技能匹配度', icon: Brain, color: '#60A5FA', desc: '对照目标岗位 JD，识别你已具备和欠缺的能力' },
  { id: 'direction', label: '岗位方向', icon: Compass, color: '#A78BFA', desc: '根据背景推荐最适合入手的招聘岗位' },
  { id: 'gap', label: '差距分析', icon: Target, color: '#34D399', desc: '量化你与目标岗位之间的关键技能缺口' },
  { id: 'cert', label: '认证建议', icon: Shield, color: '#FBBF24', desc: '匹配岗位要求的权威认证与备考路径' },
]

// ═══════════════════════════════════════════════════
// AI 安全招聘岗位（结果导向，不写具体薪资与公司）
// ═══════════════════════════════════════════════════
const ROLES = [
  {
    id: 'redteam',
    title: 'AI 红队测试工程师',
    icon: Terminal,
    color: '#F472B6',
    level: '初级 / 中级',
    cycle: '3-6 个月可投递',
    desc: '以攻击者视角对 LLM/Agent 进行提示注入、越狱、越权测试，输出可落地的漏洞报告。',
    jd: [
      '熟悉 OWASP LLM Top 10 攻防原理',
      '能独立设计 Prompt 注入与绕过用例',
      '具备自动化扫描与漏洞验证能力',
      '能撰写清晰的安全测试报告',
    ],
    skills: ['Prompt Injection', 'Jailbreak 测试', '自动化扫描', '报告撰写'],
    cert: 'OSCP / GWAPT',
  },
  {
    id: 'prompt',
    title: 'Prompt 安全工程师',
    icon: Shield,
    color: '#A78BFA',
    level: '中级',
    cycle: '3-6 个月可投递',
    desc: '设计防御性提示策略、输入过滤与输出护栏，降低企业 AI 应用被攻击风险。',
    jd: [
      '设计并维护系统提示词安全策略',
      '构建输入过滤与输出审计机制',
      '评估 RAG/Agent 场景下的安全风险',
      '协同算法与工程团队落地防护方案',
    ],
    skills: ['防御模式设计', '内容安全', 'RAG 安全', '护栏工程'],
    cert: 'Security+ / AI 安全认证',
  },
  {
    id: 'safety',
    title: 'AI Safety 研究员',
    icon: Brain,
    color: '#60A5FA',
    level: '中高级',
    cycle: '6-12 个月',
    desc: '研究模型对齐、对抗样本、红队数据集，推动模型更鲁棒、更可控。',
    jd: [
      '构建红队测试数据集与评估体系',
      '研究对抗样本与模型越狱机制',
      '设计模型安全对齐实验',
      '输出论文、专利或开源工具',
    ],
    skills: ['对抗训练', '评估体系', 'RLHF', '科研写作'],
    cert: '顶会 / 博士优先',
  },
  {
    id: 'architect',
    title: 'AI 安全架构师',
    icon: Crown,
    color: '#34D399',
    level: '高级 / 专家',
    cycle: '1-2 年',
    desc: '为企业设计端到端 AI 安全治理框架、合规流程与技术防线。',
    jd: [
      '制定企业级 AI 安全治理框架',
      '设计模型生命周期风险管理流程',
      '主导安全评估、审计与应急响应',
      '输出行业白皮书与标准建议',
    ],
    skills: ['安全架构', '合规治理', '风险建模', '跨团队协作'],
    cert: 'CISSP / CCSK',
  },
]

// ═══════════════════════════════════════════════════
// 通用能力模型（招聘岗位共性要求）
// ═══════════════════════════════════════════════════
const SKILL_MODEL = [
  { name: 'Prompt 攻防', level: 90, desc: '注入、越狱、绕过、防御设计' },
  { name: 'LLM 原理理解', level: 75, desc: 'Transformer、RLHF、上下文窗口' },
  { name: 'Python / 自动化', level: 70, desc: '脚本编写、扫描工具、CI/CD' },
  { name: 'RAG & Agent 安全', level: 65, desc: '知识库污染、工具调用越权' },
  { name: '安全报告与沟通', level: 80, desc: '漏洞报告、风险评估、跨团队推动' },
]

// ═══════════════════════════════════════════════════
// 成长路线图
// ═══════════════════════════════════════════════════
const ROADMAP = [
  {
    phase: '基础构建期',
    time: '0-3 个月',
    color: '#60A5FA',
    items: ['掌握 LLM 工作原理', '理解 OWASP LLM Top 10', '完成前 10 关靶场', '学习 Prompt 攻防基础'],
  },
  {
    phase: '实战强化期',
    time: '3-6 个月',
    color: '#A78BFA',
    items: ['攻克 OWASP LLM Top 10 全部靶场', '参与 CTF / 红队演练', '学习 RAG 与 Agent 安全', '建立个人漏洞库'],
  },
  {
    phase: '专项进阶期',
    time: '6-12 个月',
    color: '#F472B6',
    items: ['深入对抗样本与模型窃取', '输出技术博客/演讲', '获得 1-2 个权威认证', '主导企业 AI 安全项目'],
  },
  {
    phase: '专家沉淀期',
    time: '1-2 年+',
    color: '#34D399',
    items: ['设计企业级安全框架', '带团队 / 做咨询', '参与行业标准制定', '成为社区 KOL'],
  },
]

// ═══════════════════════════════════════════════════
// 能力自评问卷
// ═══════════════════════════════════════════════════
const QUIZ = [
  {
    q: '你的技术背景是？',
    options: ['在校学生 / 零基础', '传统网络安全从业者', '软件开发 / AI 算法', '产品经理 / 运营'],
  },
  {
    q: '你每周能投入学习时间？',
    options: ['少于 5 小时', '5-10 小时', '10-20 小时', '20 小时以上'],
  },
  {
    q: '你最感兴趣的方向？',
    options: ['Prompt 攻防与红队测试', '模型安全与对抗样本', 'AI 合规与治理', 'AI 安全工程落地'],
  },
  {
    q: '你的职业目标？',
    options: ['快速入门找工作', '转型跳槽', '成为领域专家', '创业 / 企业顾问'],
  },
]

// ═══════════════════════════════════════════════════
// 认证路径
// ═══════════════════════════════════════════════════
const CERTS = [
  { name: 'OWASP LLM Top 10', level: '入门', time: '2 周', value: '建立全局认知' },
  { name: 'CompTIA Security+', level: '基础', time: '1-2 月', value: '通用安全基础' },
  { name: 'GWAPT / OSWE', level: '进阶', time: '3-6 月', value: 'Web/API 渗透技能' },
  { name: 'CISSP', level: '专家', time: '6-12 月', value: '安全架构与治理' },
]

// ═══════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════
const FAQS = [
  { q: '零基础可以学 AI 安全吗？', a: '可以。建议从 OWASP LLM Top 10 和 Prompt 注入基础开始，配合靶场边学边练，3 个月左右可尝试初级岗位。' },
  { q: '学完能找到工作吗？', a: 'AI 安全人才缺口大。掌握靶场实战 + 1-2 个认证 + 项目经验，可大幅提升简历通过率与面试表现。' },
  { q: '需要会编程吗？', a: '基础岗位建议掌握 Python；红队/研究岗位需要较强的代码能力。我们提供从基础到进阶的学习路径。' },
  { q: '1v1咨询和免费报告有什么区别？', a: '免费报告由AI根据你的问卷回答生成方向性建议；1v1咨询是学长亲自做的人工服务，会结合你的背景深入沟通岗位定位、学习路径和简历/面试建议。具体服务内容和方式加微信与学长沟通。' },
]


export const CareerGuide = () => {
  const { dispatch } = useAppContext()
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [reportTier, setReportTier] = useState<'free' | 'standard' | 'enterprise'>('free')
  const [llmReport, setLlmReport] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  // 1v1 services no longer use direct payment — redirect to WeChat

  // 能力自评
  const [quizAnswers, setQuizAnswers] = useState<number[]>(new Array(QUIZ.length).fill(-1))
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  // Verify payment status from server (not just localStorage)
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const orderId = localStorage.getItem('career_report_unlocked')
        const savedTier = localStorage.getItem('career_report_tier')
        if (orderId && orderId !== 'true' && (savedTier === 'standard' || savedTier === 'enterprise')) {
          try {
            const resp = await fetch(`/api/payment/status?orderId=${orderId}`)
            const data = await resp.json()
            if (data.paid) {
              setReportTier(savedTier)
            } else if (data.debug) {
              // Payment not configured yet (dev mode) - trust localStorage
              setReportTier(savedTier)
            } else {
              // Server says not paid - clear local tampering
              localStorage.removeItem('career_report_tier')
              localStorage.removeItem('career_report_unlocked')
            }
          } catch {
            // Network error - trust localStorage optimistically
            if (savedTier === 'standard' || savedTier === 'enterprise') setReportTier(savedTier)
          }
        }
        const savedReport = localStorage.getItem('career_llm_report')
        if (savedReport) setLlmReport(savedReport)
      } catch {}
    }
    verifyPayment()
  }, [])

  // Generate LLM career report
  const generateReport = async () => {
    setReportLoading(true)
    try {
      const resp = await fetch('/api/career-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!resp.ok) throw new Error('Report generation failed')
      const data = await resp.json()
      if (data.report) {
        setLlmReport(data.report)
        try { localStorage.setItem('career_llm_report', data.report) } catch {}
      }
    } catch (err) {
      console.error('Report generation error:', err)
      setLlmReport('报告生成失败，请稍后重试。如已付款请联系客服获取报告。')
    } finally {
      setReportLoading(false)
    }
  }

  // Auto-generate report when standard tier is unlocked
  useEffect(() => {
    if (reportTier === 'standard' && !llmReport && !reportLoading) {
      generateReport()
    }
  }, [reportTier])

  // 自评计算
  const quizScore = quizAnswers.reduce((sum, ans) => sum + (ans >= 0 ? ans : 0), 0)
  const allAnswered = quizAnswers.every((a) => a >= 0)

  const getQuizResult = () => {
    if (quizScore <= 3) return {
      title: '入门探索期',
      color: '#60A5FA',
      desc: '你正处于认知建立阶段，建议从系统学习路径开始，先建立 AI 安全的全局观。',
      next: 'learning-path',
      cta: '开启系统学习',
    }
    if (quizScore <= 7) return {
      title: '实战强化期',
      color: '#A78BFA',
      desc: '你已有一定基础，接下来需要大量靶场实战来沉淀攻防手感。',
      next: 'range',
      cta: '进入靶场实战',
    }
    if (quizScore <= 11) return {
      title: '专项进阶期',
      color: '#F472B6',
      desc: '你已经跨过基础门槛，可以选定一个细分方向深入，并准备认证与面试。',
      next: 'interview',
      cta: '准备面试',
    }
    return {
      title: '专家沉淀期',
      color: '#34D399',
      desc: '你具备较强背景，建议参与高阶靶场、输出内容并考虑企业级认证。',
      next: 'community',
      cta: '加入专家社区',
    }
  }

  const quizResult = getQuizResult()

  return (
    <div className="min-h-screen" style={{ background: '#060B14' }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })}
          className="flex items-center gap-2 text-sm cursor-pointer mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <ArrowLeft size={16} /> 返回首页
        </button>

        <AnimatePresence mode="wait">
          <motion.div key="info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {/* Hero */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2.5 rounded-lg" style={{ background: 'rgba(129,140,248,0.1)' }}>
                  <Briefcase size={24} className="text-indigo-400" />
                </div>
                <div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide"
                    style={{ color: '#818CF8', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}>
                    JOB MATCHING
                  </span>
                  <h1 className="text-4xl font-black mb-1" style={{ color: '#818CF8' }}>AI安全岗位匹配</h1>
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                以招聘岗位为导向 · 能力模型拆解 · 差距分析 · 认证建议
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <span className="text-[10px] flex items-center gap-1" style={{ color: 'rgba(52,211,153,0.6)' }}>
                  <TrendingUp size={11} /> 网安转AI缺口持续扩大
                </span>
                <span className="text-[10px] flex items-center gap-1" style={{ color: 'rgba(167,139,250,0.6)' }}>
                  <Rocket size={11} /> 高级岗位成长空间大
                </span>
                <span className="text-[10px] flex items-center gap-1" style={{ color: 'rgba(96,165,250,0.6)' }}>
                  <Award size={11} /> 认证加持竞争力
                </span>
              </div>
            </div>

            {/* 数据概览 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              {[
                { label: '人才缺口', value: '百万级', icon: Users, color: '#60A5FA' },
                { label: '成长空间', value: '高', icon: Rocket, color: '#34D399' },
                { label: '岗位增速', value: '+45%', icon: TrendingUp, color: '#F472B6' },
                { label: '认证加持', value: '显著', icon: Award, color: '#FBBF24' },
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-xl text-center"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <s.icon size={18} style={{ color: s.color }} className="mx-auto mb-2" />
                  <div className="text-xl font-bold text-white">{s.value}</div>
                  <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* 诊断维度 */}
            <div className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Compass size={20} className="text-indigo-400" /> 诊断维度
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DIMENSIONS.map((d) => (
                  <div key={d.id} className="p-4 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <d.icon size={16} style={{ color: d.color }} />
                      <span className="text-sm font-semibold text-white">{d.label}</span>
                    </div>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 招聘岗位 */}
            <div className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-pink-400" /> 招聘岗位
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {ROLES.map((role) => (
                  <div key={role.id} className="group p-5 rounded-xl relative overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <role.icon size={64} style={{ color: role.color }} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${role.color}20` }}>
                          <role.icon size={20} style={{ color: role.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-bold text-white truncate">{role.title}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                              style={{ color: role.color, background: `${role.color}15` }}>{role.level}</span>
                          </div>
                          <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{role.desc}</p>
                        </div>
                      </div>

                      {/* 典型 JD */}
                      <div className="mb-3">
                        <div className="text-[10px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>典型能力要求</div>
                        <ul className="space-y-1">
                          {role.jd.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                              <CheckCircle size={10} className="mt-0.5 shrink-0" style={{ color: role.color }} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 技能标签 */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {role.skills.map((skill) => (
                          <span key={skill} className="text-[10px] px-2 py-0.5 rounded"
                            style={{ color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.05)' }}>{skill}</span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>成长周期：<span style={{ color: role.color }}>{role.cycle}</span></span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>推荐认证：{role.cert}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 通用能力模型 */}
            <div className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ScanLine size={20} className="text-cyan-400" /> 通用能力模型
              </h2>
              <div className="p-5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  无论目标岗位是红队、防御还是研究，以下能力都是 AI 安全岗位的共性要求。
                </p>
                <div className="space-y-3">
                  {SKILL_MODEL.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white">{skill.name}</span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{skill.desc}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${skill.level}%`, background: 'linear-gradient(90deg, #06B6D4, #3B82F6)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 成长路线图 */}
            <div className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-cyan-400" /> 成长路线图
              </h2>
              <div className="relative pl-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                {ROADMAP.map((r, i) => (
                  <div key={i} className="relative mb-6 last:mb-0">
                    <div className="absolute -left-[15px] top-1 w-3 h-3 rounded-full border-2"
                      style={{ borderColor: r.color, background: '#060B14' }} />
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-white">{r.phase}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ color: r.color, background: `${r.color}15` }}>{r.time}</span>
                      </div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {r.items.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            <CheckCircle size={11} style={{ color: r.color }} /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 能力自评问卷 */}
            <div className="mb-10 p-6 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Target size={20} className="text-amber-400" /> 2分钟能力自评
              </h2>
              <p className="text-[11px] mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                回答 4 个简单问题，获取你的当前阶段与下一步建议。
              </p>

              {!quizSubmitted ? (
                <div className="space-y-5">
                  {QUIZ.map((question, qIdx) => (
                    <div key={qIdx}>
                      <h3 className="text-sm font-semibold text-white mb-2">
                        {qIdx + 1}. {question.q}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {question.options.map((opt, oIdx) => {
                          const selected = quizAnswers[qIdx] === oIdx
                          return (
                            <button
                              key={opt}
                              onClick={() => {
                                const next = [...quizAnswers]
                                next[qIdx] = oIdx
                                setQuizAnswers(next)
                              }}
                              className={`text-left px-3 py-2.5 rounded-lg text-[11px] transition-all border ${
                                selected
                                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                                  : 'border-white/10 text-white/60 hover:border-white/20 hover:bg-white/[0.03]'
                              }`}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => allAnswered && setQuizSubmitted(true)}
                    disabled={!allAnswered}
                    className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
                      allAnswered
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {allAnswered ? '查看我的诊断结果' : '请先回答全部问题'}
                  </button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: `${quizResult.color}20` }}>
                    <Sparkles size={28} style={{ color: quizResult.color }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: quizResult.color }}>{quizResult.title}</h3>
                  <p className="text-sm max-w-md mx-auto mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>{quizResult.desc}</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: quizResult.next as any })}
                      className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:scale-105"
                      style={{ background: quizResult.color }}
                    >
                      {quizResult.cta}
                    </button>
                    <button
                      onClick={() => { setQuizSubmitted(false); setQuizAnswers(new Array(QUIZ.length).fill(-1)) }}
                      className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                    >
                      重新评估
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* 认证路径 + 付费 CTA */}
            <div className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Award size={20} className="text-yellow-400" /> 推荐认证路径
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {CERTS.map((c) => (
                  <div key={c.name} className="p-4 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs font-bold text-white mb-1">{c.name}</div>
                    <div className="text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{c.level} · {c.time}</div>
                    <div className="text-[10px]" style={{ color: 'rgba(52,211,153,0.7)' }}>{c.value}</div>
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4"
                style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.08), rgba(99,102,241,0.04))', border: '1px solid rgba(129,140,248,0.15)' }}>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">一对一职业规划咨询</h3>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    学长 1v1 语音咨询：岗位定位 · 学习路径 · 简历/面试建议
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => window.dispatchEvent(new Event('open-consult-modal'))}
                    className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 0 16px rgba(16,185,129,0.25)' }}
                  >
                    加微信咨询
                  </button>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-slate-400" /> 常见问题
              </h2>
              <div className="space-y-2">
                {FAQS.map((faq, i) => (
                  <div key={i} className="rounded-xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="text-sm font-medium text-white">{faq.q}</span>
                      {expandedFaq === i ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                    </button>
                    <AnimatePresence>
                      {expandedFaq === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                          <p className="px-4 pb-4 text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* 底部 CTA */}
            <div className="text-center py-8 rounded-2xl"
              style={{ background: 'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.08), transparent 60%)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-xl font-bold text-white mb-2">准备好开启 AI 安全职业之路了吗？</h3>
              <p className="text-[11px] mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                无论你是零基础还是资深从业者，AIShield Lab 都能为你提供清晰路径。
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'learning-path' })}
                  className="px-6 py-2.5 rounded-lg font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
                >
                  查看学习路径
                </button>
                <button
                  onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'range' })}
                  className="px-6 py-2.5 rounded-lg font-semibold text-sm text-white/80 border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-all"
                >
                  进入靶场
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 1v1 services redirect to WeChat — no direct payment modal */}
    </div>
  )
}
