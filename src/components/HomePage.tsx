import { HeroSection, HeroNewsTicker } from './HeroSection'
import HacktivityHeatmap from './HacktivityHeatmap'
import { useEffect } from 'react'

/* ═══════════════════════════════════════════════════════════════
   AIShield Lab — HomePage v5
   精简版：跑马灯 + Hero + Footer
   ═══════════════════════════════════════════════════════════════ */

/* ── Footer — 极简版 ── */
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
          © 2026 AIShield Lab · AI Agent 安全实战平台
        </div>
      </div>
    </footer>
  )
}

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
      {/* 跑马灯 */}
      <HeroNewsTicker />

      {/* 首屏 */}
      <HeroSection />

      {/* Hacktivity */}
      <HacktivityHeatmap />

      {/* Footer */}
      <Footer />
    </div>
  )
}
