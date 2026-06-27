import { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Zap, Gift, Star, Check, ChevronRight } from 'lucide-react'
import { PaymentModal } from './PaymentModal'

// localStorage key
const CREDITS_KEY = 'aishield_credits'
const DEFAULT_CREDITS = 50

// 套餐配置
const PLANS = [
  {
    id: 'free',
    name: '免费版',
    badge: '★',
    monthlyPrice: 0,
    yearlyPrice: null,
    monthlyCredits: 50,
    features: ['全部知识库访问', '25关靶场实战', '职业安全评估', '每日登录5盾币'],
    isCurrent: true,
  },
  {
    id: 'explorer',
    name: '探索者',
    badge: '⬡',
    monthlyPrice: 29.9,
    yearlyPrice: 299,
    yearlyDiscount: 17,
    monthlyCredits: 300,
    features: ['全部知识库', '靶场25关实战', '专属职业路径'],
    isCurrent: false,
  },
  {
    id: 'pro',
    name: '专业版',
    badge: '◆',
    monthlyPrice: 79.9,
    yearlyPrice: 799,
    yearlyDiscount: 17,
    monthlyCredits: 1000,
    features: ['全部功能', '靶场无限次', '1对1答疑', '优先新功能'],
    isCurrent: false,
  },
]

// 增购盾币配置
const CREDIT_PACKAGES = [
  { id: 'p1', credits: 100,  price: 9.9,   unit: 0.099, hot: false },
  { id: 'p2', credits: 500,  price: 39.9,  unit: 0.080, hot: false },
  { id: 'p3', credits: 1000, price: 69.9,  unit: 0.070, hot: false },
  { id: 'p4', credits: 2000, price: 129.9, unit: 0.065, hot: true  },
  { id: 'p5', credits: 5000,  price: 299.9, unit: 0.060, hot: false },
  { id: 'p6', credits: 10000, price: 499.9, unit: 0.050, hot: false },
]

// 获取盾币余额
function getCreditsBalance(): number {
  try {
    const stored = localStorage.getItem(CREDITS_KEY)
    return stored ? parseInt(stored, 10) : DEFAULT_CREDITS
  } catch {
    return DEFAULT_CREDITS
  }
}

// 保存盾币余额
function saveCreditsBalance(balance: number): void {
  try {
    localStorage.setItem(CREDITS_KEY, balance.toString())
  } catch {}
}

