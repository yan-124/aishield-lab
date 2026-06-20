import { useState, useEffect, useRef, Suspense } from 'react'
import React from 'react'
import { Shield, Sparkles, ArrowRight, Zap, GraduationCap, ShieldCheck, Newspaper, Briefcase, Target, BookOpen, MessageCircle, Star } from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import { AnimatePresence, motion } from 'framer-motion'

import { useAppContext } from '../context/AppContext'

/* ═══════════════════════════════════════════════════════════════
   AIShield Lab — Hero Section v4
   B/D variant switcher + drag hint + feature card nav + ripple CTA
   ═══════════════════════════════════════════════════════════════ */

const STAR_DATA = [
  {l:'12%',t:'8%',s:4.5,d:0.7,du:3.2,op:0.95},{l:'88%',t:'15%',s:3,d:2.1,du:2.8,op:0.75},
  {l:'45%',t:'5%',s:5,d:1.4,du:4.0,op:1},{l:'72%',t:'28%',s:3.5,d:0.3,du:2.5,op:0.85},
  {l:'25%',t:'35%',s:4.5,d:3.2,du:3.6,op:0.98},{l:'92%',t:'45%',s:3,d:1.8,du:2.2,op:0.7},
  {l:'8%',t:'55%',s:5.5,d:0.9,du:4.5,op:1},{l:'58%',t:'62%',s:3.5,d:2.7,du:3.0,op:0.8},
  {l:'33%',t:'75%',s:3,d:1.1,du:2.6,op:0.73},{l:'78%',t:'82%',s:5,d:3.8,du:3.8,op:0.95},
  {l:'50%',t:'18%',s:3.5,d:0.5,du:2.9,op:0.88},{l:'15%',t:'22%',s:5,d:2.4,du:3.4,op:0.98},
  {l:'82%',t:'68%',s:3,d:1.5,du:2.3,op:0.68},{l:'38%',t:'48%',s:5.5,d:0.2,du:4.2,op:1},{l:'65%',t:'38%',s:3.5,d:3.5,du:3.1,op:0.83},
  {l:'5%',t:'85%',s:3,d:2.0,du:2.7,op:0.72},
  {l:'95%',t:'8%',s:4.5,d:0.8,du:3.3,op:0.96},{l:'22%',t:'60%',s:5,d:2.9,du:3.7,op:1},{l:'70%',t:'12%',s:3,d:1.3,du:2.4,op:0.7},{l:'42%',t:'88%',s:3.5,d:3.6,du:2.8,op:0.8},
  {l:'55%',t:'52%',s:5,d:0.6,du:4.1,op:0.98},{l:'18%',t:'42%',s:3.5,d:2.2,du:2.5,op:0.75},
  {l:'85%',t:'55%',s:5.5,d:1.0,du:3.5,op:1},{l:'30%',t:'15%',s:3,d:3.0,du:2.1,op:0.64},
  {l:'62%',t:'78%',s:4.5,d:1.7,du:3.9,op:0.95},{l:'10%',t:'28%',s:3.5,d:2.5,du:3.0,op:0.82},
  {l:'48%',t:'32%',s:5.5,d:0.4,du:4.3,op:1},{l:'76%',t:'92%',s:3,d:1.9,du:2.2,op:0.66},
  {l:'35%',t:'68%',s:3.5,d:3.3,du:2.6,op:0.78},{l:'52%',t:'8%',s:3,d:1.2,du:3.1,op:0.73},
  {l:'90%',t:'35%',s:4.5,d:2.6,du:3.5,op:0.97},{l:'20%',t:'80%',s:3,d:0.1,du:2.4,op:0.69},
  {l:'68%',t:'22%',s:5,d:3.7,du:4.0,op:1},{l:'40%',t:'55%',s:3.5,d:1.6,du:2.8,op:0.77},{l:'2%',t:'48%',s:3.5,d:2.3,du:3.2,op:0.83},{l:'98%',t:'72%',s:4.5,d:0.7,du:2.6,op:0.75},
  {l:'28%',t:'92%',s:5,d:3.1,du:3.8,op:0.99},{l:'58%',t:'42%',s:3,d:1.4,du:2.3,op:0.67},{l:'80%',t:'5%',s:3.5,d:2.8,du:3.4,op:0.93},{l:'13%',t:'65%',s:5,d:0.3,du:4.4,op:1},{l:'44%',t:'25%',s:3,d:3.4,du:2.7,op:0.71},{l:'73%',t:'58%',s:5,d:1.1,du:3.0,op:0.97},{l:'32%',t:'85%',s:3.5,d:2.0,du:2.5,op:0.76},{l:'60%',t:'12%',s:4.5,d:3.9,du:3.6,op:0.98},{l:'87%',t:'88%',s:3,d:0.9,du:2.2,op:0.65},{l:'25%',t:'52%',s:4.5,d:2.5,du:3.3,op:0.92},
]

