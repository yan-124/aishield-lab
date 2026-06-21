import { HeroSection, HeroNewsTicker } from './HeroSection'
import { InterviewArena } from './InterviewArena'
import { KnowledgeBase } from './KnowledgeBase'
import { VideoSection } from './VideoSection'
import { CommunityFeed } from './CommunityFeed'
import { NewsFeed } from './NewsFeed'
import { Shield, Bot, Code, Globe, BookOpen, Zap, Users, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect } from 'react'


/* ═══════════════════════════════════════════════════════════════
   AIShield Lab — HomePage v4
   Unified section headers + framer-motion cards + rich Footer
   ═══════════════════════════════════════════════════════════════ */

const sectionClass = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
const sectionSpacing = "py-10 sm:py-12 md:py-16 lg:py-24"

/* ── Unified section header ── */
function SectionHeader({
  badgeColor,
  badgeBg,
  badgeBorder,
  badgeIcon,
  badgeText,
  title,
  subtitle,
}: {
  badgeColor: string
  badgeBg: string
  badgeBorder: string
  badgeIcon: React.ReactNode
  badgeText: string
  title: string
  subtitle: string
}) {
  return (
    <motion.div
      className="section-header mb-12 lg:mb-16"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {/* Brand badge */}
          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium mb-3 sm:mb-4"
            style={{ background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}` }}>
            {badgeIcon}
            <span>{badgeText}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white/90 mb-3"
            style={{ background: 'linear-gradient(135deg, #F1F5F9 0%, #94A3B8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {title}
          </h2>
          <p className="text-sm" style={{ color: 'rgba(203,213,225,0.4)' }}>{subtitle}</p>
        </div>
      </div>
    </motion.div>
  )
}



/* ── Footer — 极简新人指南版 ── */
function Footer() {
  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #060B14 0%, #080D18 100%)',
        borderTop: '1px solid rgba(139,92,246,0.06)',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{
        background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.25), transparent)',
      }} />

      <div className="relative max-w-4xl mx-auto px-6 py-6">
        <div className="text-center text-[11px] text-white/20">
          © 2026 AIShield Lab · 知之学长
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════════════ */

export const HomePage = () => {
  // 禁用浏览器滚动恢复 + 首次加载强制置顶
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-root)' }}>
      {/* 0. 跑马灯（导航栏下方独立细长条） */}
      <HeroNewsTicker />

      {/* 1. 首屏：品牌 + 功能卡 */}
      <HeroSection />

      {/* 2. 面试训练场 */}
      <InterviewArena />

      {/* 3. 知识库（学什么）*/}
      <section id="knowledge-base" className={`${sectionClass} ${sectionSpacing}`}>
        <SectionHeader
          badgeColor="#38BDF8"
          badgeBg="rgba(56,189,248,0.08)"
          badgeBorder="rgba(56,189,248,0.12)"
          badgeIcon={<BookOpen size={12} />}
          badgeText="知识体系"
          title="核心知识库"
          subtitle="系统化的 AI 安全知识体系，从入门到实战"
        />
        <KnowledgeBase compact />
      </section>

      {/* 4. 视频教程（怎么练）*/}
      <section className={`${sectionClass} ${sectionSpacing}`}>
        <SectionHeader
          badgeColor="#34D399"
          badgeBg="rgba(52,211,153,0.08)"
          badgeBorder="rgba(52,211,153,0.12)"
          badgeIcon={<Zap size={12} />}
          badgeText="视频教程"
          title="实战演练"
          subtitle="跟随视频教程，掌握 AI 安全实战技能"
        />
        <VideoSection compact />
      </section>

      {/* 5. 社区（和谁一起）*/}
      <section className={`${sectionClass} ${sectionSpacing}`}>
        <SectionHeader
          badgeColor="#A78BFA"
          badgeBg="rgba(167,139,250,0.08)"
          badgeBorder="rgba(167,139,250,0.12)"
          badgeIcon={<Users size={12} />}
          badgeText="社区"
          title="学习者社区"
          subtitle="与同行交流，共同成长进步"
        />
        <CommunityFeed compact />
      </section>

      {/* 6. AI安全快讯（行业动态）*/}
      <section className={`${sectionClass} ${sectionSpacing}`}>
        <SectionHeader
          badgeColor="#FBBF24"
          badgeBg="rgba(251,191,36,0.08)"
          badgeBorder="rgba(251,191,36,0.12)"
          badgeIcon={<Globe size={12} />}
          badgeText="实时更新"
          title="AI 安全快讯"
          subtitle="追踪 AI 安全领域最新动态，重要消息不错过"
        />
        <NewsFeed compact />
      </section>

      {/* 7. Footer */}
      <Footer />
    </div>
  )
}