export const CreditsPage = () => {
  const { state, dispatch } = useAppContext()
  const [credits, setCredits] = useState(DEFAULT_CREDITS)
  const [showPayment, setShowPayment] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<typeof CREDIT_PACKAGES[0] | null>(null)

  // 监听 localStorage 变化（跨标签页同步）
  useEffect(() => {
    setCredits(getCreditsBalance())
    const handleStorage = () => setCredits(getCreditsBalance())
    window.addEventListener('storage', handleStorage)
    // 也定时刷新（处理同标签页变化）
    const interval = setInterval(() => setCredits(getCreditsBalance()), 1000)
    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  const handleRecharge = (pkg: typeof CREDIT_PACKAGES[0]) => {
    setSelectedPackage(pkg)
    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    if (selectedPackage) {
      const newBalance = getCreditsBalance() + selectedPackage.credits
      saveCreditsBalance(newBalance)
      setCredits(newBalance)
    }
    setShowPayment(false)
    setSelectedPackage(null)
  }

  const handleBack = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'user-profile' })
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.45), rgba(16,185,129,0.25))' }}
      />

      {/* 返回 */}
      <button onClick={handleBack}
        className="text-xs cursor-pointer flex items-center gap-1"
        style={{ color: '#10B981' }}>
        <ArrowLeft size={14} /> 返回个人中心
      </button>

      {/* 顶部盾币余额卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-8 text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.06))',
          border: '1px solid rgba(16,185,129,0.2)',
        }}
      >
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
          <Shield size={120} style={{ color: '#10B981' }} />
        </div>

        <div className="text-5xl mb-2">🛡️</div>
        <div className="text-5xl font-black text-white mb-1">{credits}</div>
        <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>盾币</div>

        {/* 分类统计 */}
        <div className="grid grid-cols-3 gap-4 mt-6 max-w-md mx-auto">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-lg font-bold text-white">0</div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>订阅盾币</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-lg font-bold" style={{ color: '#10B981' }}>{credits}</div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>增购盾币</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-lg font-bold text-white">0</div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>活动盾币</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center gap-3 mt-6">
          <button
            className="px-5 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onClick={() => {}}
          >
            📋 积分明细
          </button>
          <button
            onClick={() => {
              // 滚动到增购区域
              document.getElementById('recharge-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: 'white',
            }}
          >
            ⚡ 充值
          </button>
        </div>
      </motion.div>

      {/* 当前套餐区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star size={16} style={{ color: '#FBBF24' }} />
            <span className="text-sm font-bold text-white">当前套餐</span>
          </div>
          <span className="text-xs px-3 py-1 rounded-full" style={{
            background: 'rgba(251,191,36,0.1)',
            color: '#FBBF24',
          }}>免费版 ★</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span>本月已用盾币</span>
            <span style={{ color: '#10B981' }}>0 / 50</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: '0%', background: 'linear-gradient(90deg, #10B981, #34D399)' }} />
          </div>
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            每月1日重置 · 剩余 {credits} 盾币
          </div>
        </div>
      </motion.div>

      {/* 套餐选择区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} style={{ color: '#A78BFA' }} />
          <span className="text-sm font-bold text-white">订阅套餐</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className="rounded-2xl p-5 relative transition-all"
              style={{
                background: plan.isCurrent
                  ? 'rgba(16,185,129,0.08)'
                  : 'rgba(255,255,255,0.03)',
                border: plan.isCurrent
                  ? '1px solid rgba(16,185,129,0.3)'
                  : '1px solid rgba(255,255,255,0.06)',
                boxShadow: plan.isCurrent ? '0 0 30px rgba(16,185,129,0.1)' : 'none',
              }}
            >
              {/* 当前方案标签 */}
              {plan.isCurrent && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-medium"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
                  当前方案
                </div>
              )}

              <div className="text-center mb-4">
                <div className="text-2xl mb-1">{plan.badge}</div>
                <div className="text-sm font-bold text-white">{plan.name}</div>
              </div>

              <div className="text-center mb-4">
                {plan.monthlyPrice === 0 ? (
                  <div className="text-2xl font-black text-white">免费</div>
                ) : (
                  <>
                    <div className="text-2xl font-black" style={{ color: '#10B981' }}>
                      ¥{plan.monthlyPrice}
                    </div>
                    <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>/月</div>
                    {plan.yearlyPrice && (
                      <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        年付 ¥{plan.yearlyPrice}（省{plan.yearlyDiscount}%）
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="text-center text-xs mb-4" style={{ color: '#A78BFA' }}>
                {plan.monthlyCredits} 盾币/月
              </div>

              <div className="space-y-2 mb-5">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <Check size={12} className="shrink-0 mt-0.5" style={{ color: '#10B981' }} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {plan.isCurrent ? (
                <div className="text-center text-xs py-2.5 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                  当前使用中
                </div>
              ) : (
                <button
                  onClick={() => document.getElementById('recharge-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #A78BFA, #60A5FA)',
                    color: 'white',
                  }}
                >
                  立即订阅
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* 增购盾币区域 */}
      <motion.div
        id="recharge-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Gift size={16} style={{ color: '#F59E0B' }} />
          <span className="text-sm font-bold text-white">增购盾币</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {CREDIT_PACKAGES.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => handleRecharge(pkg)}
              className="relative rounded-2xl p-5 text-left cursor-pointer transition-all hover:scale-102 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: pkg.hot
                  ? '1px solid rgba(245,158,11,0.4)'
                  : '1px solid rgba(255,255,255,0.06)',
                boxShadow: pkg.hot ? '0 0 20px rgba(245,158,11,0.1)' : 'none',
              }}
            >
              {/* 热门标签 */}
              {pkg.hot && (
                <div className="absolute -top-2.5 right-4 px-2.5 py-1 rounded-full text-[9px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', color: 'white' }}>
                  🔥 最受欢迎
                </div>
              )}

              <div className="text-center">
                <div className="text-2xl mb-1">🛡️</div>
                <div className="text-xl font-black text-white mb-1">{pkg.credits.toLocaleString()}</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>盾币</div>
              </div>

              <div className="mt-4 text-center">
                <div className="text-lg font-bold" style={{ color: pkg.hot ? '#F59E0B' : '#10B981' }}>
                  ¥{pkg.price}
                </div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  ¥{pkg.unit.toFixed(3)}/盾币
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className="text-[11px] px-3 py-1.5 rounded-full cursor-pointer font-medium transition-all"
                  style={{
                    background: pkg.hot ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.1)',
                    color: pkg.hot ? '#F59E0B' : '#10B981',
                  }}>
                  立即充值 <ChevronRight size={12} className="inline" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* 盾币消耗说明 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="text-xs font-medium mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>📋 盾币消耗说明</div>
        <div className="space-y-2">
          {[
        { item: '职业评估快速版', cost: '免费' },
        { item: '职业评估完整版报告', cost: '100 积分' },
        { item: '靦场挑战（每次）', cost: '10-30 积分' },
            { item: '知识库精读文章', cost: '30 盾币' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <span>{item.item}</span>
              <span style={{ color: '#10B981' }}>{item.cost}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            ⚠️ 盾币不可兑换现金，充值后不支持退款
          </p>
        </div>
      </motion.div>

      {/* Payment Modal */}
      {showPayment && selectedPackage && (
        <PaymentModal
          amount={selectedPackage.price}
          title={`AIShield Lab - 增购 ${selectedPackage.credits} 盾币`}
          creditsAmount={selectedPackage.credits}
          onPaid={handlePaymentSuccess}
          onClose={() => {
            setShowPayment(false)
            setSelectedPackage(null)
          }}
        />
      )}
    </div>
  )
}
