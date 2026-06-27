import React, { useState, useEffect, useRef, Suspense } from 'react'
import ReactDOM from 'react-dom'
import { Sparkles, ArrowRight, BookOpen, Newspaper } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'

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

const HeroVisual = React.lazy(() => import('./ShieldyModel'))

/* ── 新闻跑马灯（全宽顶栏，参考图：亮紫渐变+大字号） ── */
export function HeroNewsTicker() {
  const { dispatch } = useAppContext()
  const items = [
    { text: '深度伪造语音攻击导致金融诈骗损失上升300%', newsId: '1' },
    { text: 'Google发布AI安全评估框架SAIF更新版', newsId: '2' },
    { text: 'Meta开源Purple Llama安全工具套件', newsId: '3' },
    { text: '研究人员发现新型LLM水印绕过攻击方法', newsId: '4' },
    { text: 'OpenAI发布新版安全对齐技术文档', newsId: '5' },
    { text: '欧盟AI法案正式生效，企业合规指南发布', newsId: '6' },
  ]
  const dup = [...items, ...items]

  const handleClick = (newsId: string) => {
    dispatch({ type: 'SET_CURRENT_ARTICLE', payload: newsId })
    dispatch({ type: 'SET_VIEW_MODE', payload: 'news-detail' })
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
        {/* 滚动区域 */}
        <div className="flex-1 overflow-hidden relative" style={{ maskImage: 'linear-gradient(90deg, transparent 0%, black 4%, black 96%, transparent 100%)' }}>
          <div style={{ display: 'inline-flex', whiteSpace: 'nowrap' as const, animation: 'ticker-scroll 36s linear infinite', willChange: 'transform', transform: 'translateZ(0)', minWidth: '200%' }}>
            {dup.map((item, i) => (
              <button key={i} onClick={() => handleClick(item.newsId)}
                className="text-[11px] sm:text-[13px] mr-6 sm:mr-8 inline-flex items-center cursor-pointer transition-colors duration-200 hover:text-white hover:underline underline-offset-4 decoration-cyan-400/50"
                style={{ color: 'rgba(203,213,225,0.75)' }}>
                <span className="w-1 h-1 rounded-full mr-2 shrink-0" style={{ background: 'rgba(251,191,36,0.6)' }} />
                {item.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { ripples, handleClick } = useRipple()
  const { dispatch } = useAppContext()

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
    <>
    <style>{`@keyframes shieldy-fadein { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
    <section ref={heroRef} className="relative overflow-hidden flex items-center" style={{ minHeight: '82vh', '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties}>

      {/* Background layers */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 120% 100% at 50% -20%, rgba(88,28,135,0.16) 0%, transparent 55%),' +
            'radial-gradient(ellipse 80% 70% at 75% 50%, rgba(59,130,246,0.08) 0%, transparent 50%),' +
            'radial-gradient(ellipse 60% 50% at 20% 70%, rgba(139,92,246,0.06) 0%, transparent 50%),' +
            'linear-gradient(180deg, #070B14 0%, #0C1027 40%, #0A0E1F 100%)',
        }}
      />
      <div className="absolute w-[600px] h-[450px] rounded-full blur-[100px] opacity-[0.04] transition-all duration-700 ease-out pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #8B5CF6 0%, #3B82F6 50%, transparent 70%)',
          left: 'var(--mouse-x)', top: 'var(--mouse-y)',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <StarField />
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
      />



      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-7 lg:px-12">

        {/* === 第一区：左侧品牌文案 + 右侧盾牌/跑马灯 === */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_280px] gap-6 sm:gap-6 md:gap-8 lg:gap-12 items-start pt-2 sm:pt-8 md:pt-12 lg:pt-16 pb-4">

          {/* ── 左列：品牌文案（紧凑一体化） ── */}
          <div className="max-w-2xl sm:max-w-3xl order-1 sm:pr-3 md:pr-4 lg:pr-6 xl:pr-8">
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:gap-2.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide"
                style={{ color: '#34D399', background: 'rgba(52,211,153,0.10)' }}>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                知之学长
              </span>
            </motion.div>

            {/* Title — 渐变文字 + 流动光柱 */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }}
              className="flex flex-col leading-[1.08] tracking-[0.01em] mt-6 sm:mt-8 lg:mt-9">
              <span className="relative inline-block bg-clip-text text-transparent font-extrabold mt-1 sm:mt-2 text-[48px] sm:text-[58px] md:text-[66px] lg:text-[78px] xl:text-[90px]"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #A78BFA 0%, #60A5FA 40%, #22D3EE 70%, #34D399 100%)',
                  backgroundSize: '300% auto',
                  animation: 'shimmer 8s linear infinite',
                  lineHeight: '1.1',
                }}>
                AIShield Lab
                <span className="absolute inset-0 bg-clip-text text-transparent pointer-events-none" style={{
                  backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.85) 55%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'text-sweep 4s ease-in-out infinite',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }} aria-hidden="true" />
              </span>
              <span className="mt-2 sm:mt-3 font-semibold tracking-wide text-[30px] sm:text-[32px] md:text-[36px] lg:text-[40px] xl:text-[44px]" style={{
                color: '#FFFFFF',
                lineHeight: '1.1',
              }}>AI Agent 安全实战平台</span>
            </motion.h1>

            {/* Description — 含星星分隔符 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16 }}
              className="mt-8 sm:mt-12">
              {/* 分隔装饰线 */}
              <div className="flex items-center gap-3 mb-3 sm:mb-4" style={{ maxWidth: '120px' }}>
                <div className="flex-1 h-px rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4))' }} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: '#A78BFA' }}><path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" fill="currentColor" opacity="0.7"/></svg>
                <div className="flex-1 h-px rounded-full" style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.4), transparent)' }} />
              </div>
              <p className="text-base sm:text-lg lg:text-xl leading-[1.8] sm:leading-[2] mt-2" style={{ color: 'rgba(203,213,225,0.78)' }}>
                25关Agent安全靶场实战 + OWASP LLM Top 10攻防演练 + 职业安全评估，专注AI Agent安全
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.22 }}
              className="flex flex-wrap items-center gap-3 sm:gap-4 mt-10 sm:mt-16">
              {/* 主CTA：进入Agent靶场 */}
              <button onClick={(e) => { handleClick(e); dispatch({ type: 'SET_VIEW_MODE', payload: 'range' }); }}
                className="group relative inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',
                  boxShadow: '0 6px 24px rgba(244,114,182,0.4), 0 0 0 1px rgba(244,114,182,0.15) inset',
                }}>
                {ripples.map(r => (
                  <span key={r.id} className="absolute rounded-full pointer-events-none animate-ripple"
                    style={{ left: r.x, top: r.y, width: 8, height: 8, background: 'rgba(255,255,255,0.3)', transform: 'translate(-50%, -50%)' }} />
                ))}
                <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.18) 0%, transparent 60%)' }} />
                <Sparkles className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" strokeWidth={2} />
                <span className="relative z-10 text-[13px] sm:text-[14px] tracking-wide">进入靶场</span>
                <ArrowRight className="w-3.5 h-3.5 relative z-10 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </button>
              {/* 次CTA：职业安全评估 */}
              <button onClick={() => {
                dispatch({ type: 'SET_VIEW_MODE', payload: 'career-guide' });
              }}
                className="group relative inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-medium text-[13px] sm:text-sm transition-all duration-300 hover:-translate-y-0.5 cursor-pointer overflow-hidden"
                style={{
                  color: 'rgba(226,232,240,0.9)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}>
                <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(135deg, rgba(244,114,182,0.08) 0%, rgba(99,102,241,0.04) 100%)' }} />
                <BookOpen className="w-4 h-4 relative z-10 text-slate-400 group-hover:text-[#F472B6] transition-colors" strokeWidth={2} />
                <span className="relative z-10">职业安全评估</span>
                <ArrowRight className="w-3.5 h-3.5 relative z-10 text-slate-500 group-hover:text-[#F472B6] group-hover:translate-x-1 transition-all" strokeWidth={2} />
              </button>
            </motion.div>
          </div>

          {/* ── 右列：盾牌/3D模型 + Slogan ── */}
          <div className="flex flex-col lg:pl-2 items-center order-2 lg:order-2 mt-[0px] sm:mt-[5px] lg:mt-[10px]">
            <div className="relative h-[170px] sm:h-[275px] md:h-[360px] lg:h-[410px] w-full flex items-center justify-center overflow-hidden" style={{ paddingBottom: '24px', animation: 'shieldy-fadein 0.8s ease-out' }}>
              {/* 星光装饰 */}
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full opacity-30 animate-pulse"
                    style={{ background: 'radial-gradient(circle, #A78BFA 0%, #60A5FA 50%, transparent 70%)' }} />
                </div>
              }>
                <HeroVisual />
              </Suspense>
            </div>
            {/* Slogan */}
            <p className="mt-[12px] sm:mt-[16px] lg:mt-[20px] text-[11px] sm:text-base tracking-[0.12em] sm:tracking-[0.16em] font-medium text-center bg-clip-text text-transparent whitespace-nowrap" style={{
              backgroundImage: 'linear-gradient(135deg, #F472B6 0%, #A78BFA 50%, #818CF8 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', opacity: 0.7,
            }}>
              「 安全不是终点，是Agent的起点 」
            </p>
          </div>
        </div>

        {/* === 数据统计行（功能卡上方）=== */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}
          className="pb-2 sm:pb-4 pt-0 sm:pt-1 lg:pt-2 flex items-center justify-start gap-4 sm:gap-8 lg:gap-12 max-w-lg">
          {[
            { icon: '🎯', num: '25+', label: '实战关卡' },
            { icon: '📊', num: '3', label: '大模型' },
            { icon: '📘', num: '7+', label: 'OWASP模块' },
            { icon: '✅', num: '全免费', label: '开练' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 sm:gap-2.5">
              <span className="text-sm sm:text-base">{stat.icon}</span>
              <div>
                <div className="text-base sm:text-lg lg:text-xl font-bold bg-clip-text text-transparent" style={{
                  backgroundImage: 'linear-gradient(135deg, #A78BFA 0%, #60A5FA 100%)',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text',
                }}>{stat.num}</div>
                <div className="text-[9px] sm:text-[10px]" style={{ color: 'rgba(148,163,184,0.4)' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>


      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 opacity-15 hover:opacity-35 transition-opacity">
        <div className="w-5 h-8 rounded-full border flex items-start justify-center p-1.5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="w-1 h-1.5 rounded-full bg-purple-400/50 animate-bounce" />
        </div>
      </div>
    </section>
    </>
  )
}
