import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Minimize2, Bot, Sparkles, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { chatWithTeachingAssistant } from '../services/dashscope'

/* ═══════════════════════════════════════════════════════════════
   ShieldyAssistant v2 — 精致 AI 助教浮窗
   - SVG 机器人头像替代 emoji
   - 首次访问自动弹出欢迎
   - 更精致的聊天面板 UI
   ═══════════════════════════════════════════════════════════════ */

const WELCOME_MSG = '你好！我是 Shieldy，你的 AI 安全学习助手 🛡️ 有什么可以帮你的？无论是学习问题、靶场攻略还是面试准备，随时问我～'

const QUICK_QUESTIONS = [
  { label: '🎯 什么是 Prompt 注入？', answer: 'Prompt 注入是一种通过在用户输入中植入恶意指令，绕过 AI 系统安全过滤的技术。常见手法包括角色扮演注入（如 DAN 攻击）、编码绕过（如 Base64）、以及利用多轮对话上下文的上下文注入。防御方法包括输入过滤、输出检测和对抗训练。' },
  { label: '🎮 靶场怎么玩？', answer: '点击导航栏的「靶场」即可进入！目前有 50+ 实战关卡，覆盖 Prompt 注入、对抗攻击、数据泄露等多个方向。浏览器直接开练，不用装任何环境～' },
  { label: '📚 从哪开始学？', answer: '推荐路径：先去「知识库」系统化学习基础理论 → 再进「靶场」边玩边练 → 最后用「AI 面试训练场」模拟真实面试。如果零基础也不用担心，平台专门为在校生设计！' },
  { label: '💡 Shieldy 是谁？', answer: '我是 AIShield Lab 的 AI 助教 Shieldy 🤖 专门帮你解答 AI 安全学习中的各种问题。学习问题问我，职业规划找学长 → 点击导航栏「联系学长」可以预约 1 对 1 咨询哦！' },
]

/* ── SVG 机器人头像 ── */
function ShieldyAvatar({ size = 48, glowing = false }: { size?: number; glowing?: boolean }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="avBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6"/>
          <stop offset="50%" stopColor="#6366F1"/>
          <stop offset="100%" stopColor="#38BDF8"/>
        </linearGradient>
        <linearGradient id="avFace" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E1B4B"/>
          <stop offset="100%" stopColor="#0C1027"/>
        </linearGradient>
        <filter id="avGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      {/* 外圈光晕 */}
      {glowing && (
        <circle cx="24" cy="24" r="23" fill="none" stroke="url(#avBg)" strokeWidth="1" opacity="0.3">
          <animate attributeName="r" values="22;24;22" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.3;0.15;0.3" dur="2s" repeatCount="indefinite"/>
        </circle>
      )}

      {/* 圆角方形底座 */}
      <rect x="4" y="4" width="40" height="40" rx="14" fill="url(#avBg)" filter={glowing ? "url(#avGlow)" : undefined}/>

      {/* 内屏 */}
      <rect x="9" y="10" width="30" height="26" rx="8" fill="url(#avFace)" opacity="0.9"/>

      {/* 盾牌图标（面部中心） */}
      <g transform="translate(16, 16)">
        <path d="M8 0L13.5 2.5V7C13.5 10 11 12.5 8 13.5C5 12.5 2.5 10 2.5 7V2.5L8 0Z"
          fill="none" stroke="#A78BFA" strokeWidth="1.2" strokeLinejoin="round" opacity="0.7"/>
        <path d="M8 2.5L11 4V7C11 9 9.5 11 8 11.5C6.5 11 5 9 5 7V4L8 2.5Z"
          fill="rgba(167,139,250,0.15)"/>
        <circle cx="8" cy="7" r="1.8" fill="#A78BFA" opacity="0.8">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
        </circle>
      </g>

      {/* 左眼 — 圆点 */}
      <circle cx="16" cy="28" r="1.8" fill="#60A5FA">
        <animate attributeName="r" values="1.8;2;1.8" dur="3s" repeatCount="indefinite"/>
      </circle>

      {/* 右眼 — 圆点 */}
      <circle cx="32" cy="28" r="1.8" fill="#C084FC">
        <animate attributeName="r" values="1.8;2;1.8" dur="3s" repeatCount="indefinite" begin="0.5s"/>
      </circle>

      {/* 嘴巴 — 小弧线 */}
      <path d="M20 33 Q24 35.5 28 33" fill="none" stroke="#34D399" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>

      {/* 天线 */}
      <line x1="24" y1="4" x2="24" y2="0" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <circle cx="24" cy="0" r="1.5" fill="#34D399" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.5s" repeatCount="indefinite"/>
      </circle>
    </svg>
  )
}

