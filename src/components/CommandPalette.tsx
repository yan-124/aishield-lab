import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppContext } from '../context/AppContext'
import type { ViewMode } from '../types'
import {
  Home, BookOpen, Play, Target, GraduationCap, Compass,
  MessageCircle, Building2, Newspaper, Sun, Moon,
  Search, ArrowRight, Command, User, Trophy,
  CreditCard, Settings, Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CommandItem {
  id: string
  label: string
  shortcut?: string
  icon: React.ElementType
  category: 'navigation' | 'action' | 'theme'
  action: () => void
  keywords: string[]
}

export const CommandPalette = () => {
  const { state, dispatch } = useAppContext()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const nav = (key: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: key })
    setOpen(false)
    setQuery('')
  }

  const commands: CommandItem[] = [
    { id: 'home', label: '首页', icon: Home, category: 'navigation', action: () => nav('home'), keywords: ['home', 'shouye', '首页'] },
    { id: 'knowledge', label: '知识库', icon: BookOpen, category: 'navigation', action: () => nav('knowledge'), keywords: ['knowledge', 'zhishiku', '知识'] },
    { id: 'videos', label: '视频教程', icon: Play, category: 'navigation', action: () => nav('videos'), keywords: ['video', 'shipin', '视频'] },
    { id: 'range', label: 'Agent靶场', icon: Target, category: 'navigation', action: () => nav('range'), keywords: ['range', 'bchang', '靶场', 'arena'] },
    { id: 'interview', label: '面试练习', icon: GraduationCap, category: 'navigation', action: () => nav('interview'), keywords: ['interview', 'mianshi', '面试'] },
    { id: 'career', label: '职业评估', icon: Compass, category: 'navigation', action: () => nav('career-guide'), keywords: ['career', 'zhiye', '职业'] },
    { id: 'community', label: '社区', icon: MessageCircle, category: 'navigation', action: () => nav('community'), keywords: ['community', 'shequ', '社区'] },
    { id: 'enterprise', label: '企业版', icon: Building2, category: 'navigation', action: () => nav('enterprise'), keywords: ['enterprise', 'qiye', '企业'] },
    { id: 'news', label: '新闻资讯', icon: Newspaper, category: 'navigation', action: () => nav('news'), keywords: ['news', 'xinwen', '新闻'] },
    { id: 'leaderboard', label: '排行榜', icon: Trophy, category: 'navigation', action: () => nav('leaderboard'), keywords: ['leaderboard', 'paihang', '排行'] },
    { id: 'pricing', label: '价格方案', icon: CreditCard, category: 'navigation', action: () => nav('pricing'), keywords: ['pricing', 'jiage', '价格'] },
    { id: 'settings', label: '设置', icon: Settings, category: 'navigation', action: () => nav('settings'), keywords: ['settings', 'shezhi', '设置'] },
    { id: 'profile', label: '个人中心', icon: User, category: 'navigation', action: () => nav('user-profile'), keywords: ['profile', 'geren', '个人'] },
    { id: 'theme', label: state.theme === 'dark' ? '切换浅色主题' : '切换深色主题', icon: state.theme === 'dark' ? Sun : Moon, category: 'theme', action: () => { dispatch({ type: 'TOGGLE_THEME' }); setOpen(false); setQuery('') }, keywords: ['theme', 'zhuti', '主题', 'light', 'dark', '浅色', '深色'] },
  ]

  const filtered = query.trim()
    ? commands.filter(c => {
        const q = query.toLowerCase()
        return c.label.toLowerCase().includes(q) || c.keywords.some(k => k.toLowerCase().includes(q))
      })
    : commands

  // Reset active index when filtered list changes
  useEffect(() => { setActiveIndex(0) }, [query])

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
        if (!open) { setQuery('') }
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
        setQuery('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // Auto-focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault()
      filtered[activeIndex].action()
    }
  }, [filtered, activeIndex])

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]')
      activeEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  // Group by category
  const navItems = filtered.filter(c => c.category === 'navigation')
  const actionItems = filtered.filter(c => c.category === 'theme')

  const renderGroup = (title: string, items: CommandItem[]) => {
    if (items.length === 0) return null
    return (
      <div>
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'rgba(148,163,184,0.5)' }}>
          {title}
        </div>
        {items.map((item) => {
          const globalIdx = filtered.indexOf(item)
          const isActive = globalIdx === activeIndex
          const Icon = item.icon
          return (
            <div
              key={item.id}
              data-active={isActive}
              className="flex items-center gap-3 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors duration-100"
              style={{
                background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
                color: isActive ? '#C4B5FD' : 'var(--color-text-secondary)',
              }}
              onMouseEnter={() => setActiveIndex(globalIdx)}
              onClick={item.action}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? '#A78BFA' : 'var(--color-text-tertiary)' }} />
              <span className="flex-1 text-sm font-medium" style={{ color: isActive ? '#E2E8F0' : 'var(--color-text-primary)' }}>
                {item.label}
              </span>
              {item.id === 'range' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                  background: 'rgba(139,92,246,0.15)', color: '#A78BFA',
                }}>Ctrl+K</span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[500]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => { setOpen(false); setQuery('') }}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed z-[501] left-1/2 top-[18%] -translate-x-1/2 w-[560px] max-w-[92vw] rounded-xl overflow-hidden"
            style={{
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border-primary)',
              boxShadow: '0 25px 65px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.08)',
            }}
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b" style={{ borderColor: 'var(--color-border-secondary)' }}>
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入命令或搜索..."
                className="flex-1 py-4 bg-transparent text-sm outline-none"
                style={{ color: 'var(--color-text-primary)' }}
              />
              <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                <kbd className="px-1.5 py-0.5 rounded" style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border-secondary)',
                }}>ESC</kbd>
              </div>
            </div>

            {/* Command list */}
            <div ref={listRef} className="max-h-[340px] overflow-y-auto py-2" style={{
              scrollbarWidth: 'thin',
            }}>
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  <Sparkles className="w-5 h-5 mx-auto mb-2 opacity-40" />
                  未找到匹配的命令
                </div>
              ) : (
                <>
                  {renderGroup('导航', navItems)}
                  {actionItems.length > 0 && (
                    <>
                      <div className="my-1 mx-3" style={{ height: 1, background: 'var(--color-border-tertiary)' }} />
                      {renderGroup('操作', actionItems)}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between px-4 py-2 border-t text-[10px]" style={{
              borderColor: 'var(--color-border-secondary)',
              color: 'var(--color-text-tertiary)',
            }}>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-secondary)' }}>↑↓</kbd>
                  导航
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-secondary)' }}>↵</kbd>
                  执行
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Command className="w-3 h-3" />K 呼出面板
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
