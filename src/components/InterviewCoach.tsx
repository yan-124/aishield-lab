import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, RotateCcw, User, Bot, Lightbulb, Loader2, FileText, Upload, X, Edit3, Save, Sparkles, ChevronDown, Check, History, BookOpen, Briefcase, Code2, Shield } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   AIShield Lab — 应聘搭子 v1
   面试参考回答助手，根据简历内容生成活人感回答
   1分钟答题模板：先给结论，再解释观点
   
   API 调用通过 Cloudflare Worker 代理（/api/coze/chat）
   Token 存储在 Workers 环境变量中，前端不可见
   ═══════════════════════════════════════════════════════════════ */

const PROXY_URL = '/api/coze/chat'
const COACH_BOT_ID = '7642644646338215988'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  editable?: boolean
  editedContent?: string
}

interface ResumeInfo {
  name: string
  skills: string[]
  projects: string[]
  experiences: string[]
  education: string[]
}

interface ChatSession {
  messages: Message[]
  conversationId: string | null
  isLoading: boolean
  input: string
}

interface AnswerStyle {
  id: string
  label: string
  description: string
  prompt: string
}

const ANSWER_STYLES: AnswerStyle[] = [
  {
    id: 'concise',
    label: '简洁精炼',
    description: '1-2分钟核心要点',
    prompt: '【回答长度强制要求】总字数必须严格控制在150字以内（不超过180字）。结构：第一句直接给结论（1句话），紧接1-2个要点（每个≤30字）。不要使用分点列表，不要展开描述，不要寒暄，直接输出核心答案。',
  },
  {
    id: 'detailed',
    label: '详细完整',
    description: '2-3分钟完整论述',
    prompt: '【回答长度强制要求】总字数控制在400-550字之间。结构：先用1-2句给出核心结论，然后分3个要点展开（每个要点80-150字），每个要点需结合简历中的具体项目或数据佐证。',
  },
  {
    id: 'story',
    label: '故事叙述',
    description: '项目案例驱动',
    prompt: '【回答长度强制要求】总字数控制在300-450字之间。结构：以STAR法则叙述——先说情境(Situation)和任务(Task)（80字内），再讲具体行动(Action)和结果(Result)（200字内），最后用1-2句总结收获。语言口语化、有真实感。',
  },
  {
    id: 'technical',
    label: '技术深度',
    description: '原理与实现细节',
    prompt: '【回答长度强制要求】总字数控制在350-500字之间。结构：先点明技术原理或核心概念（80字内），再分2-3个层次说明实现细节（每个层次100字左右），最后给出技术选型理由或最佳实践。不要泛泛而谈，必须有技术深度。',
  },
]

const QUESTION_CATEGORIES = [
  { id: 'self', label: '自我介绍', icon: User, keywords: ['自我介绍', '介绍一下自己', '说说你', '个人情况'] },
  { id: 'project', label: '项目经验', icon: Briefcase, keywords: ['项目', '经验', '做过什么', '主导', '负责'] },
  { id: 'skill', label: '技能掌握', icon: Code2, keywords: ['技能', '掌握', '熟悉', '精通', '技术栈'] },
  { id: 'security', label: '安全知识', icon: Shield, keywords: ['安全', '漏洞', '渗透', '防护', '攻击'] },
  { id: 'behavior', label: '行为面试', icon: History, keywords: ['遇到', '困难', '挑战', '解决', '团队'] },
  { id: 'career', label: '职业规划', icon: BookOpen, keywords: ['规划', '目标', '未来', '发展', '为什么'] },
]

