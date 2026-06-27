import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, RotateCcw, User, Lightbulb, Loader2, FileText, Upload, Sparkles, ChevronDown, Check, Copy, RefreshCw } from 'lucide-react'
import { useToast } from './Toast'
import { getAuthToken } from '../services/authFetch'
import { useRequireAuth } from '../hooks/useRequireAuth'

/* ═══════════════════════════════════════════════════════════════
   AIShield Lab — 应聘搭子 v2
   面试真题参考回答助手：用户输入一个真实面试题，结合简历给出回答
   ═══════════════════════════════════════════════════════════════ */

const PROXY_URL = '/api/dashscope/chat'
const MODEL = 'qwen-max'

/* ═══════════════════════════════════════════════════════════════
   System Prompt — 面试搭子行为约束（类似 CLAUDE.md）
   ═══════════════════════════════════════════════════════════════ */
const INTERVIEW_COACH_SYSTEM_PROMPT = `你是 AIShield Lab 面试问答助手。用户会提出一个真实的面试问题，你需要结合用户上传的简历信息，以求职者第一人称口吻，生成一段高质量的面试参考回答。

## AI安全面试知识库

你精通以下领域，回答时自然融入相关知识，不要生硬罗列：
- Prompt注入、越狱攻击、防御策略（输入过滤、指令层级、输出检测）
- 大模型安全：幻觉、偏见、毒性、数据泄露、对抗样本
- 内容安全：文本/图片/视频审核，多模态安全
- 数据安全：训练数据投毒、成员推断、模型逆向
- 安全对齐：RLHF、DPO、Constitutional AI、红队测试
- 安全法规：生成式AI服务管理办法、算法备案、深度合成管理规定
- Web安全基础：XSS、CSRF、SQL注入、SSRF（AI安全岗常考）
- 渗透测试与漏洞挖掘方法论
- 安全运营：SIEM、SOAR、威胁情报、应急响应

面试注意事项：
- 技术题先讲原理再讲实践，别只背概念
- 项目题用STAR法则，突出你在安全场景中的具体贡献
- 遇到不会的题，诚实说"这块我了解不深，但我的理解是..."，不要硬编
- 涉及合规的问题，提到具体法规名称会加分
- 安全岗面试官看重攻防思维和风险评估能力，回答要体现这个视角

## 输出格式（必须严格遵守）

1. 直接输出回答正文，第一句话就是回答内容本身
2. 不加任何标题、角色说明、"好的"、"当然"等前缀
3. 只用纯文本和换行，不使用任何 Markdown 语法（不用 **、##、- 等）
4. 不输出 JSON、代码块、表格等结构化内容
5. 不以"作为AI"、"作为模型"等身份开头
6. 不以"以上是我的回答"、"希望对你有帮助"等话结尾
7. 回答结束即停止，不添加任何补充说明或元信息

## 说话方式（必须严格遵守）

1. 口语化：像跟面试官面对面聊天，不是念稿子。用"其实"、"说白了"、"当时我们"、"简单来说"这种自然口语
2. 言简意赅：不说废话，不绕弯子，一句能说清的不用两句。该详细的地方详细，能省的全省
3. 不要有AI味儿：
   - 禁止"首先...其次...最后..."这种机械分点
   - 禁止"综上所述"、"总而言之"、"值得注意的是"等书面套话
   - 禁止每段长度均匀、结构高度对称的模板感
   - 禁止空洞的正确废话（如"安全是一个持续的过程"、"需要多方共同努力"）
   - 允许口语化的过渡词（"然后"、"另外"、"对了"），允许不完美的句子结构
   - 允许用短句、断句、反问，像真人说话有节奏感
4. 有温度有态度：遇到有争议的问题敢表达观点，别什么都是"各有优劣"

## 回答质量

1. 第一句话直接亮明观点或结论
2. 紧扣简历中的真实项目、技能和经历展开，不编造数据
3. 如果用户没有上传简历，直接说："建议先上传你的简历，我能结合你的真实经历给出更贴合的回答。"然后给出一个通用的回答框架
4. 如果简历中缺少直接相关经历，基于 AI 安全领域知识给出通用回答

## 风格约束

{stylePrompt}`

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
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
    prompt: '总字数严格控制在150字以内（不超过180字）。第一句直接给结论，后续1-2个要点，每个≤30字。不要分点列表，不要展开，不要寒暄。',
  },
  {
    id: 'detailed',
    label: '详细完整',
    description: '2-3分钟完整论述',
    prompt: '总字数控制在400-550字之间。先用1-2句给出核心结论，然后分3个要点展开，每个要点80-150字，必须结合简历中的具体项目或数据佐证。',
  },
  {
    id: 'story',
    label: '故事叙述',
    description: '项目案例驱动',
    prompt: '总字数控制在300-450字之间。用STAR法则叙述：先说情境和任务（80字内），再讲行动和结果（200字内），最后总结收获。语言口语化、有真实感。',
  },
  {
    id: 'technical',
    label: '技术深度',
    description: '原理与实现细节',
    prompt: '总字数控制在350-500字之间。先点明技术原理或核心概念（80字内），再分2-3个层次说明实现细节（每层100字左右），最后给出技术选型或最佳实践。',
  },
]

