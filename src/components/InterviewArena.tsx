import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, RotateCcw, User, Bot, MessageCircle, Lightbulb, Loader2, FileText, Upload, X, Sparkles, Mic, ChevronDown } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   AIShield Lab — 双AI面试训练场 v4
   蓝色UI重设计：参考 Coze/ChatGPT 风格
   左：IT面试助手（面试官） | 右：应聘搭子（参考回答）
   
   API 调用通过 Cloudflare Worker 代理（/api/coze/chat）
   Token 存储在 Workers 环境变量中，前端不可见
   ═══════════════════════════════════════════════════════════════ */

const PROXY_URL = '/api/coze/chat'  // Cloudflare Worker 代理路径

const INTERVIEWER_BOT_ID = '7642509976887574571'
const COACH_BOT_ID = '7642645272891523118'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

interface ChatSession {
  messages: Message[]
  conversationId: string | null
  isLoading: boolean
  input: string
}

interface UploadedFile {
  name: string
  content: string
  type: 'jd' | 'resume'
}

/* ── Coze Chat Hook (使用 @coze/api SDK) ── */
function useCozeChat(botId: string, contextFiles: UploadedFile[], filterType?: 'jd' | 'resume') {
  const [session, setSession] = useState<ChatSession>({
    messages: [],
    conversationId: null,
    isLoading: false,
    input: '',
  })
  const streamRef = useRef<AsyncIterable<unknown> | null>(null)

  const buildContextPrompt = useCallback((filterType?: 'jd' | 'resume'): string => {
    const files = filterType ? contextFiles.filter(f => f.type === filterType) : contextFiles
    if (files.length === 0) return ''
    let ctx = '[面试上下文信息]\n'
    for (const f of files) {
      const label = f.type === 'jd' ? '【岗位JD】' : '【个人简历】'
      ctx += `${label} ${f.name}\n${f.content}\n\n`
    }
    if (filterType === 'jd') ctx += '请基于以上岗位JD和简历信息进行针对性面试提问。'
    else if (filterType === 'resume') ctx += '请基于以上简历信息给出参考回答思路。'
    else ctx += '请基于以上信息进行针对性的面试提问/回答参考。'
    return ctx
  }, [contextFiles])

  const sendMessage = async (text: string): Promise<void> => {
    if (!text.trim() || session.isLoading || !botId) return

    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: Date.now() }
    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      input: '',
      isLoading: true,
    }))

    const contextPrompt = buildContextPrompt(filterType)
    const msgs: Array<{ role: string; content: string; content_type?: string }> = []

    if (contextPrompt) {
      msgs.push({ role: 'user', content: contextPrompt, content_type: 'text' })
      msgs.push({ role: 'assistant', content: '收到，我将基于提供的JD/简历信息进行针对性面试。', content_type: 'text' })
    }
    msgs.push({ role: 'user', content: text.trim(), content_type: 'text' })

    try {
      let assistantContent = ''
      let convId = session.conversationId

      // 通过 Cloudflare Worker 代理调用 Coze API（SSE 流式）
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: botId,
          user_id: `aishield_user_${Date.now()}`,
          auto_save_history: true,
          ...(session.conversationId ? { conversation_id: session.conversationId } : {}),
          additional_messages: msgs.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
            content_type: m.content_type as any,
          })),
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      // 手动解析 SSE 流
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (!data || data === '[DONE]') continue

          try {
            const event = JSON.parse(data)
            if (event.event === 'conversation.message.delta') {
              assistantContent += event.message?.content ?? ''
              setSession(prev => {
                const ms = [...prev.messages]
                const last = ms[ms.length - 1]
                if (last?.role === 'assistant') {
                  ms[ms.length - 1] = { ...last, content: assistantContent }
                } else {
                  ms.push({ role: 'assistant', content: assistantContent, timestamp: Date.now() })
                }
                return { ...prev, messages: ms }
              })
            } else if (event.event === 'conversation.message.completed' || event.event === 'conversation.chat.started') {
              convId = event.conversation_id || event.data?.conversation_id || convId
            } else if (event.event === 'error') {
              throw new Error(event.msg || event.error?.msg || 'Coze API error')
            }
          } catch (e) {
            // 非JSON行，忽略
          }
        }
      }

      setSession(prev => ({ ...prev, isLoading: false, conversationId: convId }))
    } catch (err: unknown) {
      const errMsg = (err as Error).message || ''
      console.error('Chat error:', err)
      let displayErr = `❌ 连接失败: ${errMsg}`
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('Load failed') || errMsg.includes('CORS') || errMsg.includes('404') || errMsg.includes('502')) {
        displayErr = '⚠️ 面试训练场正在升级中，暂时无法连接 AI 面试官。请稍后再试，或先去靶场练练手～'
      }
      setSession(prev => ({
        ...prev,
        messages: [...prev.messages, { role: 'system', content: displayErr, timestamp: Date.now() }],
        isLoading: false,
      }))
    }
  }

  const reset = () => {
    streamRef.current = null
    setSession({ messages: [], conversationId: null, isLoading: false, input: '' })
  }

  return { session, setSession, sendMessage, reset }
}