/* ── Coze Chat Hook ── */
function useCozeChat(botId: string) {
  const [session, setSession] = useState<ChatSession>({
    messages: [],
    conversationId: null,
    isLoading: false,
    input: '',
  })
  const userIdRef = useRef<string>(`aishield_coach_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)

  const sendMessage = async (text: string, resumeContext: string = '', stylePrompt: string = ''): Promise<void> => {
    if (!text.trim() || session.isLoading || !botId) return

    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: Date.now() }
    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      input: '',
      isLoading: true,
    }))

    const msgs: Array<{ role: string; content: string; content_type?: string }> = []

    const fullPrompt = [
      '你是一位资深的AI安全领域面试辅导教练，正在为求职者提供面试模拟。',
      '',
      '【核心要求 - 必须严格遵守】',
      '1. 严格遵循所选回答风格的长度限制（风格指令中的字数要求为硬性约束）',
      '2. 必须使用"1分钟答题模板"：第一段先给结论（一两句话直接亮明观点），后续段落解释观点（用具体经历/数据支撑）',
      '3. 紧密引用用户简历中的真实信息：项目名称、技术栈、数据成果、工作年限等',
      '4. 语言要像真实求职者在面试现场说的话——自然、有停顿感、避免"作为XXX"等机械开场',
      '5. 禁止使用"首先...其次...最后..."的模板化连接词',
      '6. 禁止使用"以上是我的回答"、"希望对您有帮助"等客套话',
      '',
      '【所选回答风格】',
      stylePrompt,
      '',
      resumeContext ? `【候选人简历信息】\n${resumeContext}` : '【候选人简历信息】未提供简历，请基于问题给出通用但具体的回答框架。',
      '',
      '【面试问题】',
      text.trim(),
      '',
      '【输出格式】',
      '直接输出面试回答正文，不要加任何"回答如下"等前缀，不要分点编号（除非问题本身要求）。',
    ].join('\n')

    msgs.push({ role: 'user', content: fullPrompt, content_type: 'text' })

    try {
      let assistantContent = ''
      let convId = session.conversationId

      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: botId,
          user_id: userIdRef.current,
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
        let errDetail = ''
        try { errDetail = await response.text() } catch {}
        throw new Error('HTTP ' + response.status + (errDetail ? ': ' + errDetail.slice(0, 200) : ''))
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let currentEventType = ''
        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEventType = line.slice(6).trim()
            continue
          }
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (!data || data === '[DONE]') continue

          try {
            const evt = JSON.parse(data)

            if (evt.conversation_id) {
              convId = evt.conversation_id
            }

            if ((currentEventType === 'conversation.message.delta' || currentEventType === '') && evt.type === 'answer') {
              assistantContent += evt.content ?? ''
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
            }

            if (evt.type === 'answer' && evt.content && !currentEventType) {
              assistantContent += evt.content
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
            }

            if (evt.message && evt.message.content) {
              const content = evt.message.content
              if (typeof content === 'string') {
                assistantContent += content
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
              } else if (Array.isArray(content)) {
                for (const item of content) {
                  if (item.type === 'text' && item.text) {
                    assistantContent += item.text
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
                  }
                }
              }
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Coze API error' && !e.message.startsWith('❌')) throw e
          }
          currentEventType = ''
        }
      }

      setSession(prev => ({ ...prev, isLoading: false, conversationId: convId }))
    } catch (err: unknown) {
      const errMsg = (err as Error).message || ''
      console.error('Chat error:', err)
      const displayErr = `❌ 生成回答失败: ${errMsg}. 请检查网络或刷新页面重试。`
      setSession(prev => ({
        ...prev,
        messages: [...prev.messages, { role: 'system', content: displayErr, timestamp: Date.now() }],
        isLoading: false,
      }))
    }
  }

  const reset = () => {
    setSession({ messages: [], conversationId: null, isLoading: false, input: '' })
  }

  return { session, setSession, sendMessage, reset }
}

/* ── 简历解析模块 ── */
function parseResume(content: string): ResumeInfo {
  const info: ResumeInfo = {
    name: '',
    skills: [],
    projects: [],
    experiences: [],
    education: [],
  }

  const lines = content.split('\n')
  
  // 提取姓名
  const nameMatch = content.match(/姓[\u4e00-\u9fa5]{1,2}名[\u4e00-\u9fa5]{1,2}|[\u4e00-\u9fa5]{2,4}\s*(?:先生|女士)?/)
  if (nameMatch) {
    info.name = nameMatch[0].replace(/(姓|名|先生|女士)/g, '').trim()
  }

  // 提取技能
  const skillKeywords = ['技能', '专业技能', '技术栈', '掌握', '熟悉', '精通', '技术']
  let inSkillsSection = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (skillKeywords.some(k => trimmed.includes(k)) && trimmed.length < 50) {
      inSkillsSection = true
      continue
    }
    if (inSkillsSection) {
      if (trimmed.length > 3 && trimmed.length < 100) {
        const skills = trimmed.split(/[,，、\s]+/).filter(s => s.length > 1)
        info.skills.push(...skills)
      }
      if (trimmed === '' || trimmed.length > 100) {
        inSkillsSection = false
      }
    }
  }
  info.skills = [...new Set(info.skills)].slice(0, 10)

  // 提取项目经验
  const projectKeywords = ['项目', '作品', '实践', '开发']
  for (const line of lines) {
    const trimmed = line.trim()
    if (projectKeywords.some(k => trimmed.includes(k)) && trimmed.length < 150) {
      info.projects.push(trimmed)
    }
  }
  info.projects = [...new Set(info.projects)].slice(0, 5)

  // 提取工作经验
  const expKeywords = ['工作', '实习', '经历', '任职', '负责']
  for (const line of lines) {
    const trimmed = line.trim()
    if (expKeywords.some(k => trimmed.includes(k)) && trimmed.length < 200) {
      info.experiences.push(trimmed)
    }
  }
  info.experiences = [...new Set(info.experiences)].slice(0, 5)

  // 提取教育背景
  const eduKeywords = ['学历', '教育', '毕业', '学校', '大学', '本科', '硕士']
  for (const line of lines) {
    const trimmed = line.trim()
    if (eduKeywords.some(k => trimmed.includes(k)) && trimmed.length < 100) {
      info.education.push(trimmed)
    }
  }
  info.education = [...new Set(info.education)].slice(0, 3)

  return info
}

/* ── 文件上传组件 ── */
function ResumeUploader({
  onUpload,
  resumeInfo,
}: {
  onUpload: (content: string) => void
  resumeInfo: ResumeInfo
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    
    if (ext === 'docx' || ext === 'doc') {
      alert('暂不支持 .docx/.doc 格式，请将内容复制到 .txt 或 .md 文件后上传')
      return
    }
    if (!ext || !['txt', 'pdf', 'md'].includes(ext)) return

    if (ext === 'pdf') {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let text = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map((item: any) => item.str).join(' ') + '\n'
        }
        onUpload(text.slice(0, 10000))
      } catch (e) {
        console.error('PDF parse error:', e)
        alert('PDF 解析失败，请将内容复制到 .txt 文件后上传')
      }
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const content = reader.result as string
      onUpload(content.slice(0, 10000))
    }
    reader.readAsText(file)
  }

  const hasResume = resumeInfo.skills.length > 0 || resumeInfo.projects.length > 0

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
          <FileText size={14} style={{ color: '#60A5FA' }} />
          简历信息
        </h3>
        {hasResume && (
          <button
            onClick={() => onUpload('')}
            className="text-[11px] text-white/30 hover:text-white/50 transition-colors cursor-pointer"
          >
            清除简历
          </button>
        )}
      </div>

      {!hasResume ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault(); setDragOver(false)
            const f = e.dataTransfer.files[0]; if (f) handleFile(f)
          }}
          className={`flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
            dragOver
              ? 'border-cyan-400/50 bg-cyan-500/5'
              : 'border-white/10 hover:border-cyan-400/30 hover:bg-white/[0.02]'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            dragOver ? 'bg-cyan-500/15' : 'bg-blue-500/10'
          }`}>
            <Upload size={20} style={{ color: dragOver ? '#22D3EE' : '#60A5FA' }} />
          </div>
          <div className="text-sm text-white/70">上传简历文件</div>
          <div className="text-xs text-white/30">支持 .txt .pdf .md 格式</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.md"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
          />
        </div>
      ) : (
        <div className="space-y-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {resumeInfo.name && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-sm font-medium text-white/80">{resumeInfo.name}</span>
            </div>
          )}
          {resumeInfo.skills.length > 0 && (
            <div>
              <div className="text-[11px] text-white/30 mb-2">技能标签</div>
              <div className="flex flex-wrap gap-2">
                {resumeInfo.skills.slice(0, 8).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: 'rgba(59,130,246,0.1)',
                      border: '1px solid rgba(59,130,246,0.2)',
                      color: '#60A5FA',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {resumeInfo.projects.length > 0 && (
            <div>
              <div className="text-[11px] text-white/30 mb-2">项目经验</div>
              <ul className="space-y-1.5">
                {resumeInfo.projects.slice(0, 3).map((project, i) => (
                  <li key={i} className="text-xs text-white/50 line-clamp-2">
                    • {project}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {resumeInfo.experiences.length > 0 && (
            <div>
              <div className="text-[11px] text-white/30 mb-2">工作经历</div>
              <ul className="space-y-1.5">
                {resumeInfo.experiences.slice(0, 2).map((exp, i) => (
                  <li key={i} className="text-xs text-white/50 line-clamp-2">
                    • {exp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── 回答风格选择器 ── */
function StyleSelector({
  selectedStyle,
  onSelect,
  compact = false,
}: {
  selectedStyle: AnswerStyle
  onSelect: (style: AnswerStyle) => void
  compact?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all hover:bg-white/[0.05]"
        style={{
          background: 'rgba(244,114,182,0.08)',
          border: '1px solid rgba(244,114,182,0.2)',
          color: '#F472B6',
        }}
        title={`当前风格：${selectedStyle.label} - ${selectedStyle.description}`}
      >
        <Sparkles size={11} style={{ color: '#F472B6' }} />
        {selectedStyle.label}
        <ChevronDown size={11} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-60 rounded-xl overflow-hidden z-50"
          style={{
            background: 'rgba(13,16,35,0.98)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
          <div className="px-3 py-2 text-[10px] text-white/30 border-b border-white/[0.04]">
            选择回答风格（字数与结构不同）
          </div>
          {ANSWER_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => {
                onSelect(style)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all cursor-pointer ${
                selectedStyle.id === style.id ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                selectedStyle.id === style.id ? 'bg-pink-500/15' : 'bg-white/[0.05]'
              }`}>
                {selectedStyle.id === style.id && <Check size={10} style={{ color: '#F472B6' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium ${
                  selectedStyle.id === style.id ? 'text-white/90' : 'text-white/65'
                }`}>
                  {style.label}
                </div>
                <div className="text-[10px] text-white/35 mt-0.5">{style.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── 问题分类标签 ── */
function QuestionCategoryTags({
  onSelect,
}: {
  onSelect: (category: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-2.5">
      {QUESTION_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all hover:bg-white/[0.05]"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(148,163,184,0.6)',
          }}
        >
          <cat.icon size={10} />
          {cat.label}
        </button>
      ))}
    </div>
  )
}

/* ── 消息气泡 ── */
function MessageBubble({
  msg,
  onEdit,
  onSave,
  onChange,
}: {
  msg: Message
  onEdit: (index: number) => void
  onSave: (index: number, content: string) => void
  onChange: (index: number, value: string) => void
}) {
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center mb-3">
        <div className="max-w-[90%] rounded-xl px-4 py-2.5 text-xs text-red-400/80 bg-red-500/8 border border-red-500/15">
          {msg.content}
        </div>
      </div>
    )
  }

  const isUser = msg.role === 'user'
  const isAssistant = msg.role === 'assistant'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[88%] ${
        isUser ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tl-md'
      }`}
        style={{
          background: isUser
            ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 100%)'
            : 'rgba(255,255,255,0.04)',
          border: isUser
            ? '1px solid rgba(59,130,246,0.2)'
            : '1px solid rgba(255,255,255,0.06)',
        }}>
        <div className="flex items-center justify-between mb-1.5 px-4 pt-2.5">
          <div className="flex items-center gap-1.5">
            {isUser ? (
              <>
                <span className="text-[10px] font-medium text-blue-400">你</span>
                <User size={10} style={{ color: '#60A5FA' }} />
              </>
            ) : (
              <>
                <Lightbulb size={10} style={{ color: '#34D399' }} />
                <span className="text-[10px] font-medium text-white/40">应聘搭子</span>
              </>
            )}
          </div>
          {isAssistant && !msg.editable && (
            <button
              onClick={() => onEdit(msg.timestamp)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <Edit3 size={9} />
              编辑
            </button>
          )}
          {isAssistant && msg.editable && (
            <button
              onClick={() => onSave(msg.timestamp, msg.editedContent || msg.content)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all cursor-pointer"
            >
              <Save size={9} />
              保存
            </button>
          )}
        </div>

        <div className="px-4 pb-3">
          {msg.editable ? (
            <textarea
              value={msg.editedContent ?? msg.content}
              onChange={(e) => onChange(msg.timestamp, e.target.value)}
              className="w-full bg-transparent text-[13px] leading-[1.7] text-white/80 outline-none resize-none min-h-[80px]"
              style={{ color: 'rgba(203,213,225,0.85)' }}
            />
          ) : (
            <div className="text-[13px] leading-[1.7] whitespace-pre-wrap"
              style={{ color: isUser ? 'rgba(255,255,255,0.88)' : 'rgba(203,213,225,0.78)' }}>
              {msg.content || (
                <span className="inline-flex items-center gap-1.5 opacity-50">
                  <Loader2 size={12} className="animate-spin" /> 思考中...
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── 主组件 ── */
export function InterviewCoach() {
  const [resumeContent, setResumeContent] = useState('')
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo>({
    name: '',
    skills: [],
    projects: [],
    experiences: [],
    education: [],
  })
  const [selectedStyle, setSelectedStyle] = useState<AnswerStyle>(ANSWER_STYLES[0])
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({})
  const [resumeExpanded, setResumeExpanded] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)

  const coach = useCozeChat(COACH_BOT_ID)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = messagesEndRef.current
    if (!el) return
    const parent = el.parentElement
    if (parent) {
      parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' })
    }
  }, [coach.session.messages.length, coach.session.isLoading])

  useEffect(() => {
    const saved = localStorage.getItem('aishield_coach_answers')
    if (saved) {
      try {
        setSavedAnswers(JSON.parse(saved))
      } catch {
        setSavedAnswers({})
      }
    }
  }, [])

  const handleResumeUpload = useCallback((content: string) => {
    setResumeContent(content)
    if (content) {
      const info = parseResume(content)
      setResumeInfo(info)
      setResumeExpanded(true)
    } else {
      setResumeInfo({
        name: '',
        skills: [],
        projects: [],
        experiences: [],
        education: [],
      })
      setResumeExpanded(false)
    }
  }, [])

  const buildResumeContext = useCallback((): string => {
    if (!resumeContent) return ''
    
    const sections: string[] = []
    if (resumeInfo.name) sections.push(`姓名：${resumeInfo.name}`)
    if (resumeInfo.skills.length > 0) sections.push(`技能：${resumeInfo.skills.join('、')}`)
    if (resumeInfo.projects.length > 0) sections.push(`项目经验：${resumeInfo.projects.join('；')}`)
    if (resumeInfo.experiences.length > 0) sections.push(`工作经历：${resumeInfo.experiences.join('；')}`)
    if (resumeInfo.education.length > 0) sections.push(`教育背景：${resumeInfo.education.join('；')}`)
    
    return sections.join('\n')
  }, [resumeContent, resumeInfo])

  const handleSend = useCallback((text: string) => {
    const resumeContext = buildResumeContext()
    coach.sendMessage(text, resumeContext, selectedStyle.prompt)
  }, [coach, buildResumeContext, selectedStyle.prompt])

  const handleEdit = useCallback((timestamp: number) => {
    coach.setSession(prev => ({
      ...prev,
      messages: prev.messages.map(m =>
        m.timestamp === timestamp ? { ...m, editable: true, editedContent: m.content } : m
      ),
    }))
  }, [coach])

  const handleEditChange = useCallback((timestamp: number, value: string) => {
    coach.setSession(prev => ({
      ...prev,
      messages: prev.messages.map(m =>
        m.timestamp === timestamp ? { ...m, editedContent: value } : m
      ),
    }))
  }, [coach])

  const handleSave = useCallback((timestamp: number, content: string) => {
    coach.setSession(prev => ({
      ...prev,
      messages: prev.messages.map(m =>
        m.timestamp === timestamp ? { ...m, editable: false, content, editedContent: undefined } : m
      ),
    }))
    
    const newSaved = { ...savedAnswers, [timestamp]: content }
    setSavedAnswers(newSaved)
    localStorage.setItem('aishield_coach_answers', JSON.stringify(newSaved))
  }, [coach, savedAnswers])

  const handleCategorySelect = useCallback((category: string) => {
    const cat = QUESTION_CATEGORIES.find(c => c.id === category)
    if (cat) {
      const questions: Record<string, string[]> = {
        self: ['请做一下自我介绍', '介绍一下你自己', '说说你的个人情况'],
        project: ['介绍一个你做过的项目', '你最有成就感的项目是什么', '说说你的项目经验'],
        skill: ['你掌握哪些技术栈', '你的核心技能是什么', '你最擅长的技术是什么'],
        security: ['你对Web安全有哪些了解', '谈谈你对渗透测试的理解', '说说常见的安全漏洞'],
        behavior: ['你遇到过最大的挑战是什么', '如何处理团队冲突', '说说你的一次失败经历'],
        career: ['你的职业规划是什么', '为什么选择我们公司', '未来三年的目标'],
      }
      const randomQuestion = questions[category]?.[Math.floor(Math.random() * (questions[category]?.length || 1))]
      if (randomQuestion) {
        coach.setSession(s => ({ ...s, input: randomQuestion }))
      }
    }
  }, [coach])

  return (
    <section id="interview-coach" className="relative h-[calc(100vh-4rem)] flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #34D399, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)' }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-6xl w-full mx-auto px-4 sm:px-6 py-3 overflow-hidden">
        {/* 顶部标题区（精简为单行） */}
        <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{ background: 'rgba(52,211,153,0.08)', color: '#34D399', border: '1px solid rgba(52,211,153,0.15)' }}>
              <Sparkles size={11} />
              AI安全面试助手
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #34D399 0%, #60A5FA 50%, #A78BFA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              应聘搭子
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <StyleSelector selectedStyle={selectedStyle} onSelect={setSelectedStyle} compact />
            <button
              onClick={() => setShowTemplate(v => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all"
              style={{
                background: showTemplate ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
                border: '1px solid ' + (showTemplate ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.06)'),
                color: showTemplate ? '#A78BFA' : 'rgba(148,163,184,0.5)',
              }}
              title="答题模板"
            >
              <Lightbulb size={11} />
            </button>
            <ResumeUploaderCompact onUpload={handleResumeUpload} hasResume={resumeInfo.skills.length > 0 || resumeInfo.projects.length > 0} />
          </div>
        </div>

        {/* 可选：答题模板提示（可关闭） */}
        {showTemplate && (
          <div className="mb-2 p-2.5 rounded-lg text-[11px] text-white/60 leading-relaxed shrink-0"
            style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.12)' }}>
            <span className="text-purple-300/90 font-medium">1分钟答题模板：</span>
            <span className="text-cyan-400">先给结论</span>（1-2句直接亮观点） →
            <span className="text-purple-400"> 再解释观点</span>（结合简历中的项目/数据） →
            <span className="text-pink-400"> 总结收获</span>
          </div>
        )}

        {/* 简历展开区（折叠显示） */}
        {resumeExpanded && resumeInfo.skills.length > 0 && (
          <div className="mb-2 p-2.5 rounded-lg shrink-0"
            style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-blue-300/70">
                <FileText size={10} />
                {resumeInfo.name && <span className="font-medium text-white/70">{resumeInfo.name}</span>}
                <span>· 已加载简历</span>
              </div>
              <button
                onClick={() => setResumeExpanded(false)}
                className="text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {resumeInfo.skills.slice(0, 6).map((skill, i) => (
                <span key={i}
                  className="px-2 py-0.5 rounded text-[10px] font-medium"
                  style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA' }}>
                  {skill}
                </span>
              ))}
              {resumeInfo.projects.length > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px]"
                  style={{ background: 'rgba(167,139,250,0.08)', color: '#A78BFA' }}>
                  {resumeInfo.projects.length}个项目
                </span>
              )}
            </div>
          </div>
        )}

        {/* 问题分类标签 */}
        <div className="shrink-0">
          <QuestionCategoryTags onSelect={handleCategorySelect} />
        </div>

        {/* 聊天面板（核心区域，占满剩余高度） */}
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden min-h-0"
          style={{
            background: 'linear-gradient(165deg, rgba(13,16,35,0.95) 0%, rgba(8,11,28,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 80px rgba(52,211,153,0.04)',
          }}>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-1 min-h-0"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(52,211,153,0.25) transparent' }}>
            {coach.session.messages.length === 0 && !coach.session.isLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(59,130,246,0.1))',
                    border: '1px solid rgba(52,211,153,0.2)',
                  }}>
                  <Lightbulb size={22} style={{ color: '#34D399' }} />
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/60">输入面试问题，获取参考回答</div>
                  <div className="text-[10px] text-white/30 mt-1">建议先上传简历以获得更精准的个性化回答</div>
                </div>
              </div>
            )}
            {coach.session.messages.map((msg) => (
              <MessageBubble
                key={msg.timestamp}
                msg={msg}
                onEdit={handleEdit}
                onSave={handleSave}
                onChange={handleEditChange}
              />
            ))}
            {coach.session.isLoading && (
              <div className="flex justify-start mb-3">
                <div className="max-w-[88%] rounded-2xl rounded-tl-md px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Lightbulb size={10} style={{ color: '#34D399' }} />
                    <span className="text-[10px] font-medium text-white/40">应聘搭子</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-white/50">
                    <Loader2 size={13} className="animate-spin" style={{ color: '#34D399' }} />
                    正在思考回答...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 */}
          <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={coach.session.input}
                  onChange={e => coach.setSession(s => ({ ...s, input: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend(coach.session.input)
                    }
                  }}
                  placeholder="输入面试问题，获取参考回答..."
                  disabled={coach.session.isLoading}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/15 outline-none transition-all duration-300 disabled:opacity-40 hover:border-white/[0.14] focus:border-[#34D399]/50 focus:bg-white/[0.05]"
                />
              </div>
              <button
                onClick={() => handleSend(coach.session.input)}
                disabled={coach.session.isLoading || !coach.session.input.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 cursor-pointer disabled:opacity-25 disabled:hover:translate-y-0 shadow-lg shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #059669, #10B981)',
                  boxShadow: '0 4px 20px rgba(52,211,153,0.4)',
                }}>
                <Send size={15} color="white" />
              </button>
              <button
                onClick={coach.reset}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-white/[0.05] cursor-pointer shrink-0"
                style={{ color: 'rgba(148,163,184,0.4)' }}>
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── 紧凑版简历上传按钮（顶部工具栏使用） ── */
function ResumeUploaderCompact({
  onUpload,
  hasResume,
}: {
  onUpload: (content: string) => void
  hasResume: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'docx' || ext === 'doc') {
      alert('暂不支持 .docx/.doc 格式，请将内容复制到 .txt 或 .md 文件后上传')
      return
    }
    if (!ext || !['txt', 'pdf', 'md'].includes(ext)) return

    if (ext === 'pdf') {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let text = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map((item: any) => item.str).join(' ') + '\n'
        }
        onUpload(text.slice(0, 10000))
      } catch (e) {
        console.error('PDF parse error:', e)
        alert('PDF 解析失败，请将内容复制到 .txt 文件后上传')
      }
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      onUpload(reader.result as string)
    }
    reader.readAsText(file)
  }

  return (
    <>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all"
        style={{
          background: hasResume ? 'rgba(52,211,153,0.12)' : 'rgba(59,130,246,0.08)',
          border: '1px solid ' + (hasResume ? 'rgba(52,211,153,0.25)' : 'rgba(59,130,246,0.18)'),
          color: hasResume ? '#34D399' : '#60A5FA',
        }}
        title={hasResume ? '简历已加载，点击重新上传' : '上传简历（.txt .pdf .md）'}
      >
        <FileText size={11} />
        {hasResume ? '已加载' : '上传简历'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.pdf,.md"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />
    </>
  )
}