const HOT_QUESTIONS = [
  '介绍一下你自己',
  '说说你最有成就感的一个项目',
  '你掌握哪些技术栈？',
  '谈谈你对 Prompt 注入的理解',
  '你遇到过最大的挑战是什么？',
  '为什么选择 AI 安全方向？',
  '你如何快速学习一项新技术？',
  '讲讲你做过的一次安全测试',
]

/* ── 本地兜底回答生成（API 异常时使用） ── */
function generateFallbackAnswer(question: string, resumeContext: string): string {
  if (!resumeContext.trim()) {
    return `建议先上传你的简历，我能结合你的真实经历给出更贴合的回答。\n\n上传方法：点击右上角「上传简历」按钮，支持 .txt / .pdf / .md 格式。\n\n如果你暂时不想上传，这里有一个通用回答框架：针对「${question}」，先用一句话给出核心观点，再用 1-2 个具体经历佐证，最后收尾关联到目标岗位。`
  }
  return `抱歉，AI 服务暂时不可用，请稍后重试。\n\n你的问题：「${question}」\n\n建议的回答思路：先用一句话亮明观点，再结合简历中的项目或技能展开，最后收尾。`
}

/* ── Chat Hook（DashScope / qwen-max，标准 OpenAI 兼容接口） ── */
function useChat() {
  const [session, setSession] = useState<ChatSession>({
    messages: [],
    conversationId: null,
    isLoading: false,
    input: '',
  })

  const sendMessage = async (text: string, resumeContext: string = '', stylePrompt: string = ''): Promise<void> => {
    if (!text.trim() || session.isLoading) return

    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: Date.now() }
    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      input: '',
      isLoading: true,
    }))

    try {
      const token = getAuthToken()
      if (!token) {
        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, { role: 'assistant', content: '请先登录后使用面试搭子功能。', timestamp: Date.now() }],
          isLoading: false,
        }))
        return
      }

      const systemPrompt = INTERVIEW_COACH_SYSTEM_PROMPT.replace(
        '{stylePrompt}',
        stylePrompt || '总字数控制在300-500字之间。先用1-2句给出核心结论，然后分3个要点展开。'
      )

      const userContent = [
        resumeContext ? `【候选人简历】\n${resumeContext}` : '【候选人简历】未上传。',
        '',
        '【面试问题】',
        text.trim(),
      ].join('\n')

      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          max_tokens: 1500,
          temperature: 0.8,
        }),
      })

      if (response.status === 401) {
        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, { role: 'assistant', content: '登录已过期，请重新登录后使用。', timestamp: Date.now() }],
          isLoading: false,
        }))
        return
      }

      if (!response.ok) {
        throw new Error('HTTP ' + response.status)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      if (content.trim()) {
        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, { role: 'assistant', content: content.trim(), timestamp: Date.now() }],
          isLoading: false,
        }))
      } else {
        const fallback = generateFallbackAnswer(text, resumeContext)
        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, { role: 'assistant', content: fallback, timestamp: Date.now() }],
          isLoading: false,
        }))
      }
    } catch (err: unknown) {
      console.error('Chat error:', err)
      const fallback = generateFallbackAnswer(text, resumeContext)
      setSession(prev => ({
        ...prev,
        messages: [...prev.messages, { role: 'assistant', content: fallback, timestamp: Date.now() }],
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

  const nameMatch = content.match(/姓[\u4e00-\u9fa5]{1,2}名[\u4e00-\u9fa5]{1,2}|[\u4e00-\u9fa5]{2,4}\s*(?:先生|女士)?/)
  if (nameMatch) {
    info.name = nameMatch[0].replace(/(姓|名|先生|女士)/g, '').trim()
  }

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

  const projectKeywords = ['项目', '作品', '实践', '开发']
  for (const line of lines) {
    const trimmed = line.trim()
    if (projectKeywords.some(k => trimmed.includes(k)) && trimmed.length < 150) {
      info.projects.push(trimmed)
    }
  }
  info.projects = [...new Set(info.projects)].slice(0, 5)

  const expKeywords = ['工作', '实习', '经历', '任职', '负责']
  for (const line of lines) {
    const trimmed = line.trim()
    if (expKeywords.some(k => trimmed.includes(k)) && trimmed.length < 200) {
      info.experiences.push(trimmed)
    }
  }
  info.experiences = [...new Set(info.experiences)].slice(0, 5)

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

/* ── 简历上传组件 ── */
export function ResumeUploader({
  onUpload,
  resumeInfo,
}: {
  onUpload: (content: string) => void
  resumeInfo: ResumeInfo
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const { showToast } = useToast()

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'docx' || ext === 'doc') {
      showToast('暂不支持 .docx/.doc 格式，请将内容复制到 .txt 或 .md 文件后上传', 'warning')
      return
    }
    if (!ext || !['txt', 'pdf', 'md'].includes(ext)) return

    if (ext === 'pdf') {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let text = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map((item: any) => item.str).join(' ') + '\n'
        }
        if (!text.trim()) {
          showToast('该 PDF 似乎无法提取文字（可能是扫描件/图片），请尝试复制文字内容到 .txt 文件后上传', 'warning')
          return
        }
        onUpload(text.slice(0, 10000))
        showToast(`简历已解析（${pdf.numPages}页）`, 'success')
      } catch (e: any) {
        console.error('PDF parse error:', e)
        const msg = e?.message || String(e)
        if (msg.includes('Missing') || msg.includes('worker')) {
          showToast('PDF 解析组件加载失败，请改用 .txt 格式上传', 'error')
        } else {
          showToast('PDF 解析失败，建议复制内容到 .txt 文件后上传', 'error')
        }
      }
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      onUpload((reader.result as string).slice(0, 10000))
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
export function StyleSelector({
  selectedStyle,
  onSelect,
}: {
  selectedStyle: AnswerStyle
  onSelect: (style: AnswerStyle) => void
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

/* ── 热门面试真题 ── */
function HotQuestions({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="mb-2">
      <div className="text-[10px] text-white/25 mb-1.5 flex items-center gap-1">
        <Lightbulb size={9} />
        热门面试真题
      </div>
      <div className="flex flex-wrap gap-1.5">
        {HOT_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="px-2.5 py-1 rounded-md text-[11px] cursor-pointer transition-all hover:bg-white/[0.05]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(148,163,184,0.7)',
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── 消息气泡 ── */
function MessageBubble({
  msg,
  onCopy,
  onRegenerate,
}: {
  msg: Message
  onCopy: (text: string) => void
  onRegenerate: () => void
}) {
  const isUser = msg.role === 'user'
  const isAssistant = msg.role === 'assistant'

  // 找到当前回答对应的用户问题（往前找最近的 user）
  // 这里由父组件提供，为简化逻辑不在这里处理

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
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
        <div className="flex items-center justify-between mb-1.5 px-4 pt-3">
          <div className="flex items-center gap-1.5">
            {isUser ? (
              <>
                <span className="text-[10px] font-medium text-blue-400">你</span>
                <User size={10} style={{ color: '#60A5FA' }} />
              </>
            ) : (
              <>
                <Lightbulb size={10} style={{ color: '#34D399' }} />
                <span className="text-[10px] font-medium text-white/40">参考回答</span>
              </>
            )}
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="text-[13px] leading-[1.7] whitespace-pre-wrap"
            style={{ color: isUser ? 'rgba(255,255,255,0.88)' : 'rgba(203,213,225,0.78)' }}>
            {msg.content || (
              <span className="inline-flex items-center gap-1.5 opacity-50">
                <Loader2 size={12} className="animate-spin" /> 思考中...
              </span>
            )}
          </div>
        </div>

        {isAssistant && msg.content && (
          <div className="px-4 pb-2 flex items-center gap-2">
            <button
              onClick={() => onCopy(msg.content)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <Copy size={9} />
              复制
            </button>
            <button
                onClick={() => {
                  onRegenerate()
                }}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <RefreshCw size={9} />
              重新生成
            </button>
          </div>
        )}
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
  const [showTemplate, setShowTemplate] = useState(false)

  const coach = useChat()
  const { checkAuth } = useRequireAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  useEffect(() => {
    const el = messagesEndRef.current
    if (!el) return
    const parent = el.parentElement
    if (parent) {
      parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' })
    }
  }, [coach.session.messages.length, coach.session.isLoading])

  const handleResumeUpload = useCallback((content: string) => {
    setResumeContent(content)
    if (content) {
      setResumeInfo(parseResume(content))
      showToast('简历已解析，回答会结合你的经历', 'success')
    } else {
      setResumeInfo({ name: '', skills: [], projects: [], experiences: [], education: [] })
      showToast('已清除简历', 'info')
    }
  }, [showToast])

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
    if (!text.trim()) return
    if (!checkAuth()) return
    const resumeContext = buildResumeContext()
    coach.sendMessage(text, resumeContext, selectedStyle.prompt)
  }, [coach, buildResumeContext, selectedStyle.prompt, checkAuth])

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('已复制到剪贴板', 'success')
    }).catch(() => {
      showToast('复制失败', 'error')
    })
  }, [showToast])

  const handleRegenerate = useCallback(() => {
    if (!checkAuth()) return
    const msgs = coach.session.messages
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        coach.setSession(prev => ({
          ...prev,
          messages: msgs.slice(0, i + 1),
          isLoading: true,
        }))
        const resumeContext = buildResumeContext()
        coach.sendMessage(msgs[i].content, resumeContext, selectedStyle.prompt)
        return
      }
    }
  }, [coach, buildResumeContext, selectedStyle.prompt, checkAuth])

  const hasResume = resumeInfo.skills.length > 0 || resumeInfo.projects.length > 0

  return (
    <section id="interview-coach" className="relative h-[calc(100vh-4rem)] flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #34D399, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)' }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 sm:px-6 py-3 overflow-hidden">
        {/* 顶部标题区 */}
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
            <StyleSelector selectedStyle={selectedStyle} onSelect={setSelectedStyle} />
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
            <ResumeUploaderCompact onUpload={handleResumeUpload} hasResume={hasResume} />
          </div>
        </div>

        {/* 答题模板提示 */}
        {showTemplate && (
          <div className="mb-2 p-2.5 rounded-lg text-[11px] text-white/60 leading-relaxed shrink-0"
            style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.12)' }}>
            <span className="text-purple-300/90 font-medium">1分钟答题模板：</span>
            <span className="text-cyan-400">先给结论</span>（1-2句直接亮观点） →
            <span className="text-purple-400"> 再解释观点</span>（结合简历中的项目/数据） →
            <span className="text-pink-400"> 总结收获</span>
          </div>
        )}

        {/* 简历展开条 */}
        {hasResume && (
          <div className="mb-2 p-2.5 rounded-lg shrink-0"
            style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-300/70">
              <FileText size={10} />
              {resumeInfo.name && <span className="font-medium text-white/70">{resumeInfo.name}</span>}
              <span>· 已结合简历</span>
              <span className="text-white/30">（{resumeInfo.skills.slice(0, 4).join(' · ')}）</span>
            </div>
          </div>
        )}

        {/* 聊天面板 */}
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
              <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(59,130,246,0.08))',
                    border: '1px solid rgba(52,211,153,0.2)',
                  }}>
                  <FileText size={24} style={{ color: '#34D399' }} />
                </div>
                <div className="text-center max-w-sm">
                  <div className="text-sm text-white/70 font-medium mb-1">输入面试真题，获取参考回答</div>
                  <div className="text-xs text-white/35 leading-relaxed">
                    上传你的简历后，我会结合你的真实经历生成个性化回答，比通用模板更有说服力
                  </div>
                </div>
                <button
                  onClick={() => {
                    const btn = document.querySelector('[title*="上传简历"]') as HTMLElement
                    btn?.click()
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all hover:opacity-80"
                  style={{
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px dashed rgba(59,130,246,0.3)',
                    color: '#60A5FA',
                  }}>
                  <Upload size={13} />
                  上传简历开始使用
                </button>
              </div>
            )}
            {coach.session.messages.map((msg, idx) => (
              <MessageBubble
                key={msg.timestamp + idx}
                msg={msg}
                onCopy={handleCopy}
                onRegenerate={handleRegenerate}
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
                    正在结合简历生成回答...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区 */}
          <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <HotQuestions onSelect={(q) => coach.setSession(s => ({ ...s, input: q }))} />
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
                  placeholder="输入面试真题，获取参考回答..."
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

/* ── 紧凑版简历上传按钮 ── */
function ResumeUploaderCompact({
  onUpload,
  hasResume,
}: {
  onUpload: (content: string) => void
  hasResume: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'docx' || ext === 'doc') {
      showToast('暂不支持 .docx/.doc 格式，请将内容复制到 .txt 或 .md 文件后上传', 'warning')
      return
    }
    if (!ext || !['txt', 'pdf', 'md'].includes(ext)) return

    if (ext === 'pdf') {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let text = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map((item: any) => item.str).join(' ') + '\n'
        }
        if (!text.trim()) {
          showToast('该 PDF 似乎无法提取文字（可能是扫描件/图片），请尝试复制文字内容到 .txt 文件后上传', 'warning')
          return
        }
        onUpload(text.slice(0, 10000))
        showToast(`简历已解析（${pdf.numPages}页）`, 'success')
      } catch (e: any) {
        console.error('PDF parse error:', e)
        const msg = e?.message || String(e)
        if (msg.includes('Missing') || msg.includes('worker')) {
          showToast('PDF 解析组件加载失败，请改用 .txt 格式上传', 'error')
        } else {
          showToast('PDF 解析失败，建议复制内容到 .txt 文件后上传', 'error')
        }
      }
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      onUpload((reader.result as string).slice(0, 10000))
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
