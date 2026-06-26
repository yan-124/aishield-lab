import { motion } from 'framer-motion'
import { ExternalLink, Star, GitFork, Code, BookOpen, Zap } from 'lucide-react'

const repos = [
  {
    name: 'PromptBreach-AI',
    desc: 'AI Prompt 注入实战靶场，10关从入门到高级，支持真实 LLM 对抗',
    url: 'https://github.com/aiseclearn/promptbreach-ai',
    stars: '1.2k',
    forks: '186',
    lang: 'Python',
    langColor: '#3572A5',
  },
  {
    name: 'AI-RedTeam-Toolkit',
    desc: 'AI 红队自动化测试框架，覆盖 Prompt Injection / Jailbreak / Data Leakage',
    url: 'https://github.com/aiseclearn/ai-redteam-toolkit',
    stars: '890',
    forks: '124',
    lang: 'TypeScript',
    langColor: '#3178C6',
  },
  {
    name: 'LLM-Security-Guide',
    desc: '大模型安全攻防手册，OWASP LLM Top 10 中文解读 + 防御方案',
    url: 'https://github.com/aiseclearn/llm-security-guide',
    stars: '2.1k',
    forks: '302',
    lang: 'Markdown',
    langColor: '#083FA1',
  },
]

const resources = [
  { icon: BookOpen, label: 'AI安全入门教程', url: '#', color: '#60A5FA' },
  { icon: Zap, label: 'Prompt注入速查表', url: '#', color: '#34D399' },
  { icon: Code, label: 'API安全测试模板', url: '#', color: '#A78BFA' },
]

export const GitHubResources = () => (
  <div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {repos.map((repo, i) => (
        <motion.a key={repo.name} href={repo.url} target="_blank" rel="noopener noreferrer"
          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}
          className="group block p-5 rounded-2xl transition-all"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 16 16" width="18" height="18" fill="rgba(255,255,255,0.5)">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{repo.name}</span>
            </div>
            <ExternalLink size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>{repo.desc}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: repo.langColor }} />
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{repo.lang}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={11} style={{ color: 'rgba(255,255,255,0.25)' }} />
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{repo.stars}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork size={11} style={{ color: 'rgba(255,255,255,0.25)' }} />
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{repo.forks}</span>
            </div>
          </div>
        </motion.a>
      ))}
    </div>

    {/* Quick links */}
    <div className="flex flex-wrap gap-3 justify-center">
      {resources.map(r => {
        const Icon = r.icon
        return (
          <a key={r.label} href={r.url} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: r.color }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
            <Icon size={13} /> {r.label}
          </a>
        )
      })}
    </div>
  </div>
)