function StarField() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {STAR_DATA.map((st, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            left: st.l, top: st.t,
            width: st.s + 'px', height: st.s + 'px',
            background: 'radial-gradient(circle, rgba(167,139,250,' + st.op + ') 0%, transparent 70%)',
            animation: 'star-pulse ' + st.du + 's ease-in-out ' + st.d + 's infinite',
          }}
        />
      ))}
    </div>
  )
}

/* ── Ripple effect hook ── */
function useRipple() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  const idRef = useRef(0)
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setRipples(prev => [...prev, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: ++idRef.current,
    }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== idRef.current)), 700)
  }
  return { ripples, handleClick }
}

/* ── Feature Showcase — immersive horizontal gallery ── */
function FeatureShowcase() {
  const { dispatch } = useAppContext()
  const sections = [
    {
      tag: '靶场',
      tagColor: '#22D3EE',
      tagBg: 'rgba(34,211,238,0.1)',
      tagBorder: 'rgba(34,211,238,0.2)',
      title: '游戏化靶场',
      desc: '50+ 实战关卡，覆盖 Prompt 注入、对抗攻击、数据泄露等核心方向',
      cta: '进入挑战',
      gradient: 'linear-gradient(145deg, #0C1428 0%, #0A1628 50%, #0D1A35 100%)',
      borderGlow: 'rgba(34,211,238,0.15)',
      accentGlow: 'rgba(34,211,238,0.08)',
      nav: 'range' as const,
    },
    {
      tag: '课程',
      tagColor: '#A78BFA',
      tagBg: 'rgba(167,139,250,0.1)',
      tagBorder: 'rgba(167,139,250,0.2)',
      title: '交互式课程',
      desc: '200+ 安全教程，从入门到精通，AI 与安全交叉领域全覆盖',
      cta: '开始学习',
      gradient: 'linear-gradient(145deg, #130D28 0%, #110A25 50%, #160D30 100%)',
      borderGlow: 'rgba(167,139,250,0.15)',
      accentGlow: 'rgba(167,139,250,0.08)',
      nav: 'knowledge' as const,
    },
    {
      tag: '社区',
      tagColor: '#34D399',
      tagBg: 'rgba(52,211,153,0.1)',
      tagBorder: 'rgba(52,211,153,0.2)',
      title: '技术社区',
      desc: '10K+ 学习者聚集地，共享实战经验、讨论前沿话题、组队刷题',
      cta: '加入讨论',
      gradient: 'linear-gradient(145deg, #0A1410 0%, #081210 50%, #0C1812 100%)',
      borderGlow: 'rgba(52,211,153,0.15)',
      accentGlow: 'rgba(52,211,153,0.08)',
      nav: 'community' as const,
    },
    {
      tag: '招聘',
      tagColor: '#FBBF24',
      tagBg: 'rgba(251,191,36,0.1)',
      tagBorder: 'rgba(251,191,36,0.2)',
      title: '安全招聘',
      desc: '企业直招安全岗位，实习/全职/远程灵活选择，快速匹配上岸',
      cta: '查看岗位',
      gradient: 'linear-gradient(145deg, #14100A 0%, #120E08 50%, #181208 100%)',
      borderGlow: 'rgba(251,191,36,0.15)',
      accentGlow: 'rgba(251,191,36,0.08)',
      nav: 'jobs' as const,
    },
  ]

  return (
    <div className="flex gap-3 w-full overflow-x-auto pb-2 scrollbar-hide">
      {sections.map((s, i) => (
        <motion.button
          key={s.title}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: s.nav })}
          className="group relative flex-shrink-0 w-56 rounded-2xl p-5 text-left cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1"
          style={{
            background: s.gradient,
            border: `1px solid ${s.borderGlow}`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 24px ${s.borderGlow}, inset 0 1px 0 rgba(255,255,255,0.05)`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)`
          }}
        >
          {/* Background accent glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 80% 0%, ${s.accentGlow} 0%, transparent 60%)` }} />

          {/* Tag badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-3"
            style={{ background: s.tagBg, color: s.tagColor, border: `1px solid ${s.tagBorder}` }}>
            <span className="w-1 h-1 rounded-full" style={{ background: s.tagColor }} />
            {s.tag}
          </div>

          {/* Title */}
          <div className="text-sm font-bold text-white/90 mb-2 group-hover:text-white transition-colors" style={{ letterSpacing: '-0.01em' }}>
            {s.title}
          </div>

          {/* Desc */}
          <div className="text-[11px] leading-relaxed mb-4" style={{ color: 'rgba(148,163,184,0.6)' }}>
            {s.desc}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold transition-all group-hover:gap-2.5"
            style={{ color: s.tagColor }}>
            {s.cta}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2.5 6h7M6.5 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </motion.button>
      ))}
    </div>
  )
}