/* ── 文件上传区域（蓝色UI风格） ── */
function FileUploadBar({
  files,
  onUpload,
  onRemove,
}: {
  files: UploadedFile[]
  onUpload: (file: UploadedFile) => void
  onRemove: (name: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(txt|pdf|md|docx?)$/i)) return
    const reader = new FileReader()
    reader.onload = () => {
      const content = reader.result as string
      const isJD = /jd|职位|岗位|招聘|job.*description/i.test(file.name)
      onUpload({ name: file.name, content: content.slice(0, 8000), type: isJD ? 'jd' : 'resume' })
    }
    reader.readAsText(file)
  }

  return (
    <div className="mb-3">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault(); setDragOver(false)
          const f = e.dataTransfer.files[0]; if (f) handleFile(f)
        }}
        className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg cursor-pointer transition-all duration-300 w-fit ${
          dragOver
            ? 'border-cyan-400/50 bg-gradient-to-r from-cyan-500/[0.06] to-blue-500/[0.06]'
            : 'border-white/[0.08] hover:border-cyan-400/30 hover:bg-white/[0.02] bg-[rgba(15,18,35,0.5)]'
        }`}
        style={dragOver ? {} : { background: 'rgba(15,18,35,0.5)', border: '1px dashed rgba(255,255,255,0.08)' }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300"
          style={{
            background: dragOver ? 'rgba(34,211,238,0.15)' : 'rgba(59,130,246,0.1)',
            border: `1px solid ${dragOver ? 'rgba(34,211,238,0.3)' : 'rgba(59,130,246,0.2)'}`,
          }}>
          <Upload size={15} style={{ color: dragOver ? '#22D3EE' : '#3B82F6' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] text-white/70 font-medium">上传 JD / 简历</div>
          <div className="text-[10px] text-white/25 hidden sm:block">支持 .txt .pdf .md .docx · 面试官参考 JD+简历 · 教练参考简历</div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.md,.doc,.docx"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {files.map(f => (
            <div key={f.name}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: f.type === 'jd' ? 'rgba(244,114,182,0.08)' : 'rgba(59,130,246,0.08)',
                border: `1px solid ${f.type === 'jd' ? 'rgba(244,114,182,0.2)' : 'rgba(59,130,246,0.2)'}`,
                color: f.type === 'jd' ? '#F472B6' : '#60A5FA',
              }}>
              <FileText size={12} />
              <span className="max-w-[180px] truncate">{f.name}</span>
              <button onClick={() => onRemove(f.name)} className="ml-1 hover:opacity-60 cursor-pointer"><X size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── 聊天消息气泡（蓝色UI风格） ── */
function MessageBubble({ msg, accentColor, title }: { msg: Message; accentColor: string; title: string }) {
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center animate-fadeIn">
        <div className="max-w-[90%] rounded-xl px-4 py-2.5 text-xs text-red-400/80 bg-red-500/8 border border-red-500/15">
          {msg.content}
        </div>
      </div>
    )
  }

  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn mb-3`}>
      <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${
        isUser ? 'rounded-tr-md' : 'rounded-tl-md'
      }`}
        style={{
          background: isUser
            ? `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}10 100%)`
            : 'rgba(255,255,255,0.04)',
          border: isUser
            ? `1px solid ${accentColor}20`
            : '1px solid rgba(255,255,255,0.06)',
        }}>
        {/* 角色标签 */}
        <div className="flex items-center gap-1.5 mb-1.5">
          {isUser ? (
            <>
              <span className="text-[10px] font-medium" style={{ color: accentColor }}>你</span>
              <User size={11} style={{ color: accentColor }} />
            </>
          ) : (
            <>
              <Bot size={11} style={{ color: '#818CF8' }} />
              <span className="text-[10px] font-medium text-white/40">{title.split(' ')[0]}</span>
            </>
          )}
        </div>
        {/* 消息内容 */}
        <div className="text-[13px] leading-[1.7] whitespace-pre-wrap"
          style={{ color: isUser ? 'rgba(255,255,255,0.88)' : 'rgba(203,213,225,0.75)' }}>
          {msg.content || (
            <span className="inline-flex items-center gap-1.5 opacity-50">
              <Loader2 size={12} className="animate-spin" /> 思考中...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── 单个聊天面板（蓝色UI重设计） ── */
function ChatPanel({
  title,
  subtitle,
  icon: Icon,
  accentColor,
  gradientFrom,
  gradientTo,
  session,
  onSend,
  onReset,
  onInputChange,
  placeholder,
}: {
  title: string
  subtitle: string
  icon: React.ElementType
  accentColor: string
  gradientFrom: string
  gradientTo: string
  session: ChatSession
  onSend: (msg: string) => void
  onReset: () => void
  onInputChange: (value: string) => void
  placeholder: string
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = messagesEndRef.current
    if (!el) return
    const parent = el.parentElement
    if (parent) {
      parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' })
    }
  }, [session.messages.length, session.isLoading])

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(165deg, rgba(13,16,35,0.95) 0%, rgba(8,11,28,0.98) 100%)',
        border: `1px solid rgba(255,255,255,0.07)`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 80px ${gradientFrom}08, inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      {/* Header — 蓝色渐变背景 */}
      <div className="relative px-5 py-4 shrink-0 overflow-hidden"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* 蓝色渐变背景装饰 */}
        <div className="absolute inset-0 opacity-10"
          style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)` }} />
        <div className="absolute top-0 left-0 w-24 h-24 rounded-full blur-2xl"
          style={{ background: `radial-gradient(circle, ${gradientFrom}30 0%, transparent 70%)` }} />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
                boxShadow: `0 4px 16px ${gradientFrom}40`,
              }}>
              <Icon size={18} color="white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white/95">{title}</div>
              <div className="text-[11px]" style={{ color: `${accentColor}80` }}>{subtitle}</div>
            </div>
          </div>
          <button onClick={onReset}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06] cursor-pointer group"
            style={{ color: 'rgba(148,163,184,0.35)' }}>
            <RotateCcw size={13} className="group-hover:text-white/50 transition-colors" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: `${accentColor}25 transparent` }}>
        {session.messages.length === 0 && !session.isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${gradientFrom}15, ${gradientTo}10)`,
                border: `1px solid ${gradientFrom}20`,
              }}>
              <MessageCircle size={22} style={{ color: accentColor }} />
            </div>
            <span className="text-xs" style={{ color: 'rgba(148,163,184,0.4)' }}>发送消息开始面试对话</span>
          </div>
        )}
        {session.messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} accentColor={accentColor} title={title} />
        ))}
        {session.isLoading && session.messages[session.messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start animate-fadeIn mb-3">
            <div className="max-w-[82%] rounded-2xl rounded-tl-md px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Bot size={11} style={{ color: '#818CF8' }} />
                <span className="text-[10px] font-medium text-white/40">{title.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-white/50">
                <Loader2 size={14} className="animate-spin" style={{ color: accentColor }} />
                思考中...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — 蓝色边框聚焦 */}
      <div className="shrink-0 p-3 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex-1 relative">
            <input
              type="text"
              value={session.input}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSend(session.input)
                }
              }}
              placeholder={placeholder}
              disabled={session.isLoading}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/15 outline-none transition-all duration-300 disabled:opacity-40 hover:border-white/[0.14] focus:border-[#3B82F6]/50 focus:bg-white/[0.05]"
              style={{}}
            />
          </div>
          <button
            onClick={() => onSend(session.input)}
            disabled={session.isLoading || !session.input.trim()}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 cursor-pointer disabled:opacity-25 disabled:hover:translate-y-0 shadow-lg shrink-0"
            style={{
              background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
              boxShadow: `0 4px 20px ${gradientFrom}45`,
            }}>
            <Send size={16} color="white" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */

export function InterviewArena() {
  const [contextFiles, setContextFiles] = useState<UploadedFile[]>([])
  const [showCoach, setShowCoach] = useState(true)

  const interviewer = useCozeChat(INTERVIEWER_BOT_ID, contextFiles, undefined)
  const coach = useCozeChat(COACH_BOT_ID, contextFiles, 'resume')

  const handleFileUpload = useCallback((file: UploadedFile) => {
    setContextFiles(prev => [...prev.filter(f => f.name !== file.name), file])
  }, [])

  const handleFileRemove = useCallback((name: string) => {
    setContextFiles(prev => prev.filter(f => f.name !== name))
  }, [])

  const handleInterviewerSend = (text: string) => {
    interviewer.sendMessage(text)
    if (coach.session.conversationId || coach.session.messages.length > 0) {
      coach.sendMessage(text)
    }
  }

  return (
    <section id="interview" className="relative py-8 lg:py-10">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #3B82F6, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">

        {/* 标题区 — 蓝色渐变 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-3"
            style={{
              background: 'linear-gradient(90deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
              border: '1px solid rgba(59,130,246,0.15)',
              color: '#60A5FA',
            }}>
            <Sparkles size={13} style={{ color: '#A78BFA' }} />
            双AI陪练 · 真实面试预演
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white/95 tracking-tight">
            模拟面试训练场
          </h2>
          <p className="text-xs text-white/30 mt-1.5 max-w-md mx-auto">
            面试官追问 + 教练给参考回答，双AI陪你练
          </p>
        </div>

        {/* 文件上传区 — 靠左 */}
        <div className="flex flex-wrap items-center gap-3 justify-start">
          <FileUploadBar
            files={contextFiles}
            onUpload={handleFileUpload}
            onRemove={handleFileRemove}
          />
        </div>

        {/* 移动端：教练面板切换按钮 */}
        <div className="md:hidden flex justify-end mb-2">
          <button onClick={() => setShowCoach(!showCoach)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
            style={{
              background: showCoach ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)',
              color: showCoach ? '#34D399' : 'rgba(148,163,184,0.6)',
              border: showCoach ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(255,255,255,0.08)',
            }}>
            {showCoach ? '💡 隐藏教练' : '💡 显示教练'}
          </button>
        </div>

        {/* 双栏聊天 — 窄高长形 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5" style={{ height: 'auto', minHeight: '380px', maxHeight: '600px' }}>
          <ChatPanel
            title="🎯 面试官"
            subtitle="IT面试助手 · 真实追问"
            icon={Bot}
            accentColor="#60A5FA"
            gradientFrom="#3B82F6"
            gradientTo="#6366F1"
            session={interviewer.session}
            onSend={handleInterviewerSend}
            onReset={interviewer.reset}
            onInputChange={v => interviewer.setSession(s => ({ ...s, input: v }))}
            placeholder="描述你想应聘的岗位，开始面试..."
          />
          {showCoach && (
            <ChatPanel
              title="💡 教练"
              subtitle="应聘搭子 · 参考回答"
              icon={Lightbulb}
              accentColor="#34D399"
              gradientFrom="#059669"
              gradientTo="#10B981"
              session={coach.session}
              onSend={(t) => coach.sendMessage(t)}
              onReset={coach.reset}
              onInputChange={v => coach.setSession(s => ({ ...s, input: v }))}
              placeholder="同步接收面试问题..."
            />
          )}
        </div>
      </div>
    </section>
  )
}
