import { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass, Brain, Shield, Target, ChevronRight, ChevronDown, Lock, Sparkles,
  ArrowLeft, CheckCircle, Lightbulb, TrendingUp, Award, DollarSign,
  BookOpen, Rocket, Users, Clock, Briefcase, GraduationCap, Download, Building2, Globe, FileText, Crown, Zap
} from 'lucide-react'
import { PaymentModal } from './PaymentModal'

// ═══════════════════════════════════════════════════
// 兴趣方向 & 题目（4个方向，部分多选）
// ═══════════════════════════════════════════════════
const DIMENSIONS = [
  { id: 'skill', label: '技能匹配度', icon: Brain, color: '#60A5FA', desc: '聊聊你的技术栈和目标方向' },
  { id: 'direction', label: '职业方向', icon: Compass, color: '#A78BFA', desc: '明确你最适合的职业发展路径' },
  { id: 'gap', label: '差距分析', icon: Target, color: '#34D399', desc: '识别你与目标岗位之间的关键差距' },
  { id: 'industry', label: '行业趋势', icon: TrendingUp, color: '#FBBF24', desc: '把握AI安全领域的最新风向' },
  { id: 'background', label: '背景评估', icon: Award, color: '#F472B6', desc: '基于你的经历给出个性化建议' },
  { id: 'cert', label: '认证建议', icon: Shield, color: '#60A5FA', desc: '推荐最适合你的认证路径' },
]
type Step = 'info'

// localStorage key
const CREDITS_KEY = 'aishield_credits'
const REPORT_COST = 100 // 完整报告需要100盾币

// 获取盾币余额
function getCreditsBalance(): number {
  try {
    const stored = localStorage.getItem(CREDITS_KEY)
    return stored ? parseInt(stored, 10) : 50
  } catch {
    return 50
  }
}

export const CareerGuide = () => {
  const { dispatch } = useAppContext()
  const [step, setStep] = useState<Step>('info')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [credits, setCredits] = useState(getCreditsBalance())
  const [reportTier, setReportTier] = useState<'free' | 'standard' | 'enterprise'>('free')
  const [llmReport, setLlmReport] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [showPaymentTier, setShowPaymentTier] = useState<'standard' | 'enterprise' | null>(null)

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

  // 监听盾币变化
  useEffect(() => {
    const interval = setInterval(() => setCredits(getCreditsBalance()), 1000)
    return () => clearInterval(interval)
  }, [])

  // 答题完成时生成个性化推荐
  // 答题完成时生成个性化推荐


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

  return (
    <div className="min-h-screen" style={{ background: '#060B14' }}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })}
          className="flex items-center gap-2 text-sm cursor-pointer mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <ArrowLeft size={16} /> 返回首页
        </button>

        <AnimatePresence mode="wait">
          {step === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {/* Hero */}
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2.5 rounded-lg" style={{ background: 'rgba(129,140,248,0.1)' }}>
                    <TrendingUp size={24} className="text-indigo-400" />
                  </div>
                  <div>
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide"
                      style={{ color: '#818CF8', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}>
                      CAREER DIAGNOSIS
                    </span>
                    <h1 className="text-4xl font-black  mb-1" style={{ color: '#818CF8' }}>AI安全职业诊断</h1>
                  </div>
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  个性化路径 · 岗位匹配
                </p>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <span className="text-[10px] flex items-center gap-1" style={{ color: 'rgba(52,211,153,0.6)' }}>
                    <TrendingUp size={11} /> 网安转AI缺口百万级+
                  </span>
                  <span className="text-[10px] flex items-center gap-1" style={{ color: 'rgba(167,139,250,0.6)' }}>
                    <DollarSign size={11} /> 架构师最高专家级
                  </span>
                  <span className="text-[10px] flex items-center gap-1" style={{ color: 'rgba(96,165,250,0.6)' }}>
                    <Award size={11} /> CISSP持证涨薪23%
                  </span>
                </div>
              </div>

              {/* What you get */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { icon: "Target", title: "岗位匹配度", desc: "测出你与目标岗的匹配程度" },
                  { icon: "DollarSign", title: "认证路径", desc: "推荐最适合你的认证路径" },
                  { icon: "TrendingUp", title: "成长路线", desc: "定制化的学习与转型路径" },
                  { icon: "Award", title: "认证建议", desc: "根据你的背景推荐证书" },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="text-xl mb-2">{item.icon === "Target" ? <Target size={20} style={{color:"#A78BFA"}} /> : item.icon === "Award" ? <Award size={20} style={{color:"#FBBF24"}} /> : item.icon === "TrendingUp" ? <TrendingUp size={20} style={{color:"#60A5FA"}} /> : <Award size={20} style={{color:"#FBBF24"}} />}</div>
                    <div className="text-xs font-bold text-white mb-1">{item.title}</div>
                    <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* How it works */}
          </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Payment Modal - tiered */}
      {showPaymentTier === 'standard' && (
        <PaymentModal
          amount={29.90}
          title="AIShield Lab - AI安全职业诊断报告"
          onPaid={() => {
            setShowPaymentTier(null)
            setReportTier('standard')
            try {
              localStorage.setItem('career_report_tier', 'standard')
              // orderId already stored by PaymentModal
            } catch {}
          }}
          onClose={() => setShowPaymentTier(null)}
        />
      )}
      {showPaymentTier === 'enterprise' && (
        <PaymentModal
          amount={199.00}
          title="AIShield Lab - 企业AI安全治理评估"
          onPaid={() => {
            setShowPaymentTier(null)
            setReportTier('enterprise')
            try {
              localStorage.setItem('career_report_tier', 'enterprise')
              localStorage.setItem('career_diagnosis_paid', 'true')
            } catch {}
          }}
          onClose={() => setShowPaymentTier(null)}
        />
      )}
    </div>
  )
}