/* ── 3D Model Canvas with auto-switch (B = 重装, D = 微笑) ── */
function HeroVisual() {
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-5">
      {/* Ambient glow */}
      <div className="absolute w-[380px] h-[380px] rounded-full blur-[120px] opacity-[0.1]"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, #3B82F6 40%, transparent 70%)' }} />
      <div className="absolute w-[340px] h-[340px] rounded-full border border-purple-400/[0.2] animate-spin-slow" style={{ animationDuration: '20s', boxShadow: '0 0 15px rgba(167,139,250,0.08), inset 0 0 15px rgba(167,139,250,0.04)' }} />
      <div className="absolute w-[420px] h-[420px] rounded-full border border-blue-400/[0.14] animate-spin-slow" style={{ animationDuration: '30s', animationDirection: 'reverse', boxShadow: '0 0 12px rgba(96,165,250,0.06), inset 0 0 12px rgba(96,165,250,0.03)' }} />

      {/* 3D Model Canvas */}
      <div className="relative w-[320px] h-[340px] z-10" style={{ perspective: '1000px' }}>
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <Shield className="w-24 h-24 text-purple-400/20 animate-pulse" strokeWidth={0.5} />
          </div>
        }>
          <Canvas camera={{ position: [0, 0.2, 2.8], fov: 44 }} gl={{ antialias: true, alpha: true, toneMapping: 4, outputColorSpace: 'srgb' }} dpr={[1, 2]} style={{ background: 'transparent', width: '100%', height: '100%' }}>
            <Suspense fallback={null}>
              <Shieldy />
            </Suspense>
          </Canvas>
        </Suspense>

        {/* Drag hint */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              key="drag-hint"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono whitespace-nowrap"
              style={{
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(167,139,250,0.2)',
                color: 'rgba(167,139,250,0.7)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1"/></svg>
              拖拽旋转 · Drag to rotate
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feature Showcase — horizontal scroll gallery */}
      <FeatureShowcase />
    </div>
  )
}

/* ── Import + wrap the default export ── */
import ShieldyModelRaw from './ShieldyModel'
function Shieldy() {
  return <ShieldyModelRaw />
}

/* ═══════════════════════════════════════════════════════════════ */