export function ShieldyAssistant() {
  const [expanded, setExpanded] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [autoOpened, setAutoOpened] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 首次访问自动弹出（延迟3秒）
  useEffect(() => {
    if (!autoOpened) {
      const timer = setTimeout(() => {
        setPanelOpen(true)
        setAutoOpened(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [autoOpened])

  // Welcome message on first open
  useEffect(() => {
    if (panelOpen && messages.length === 0) {
      setTimeout(() => {
        setMessages([{ role: 'assistant', text: WELCOME_MSG }])
      }, 400)
    }
  }, [panelOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleQuickQuestion = (q: typeof QUICK_QUESTIONS[0]) => {
    setMessages(prev => [...prev, { role: 'user', text: q.label }])
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: q.answer }])
    }, 600)
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return
    const question = inputValue.trim()
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setInputValue('')
    setIsLoading(true)
    try {
      const answer = await chatWithTeachingAssistant(question, {
        topic: 'AI 安全',
        difficulty: 'intermediate',
      }, messages.map(m => ({ role: m.role === 'assistant' ? 'ai' as const : 'user' as const, content: m.text })))
      setMessages(prev => [...prev, { role: 'assistant', text: answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: '抱歉，我暂时无法回答这个问题 😅 建议先去知识库或靶场探索更多内容，或者点击「联系学长」预约人工咨询～' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* ═══ Chat Panel ═══ */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-[60] w-[340px] sm:w-[400px] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{
              background: 'linear-gradient(165deg, #0E1530 0%, #0C1027 60%, #0A0E1F 100%)',
              border: '1px solid rgba(139,92,246,0.18)',
              boxShadow: '0 0 0 1px rgba(139,92,246,0.06), 0 24px 72px rgba(0,0,0,0.65), 0 0 56px rgba(139,92,246,0.06)',
              maxHeight: '85vh',
            }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(99,102,241,0.07) 50%, rgba(56,189,248,0.04) 100%)',
                borderBottom: '1px solid rgba(139,92,246,0.10)',
              }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShieldyAvatar size={34} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white/95">Shieldy</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ color: '#34D399', background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.18)' }}>
                      AI 助教
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-400/70 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    在线 · 随时响应
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => setExpanded(!expanded)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer">
                  <Minimize2 size={13} />
                </button>
                <button onClick={() => { setPanelOpen(false); setExpanded(false); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer">
                  <X size={13} />
                </button>
              </div>
            </div>



            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[180px] scrollbar-thin"
              style={{ background: 'rgba(255,255,255,[0.01])' }}>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed`}
                    style={{
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'
                        : 'rgba(255,255,255,0.045)',
                      color: msg.role === 'user' ? 'white' : 'rgba(203,213,225,0.88)',
                      border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    }}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3" style={{
                    background: 'rgba(255,255,255,0.045)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '16px 16px 16px 4px',
                  }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0s' }}/>
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.15s' }}/>
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.3s' }}/>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Quick Questions ── */}
            <div className="px-4 pb-2.5 pt-1 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={11} className="text-purple-400/50" />
                <span className="text-[10px] text-white/25 uppercase tracking-widest font-mono">快捷提问</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.slice(0, expanded ? 4 : 2).map(q => (
                  <button key={q.label} onClick={() => handleQuickQuestion(q)}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] leading-tight transition-all hover:-translate-y-0.5 cursor-pointer"
                    style={{
                      background: 'rgba(139,92,246,0.07)',
                      border: '1px solid rgba(139,92,246,0.13)',
                      color: 'rgba(167,139,250,0.85)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.28)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.07)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.13)' }}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Input ── */}
            <div className="px-4 pb-4 pt-2 shrink-0">
              <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(139,92,246,0.12)',
                }}>
                <input value={inputValue} onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="输入你的问题..."
                  className="flex-1 text-[13px] text-white/85 bg-transparent outline-none placeholder:text-white/18"/>
                <button onClick={handleSend} disabled={isLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
                  <Send size={13} color="white" />
                </button>
              </div>
              <p className="text-[9px] text-white/12 text-center mt-1.5">学习问题问我 · 职业规划找学长 →</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Floating Button ═══ */}
      <AnimatePresence>
        {!panelOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={() => setPanelOpen(true)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="fixed bottom-6 right-6 z-[60] cursor-pointer"
            aria-label="打开 Shieldy AI 助教"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              {/* 悬停气泡 */}
              <AnimatePresence>
                {hovered && (
                  <motion.div initial={{ opacity: 0, y: 6, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.92 }} transition={{ duration: 0.18 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-medium shadow-xl"
                    style={{
                      background: 'linear-gradient(160deg, #151A30 0%, #0E1428 100%)',
                      border: '1px solid rgba(139,92,246,0.22)',
                      backdropFilter: 'blur(12px)',
                      color: 'rgba(203,213,225,0.9)',
                    }}>
                    👋 有什么可以帮你的？
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 mt-[-4px]"
                      style={{ background: '#151A30', borderTop: '1px solid rgba(139,92,246,0.22)', borderLeft: '1px solid rgba(139,92,246,0.22)', borderTopColor: 'transparent', borderLeftColor: 'transparent' }}/>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 按钮主体 */}
              <div className="relative w-[58px] h-[58px] rounded-2xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: hovered
                    ? 'linear-gradient(145deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))'
                    : 'linear-gradient(145deg, rgba(139,92,246,0.12), rgba(99,102,241,0.08))',
                  border: `1px solid ${hovered ? 'rgba(139,92,246,0.45)' : 'rgba(139,92,246,0.25)'}`,
                  boxShadow: hovered
                    ? '0 0 32px rgba(139,92,246,0.3), 0 8px 32px rgba(0,0,0,0.4)'
                    : '0 0 20px rgba(139,92,246,0.15), 0 4px 20px rgba(0,0,0,0.3)',
                  transform: hovered ? 'scale(1.08)' : 'scale(1)',
                }}>
                <ShieldyAvatar size={38} glowing={hovered} />

                {/* 未读指示器 */}
                <div className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #34D399, #10B981)', boxShadow: '0 0 8px rgba(52,211,153,0.5)' }}>
                  <MessageCircle size={9} color="white" strokeWidth={2.5} />
                </div>
              </div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