export function HeroNewsTicker() {
  const items = [
    { text: '深度伪造语音攻击导致金融诈骗损失上升300%', url: '#' },
    { text: 'Google发布AI安全评估框架SAIF更新版', url: '#' },
    { text: 'Meta开源Purple Llama安全工具套件', url: '#' },
    { text: '研究人员发现新型LLM水印绕过攻击方法', url: '#' },
    { text: 'OpenAI发布新版安全对齐技术文档', url: '#' },
    { text: '欧盟AI法案正式生效，企业合规指南发布', url: '#' },
  ]
  const dup = [...items, ...items]
  const [toast, setToast] = React.useState<{ text: string; visible: boolean }>({ text: '', visible: false })

  const showToast = (text: string) => {
    setToast({ text, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000)
  }

  return (
    <div className="w-full overflow-hidden relative" style={{
      background: 'linear-gradient(90deg, rgba(139,92,246,0.25) 0%, rgba(99,102,241,0.18) 50%, rgba(139,92,246,0.25) 100%)',
      borderBottom: '1px solid rgba(139,92,246,0.35)',
    }}>
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 flex items-center" style={{ height: '44px' }}>
        {/* 左侧固定标签 — 亮金色 加大 */}
        <div className="shrink-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-bold tracking-wide mr-3"
          style={{ color: '#FBBF24', background: 'rgba(251,191,36,0.18)', border: '1px solid rgba(251,191,36,0.28)' }}>
          <Newspaper size={14} strokeWidth={2.5} />
          <span>AI 安全快讯</span>
        </div>
        {/* 分隔线 */}
        <div className="shrink-0 w-px h-3 mr-3" style={{ background: 'rgba(251,191,36,0.22)' }} />
        {/* 滚动区域 — 可点击 + 更慢 */}
        <div className="flex-1 overflow-hidden relative" style={{ maskImage: 'linear-gradient(90deg, transparent 0%, black 4%, black 96%, transparent 100%)' }}>
          <div style={{ display: 'inline-flex', whiteSpace: 'nowrap' as const, animation: 'ticker-scroll 36s linear infinite', willChange: 'transform', transform: 'translateZ(0)', minWidth: '200%' }}>
            {dup.map((item, i) => (
              <a key={i} href={item.url}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  showToast(item.text)
                }}
                className="text-[13px] mr-8 inline-flex items-center cursor-pointer transition-colors duration-200 hover:text-white hover:underline underline-offset-4 decoration-cyan-400/50"
                style={{ color: 'rgba(203,213,225,0.75)' }}>
                <span className="w-1 h-1 rounded-full mr-2 shrink-0" style={{ background: 'rgba(251,191,36,0.6)' }} />
                {item.text}
              </a>
            ))}
          </div>
        </div>
      </div>
      {/* Toast */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '12px 24px', borderRadius: '8px',
        opacity: toast.visible ? 1 : 0, pointerEvents: 'none', transition: 'opacity 0.3s',
        zIndex: 1000, fontSize: '14px'
      }}>
        {toast.text}
      </div>
    </div>
  )
}

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { ripples, handleClick } = useRipple()

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const handleMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect()
      hero.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / rect.width) * 100}%`)
      hero.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / rect.height) * 100}%`)
    }
    hero.addEventListener('mousemove', handleMouseMove)
    return () => hero.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section ref={heroRef} className="relative overflow-hidden min-h-screen flex items-center"
      style={{ '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties}>

      {/* ── Layer 1: Deep cosmic gradient ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 120% 100% at 50% -20%, rgba(88,28,135,0.18) 0%, transparent 55%),' +
            'radial-gradient(ellipse 90% 80% at 80% 60%, rgba(59,130,246,0.10) 0%, transparent 50%),' +
            'radial-gradient(ellipse 70% 60% at 15% 70%, rgba(139,92,246,0.08) 0%, transparent 50%),' +
            'linear-gradient(180deg, #070B14 0%, #0C1027 40%, #0A0E1F 100%)',
        }}
      />

      {/* ── Layer 2: Mouse-following spotlight ── */}
      <div className="absolute w-[700px] h-[500px] rounded-full blur-[100px] opacity-[0.07] transition-all duration-700 ease-out pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #8B5CF6 0%, #3B82F6 50%, transparent 70%)',
          left: 'var(--mouse-x)', top: 'var(--mouse-y)',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* ── Layer 3: Star field ── */}
      <StarField />

      {/* ── Layer 4: Subtle grid ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {/* ── Layer 5: Noise grain ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.018]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
      />

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 py-28 lg:py-32">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

          {/* ───── LEFT COLUMN ───── */}
          <div className="flex-1 max-w-2xl space-y-9">

            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-md border animate-fade"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.09), rgba(59,130,246,0.05))',
                borderColor: 'rgba(139,92,246,0.16)',
                boxShadow: '0 0 24px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
              </span>
              <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#A78BFA' }}>v2.8 Beta</span>
              <div className="w-px h-3 bg-white/8" />
              <Sparkles className="w-3 h-3 text-purple-400/60" />
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-[68px] font-black leading-[1.06] tracking-[-0.03em]">
                <span className="block bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #A78BFA 0%, #818CF8 18%, #60A5FA 35%, #38BDF8 48%, #22D3EE 62%, #818CF8 78%, #C084FC 92%, #A78BFA 100%)',
                    backgroundSize: '240% auto',
                    animation: 'shimmer 6s linear infinite',
                  }}
                >
                  AIShield Lab
                </span>
                <span className="block text-white/95 mt-2 font-bold tracking-tight" style={{ fontWeight: 700 }}>
                  AI 安全学习平台
                </span>
              </h1>

              {/* Decorative divider */}
              <div className="flex items-center gap-3">
                <div className="h-px w-10" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4))' }} />
                <Star className="w-3 h-3 text-purple-400/40" strokeWidth={1.5} />
                <div className="h-px w-10" style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.4), transparent)' }} />
              </div>
            </div>

            {/* Description */}
            <p className="text-base lg:text-lg leading-relaxed max-w-xl" style={{ color: 'rgba(203,213,225,0.52)' }}>
              面向{' '}
              <span className="font-medium" style={{ color: 'rgba(96,165,250,0.9)' }}>在校生</span>
              {' '}、{' '}
              <span className="font-medium" style={{ color: 'rgba(167,139,250,0.9)' }}>转行者</span>
              {' '}和{' '}
              <span className="font-medium" style={{ color: 'rgba(52,211,153,0.9)' }}>传统安全从业者</span>
              {' '}的一站式 AI 安全学习平台。
              集成{' '}
              <span className="font-medium text-white/65">游戏化靶场</span>、{' '}
              <span className="font-medium text-white/65">交互式课程</span>、{' '}
              <span className="font-medium text-white/65">技术社区</span>、{' '}
              <span className="font-medium text-white/65">安全招聘</span> 与{' '}
              <span className="font-medium text-white/65">AI 资讯实时更新</span>，
              配合智能助教 Shieldy，帮你系统掌握 AI 安全技能。
            </p>

            {/* CTA Group with Ripple Effect */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                onClick={handleClick}
                className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
                style={{
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 45%, #3B82F6 100%)',
                  boxShadow: '0 0 0 1px rgba(139,92,246,0.2), 0 4px 20px rgba(99,102,241,0.3), 0 1px 3px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(139,92,246,0.35), 0 8px 32px rgba(99,102,241,0.4), 0 2px 6px rgba(0,0,0,0.4)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(139,92,246,0.2), 0 4px 20px rgba(99,102,241,0.3), 0 1px 3px rgba(0,0,0,0.3)'
                }}
              >
                {/* Ripple elements */}
                {ripples.map(r => (
                  <span key={r.id}
                    className="absolute rounded-full pointer-events-none animate-ripple"
                    style={{
                      left: r.x, top: r.y,
                      width: 10, height: 10,
                      background: 'rgba(255,255,255,0.3)',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}
                <Sparkles className="w-4.5 h-4.5 relative z-10" strokeWidth={2} />
                <span className="relative z-10">开始学习</span>
                <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </button>

              <button
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                style={{
                  fontSize: '0.95rem',
                  color: 'rgba(203,213,225,0.65)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.95)'
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05))'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(203,213,225,0.65)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))'
                }}
              >
                查看文档
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-10 pt-3">
              {[
                { value: '50+', label: '靶场关卡', icon: Zap },
                { value: '200+', label: '安全课程', icon: GraduationCap },
                { value: '10K+', label: '学习者', icon: ShieldCheck },
              ].map(stat => {
                const StatIcon = stat.icon
                return (
                  <div key={stat.label} className="group cursor-default">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <StatIcon className="w-4 h-4 text-purple-400/40 group-hover:text-purple-400/70 transition-colors" strokeWidth={1.8} />
                      <span className="text-3xl font-black tabular-nums tracking-tight bg-clip-text text-transparent"
                        style={{ backgroundImage: 'linear-gradient(180deg, #C4B5FD 0%, #A78BFA 50%, #818CF8 100%)' }}>
                        {stat.value}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono tracking-wider uppercase" style={{ color: 'rgba(148,163,184,0.28)' }}>
                      {stat.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ───── RIGHT COLUMN ───── */}
          <div className="flex-1 w-full min-h-[480px] lg:min-h-[560px] relative">
            <HeroVisual />
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2.5 opacity-25 hover:opacity-50 transition-opacity">
        <span className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: 'rgba(203,213,225,0.35)' }}>Scroll</span>
        <div className="w-5 h-8 rounded-full border flex items-start justify-center p-1.5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="w-1 h-1.5 rounded-full bg-purple-400/50 animate-bounce" />
        </div>
      </div>
    </section>
  )
}
