import { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../context/AppContext'
import { articles as KNOWLEDGE_ARTICLES } from '../data/knowledge'
import type { ViewMode } from '../types'
import {
  Home, BookOpen, Play, Target, MessageCircle,
  Search, Bell, ChevronDown, LogOut, User, Settings, Bot,
  Building2, GraduationCap, Compass, BarChart3 } from 'lucide-react'

const navItems = [
  { key: 'home', label: '首页', icon: Home },
  { key: 'knowledge', label: '知识库', icon: BookOpen },
  { key: 'videos', label: '视频', icon: Play },
  { key: 'range', label: 'Agent靶场', icon: Target },
  { key: 'interview', label: '面试', icon: GraduationCap },
  { key: 'career-guide', label: '职业诊断', icon: Compass },
  { key: 'community', label: '社区', icon: MessageCircle },
  { key: 'enterprise', label: '企业版', icon: Building2 }
] as const

const mobileNavItems = [
  ...navItems.slice(0, 4),
  { key: 'interview', label: '面试', icon: GraduationCap },
  { key: 'career-guide', label: '职业诊断', icon: Compass },
  { key: 'shieldy', label: 'Shieldy', icon: Bot, isShieldy: true as const },
  { key: 'enterprise', label: '企业版', icon: Building2 },
]

export const Navigation = () => {
  const { state, dispatch } = useAppContext()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [showConsult, setShowConsult] = useState(false)
  const [hasNotification] = useState(true)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) setShowNotifications(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus()
  }, [showSearch])

  // 全局事件：允许外部组件触发咨询弹窗
  useEffect(() => {
    const handler = () => setShowConsult(true)
    window.addEventListener('open-consult-modal', handler)
    return () => window.removeEventListener('open-consult-modal', handler)
  }, [])

  const searchResults = searchQuery.trim()
    ? KNOWLEDGE_ARTICLES.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : []

  const handleSearchSelect = (articleId: string) => {
    dispatch({ type: 'SET_CURRENT_ARTICLE', payload: articleId })
    dispatch({ type: 'SET_VIEW_MODE', payload: 'knowledge-detail' })
    setShowSearch(false)
    setSearchQuery('')
  }

  const iconBtnClass = "w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200"
  const iconBtnInactive = "bg-[#111833] text-[#64748B] hover:bg-[#172044] hover:text-[#94A3B8]"
  const iconBtnActive = "bg-[rgba(139,92,246,0.12)] text-[#A78BFA]"

  return (
    <>
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        borderColor: 'rgba(139,92,246,0.08)',
        background: 'rgba(6,11,20,0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* ─── Logo + Shieldy brand element ─── */}
        <div
          className="flex items-center gap-3 cursor-pointer group select-none"
          onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })}
        >
          {/* Logo — 金色金属线条盾牌 */}
          <div className="relative">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
              style={{
                background: 'transparent',
              }}
            >
              <svg width="20" height="22" viewBox="0 0 20 24" fill="none">
                <defs>
                  <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F5E6A3" />
                    <stop offset="35%" stopColor="#D4AF37" />
                    <stop offset="65%" stopColor="#B8962E" />
                    <stop offset="100%" stopColor="#F0D878" />
                  </linearGradient>
                  <linearGradient id="goldShine" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFF8DC" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#8B7020" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                {/* 盾牌外轮廓 — 金色金属线 */}
                <path d="M10 2L17.5 5.5V12C17.5 16 14 19.5 10 21C6 19.5 2.5 16 2.5 12V5.5L10 2Z"
                  fill="none" stroke="url(#goldLine)" strokeWidth="1.4" strokeLinejoin="round"/>
                {/* 内层盾 — 细金线 */}
                <path d="M10 4.5L14.5 6.8V11.5C14.5 14.2 12 17 10 18.2C8 17 5.5 14.2 5.5 11.5V6.8L10 4.5Z"
                  fill="none" stroke="url(#goldShine)" strokeWidth="0.75" strokeLinejoin="round" opacity="0.6"/>
                {/* 中心闪电 ⚡ — 金色填充 */}
                <path d="M10.5 7.5L8.2 12H10L9.5 16L12.5 11H11L11.5 7.5H10.5Z"
                  fill="url(#goldLine)" opacity="0.95"/>
              </svg>
            </div>
            {/* Online indicator */}
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#34D399] animate-pulse-glow border-[2px]" style={{ borderColor: '#0A1020' }} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wide text-[#A78BFA] transition-colors group-hover:text-[#C4B5FD]">
              AIShield Lab
            </span>
            <span className="text-[10px] tracking-[0.15em] text-[#475569] font-medium">
              AI SECURITY LAB
            </span>
          </div>
        </div>

        {/* ─── Desktop Nav ─── */}
        <div className="hidden md:flex items-center gap-0 flex-nowrap overflow-x-auto">
          {navItems.map(item => {
            const isActive = state.viewMode === item.key
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: item.key })}
                className="relative flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200"
                style={{
                  color: isActive ? '#A78BFA' : '#64748B',
                  background: isActive ? 'rgba(139,92,246,0.08)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#94A3B8'
                    e.currentTarget.style.background = 'rgba(139,92,246,0.04)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#64748B'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
                {item.label}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                    style={{ background: '#A78BFA', boxShadow: '0 0 8px rgba(139,92,246,0.5)' }} />
                )}
              </button>
            )
          })}
        </div>

        {/* ─── Right Actions ─── */}
        <div className="flex items-center gap-1.5">
          {/* Search with glow on focus */}
          <div className="relative">
            {showSearch ? (
              <div className="flex items-center gap-1.5 animate-scale">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    onKeyDown={e => {
                      if (e.key === 'Escape') { setShowSearch(false); setSearchQuery(''); }
                      if (e.key === 'Enter' && searchResults.length > 0) handleSearchSelect(searchResults[0].id)
                    }}
                    placeholder="搜索文章..."
                    className="w-36 max-w-[140px] sm:w-52 pl-9 pr-8 py-2 rounded-xl text-sm text-[#F1F5F9] outline-none transition-all"
                    style={{
                      background: '#111833',
                      border: searchFocused ? '1px solid rgba(139,92,246,0.45)' : '1px solid rgba(139,92,246,0.2)',
                      boxShadow: searchFocused ? '0 0 0 3px rgba(139,92,246,0.08), 0 0 16px rgba(139,92,246,0.15)' : 'none',
                    }}
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50 animate-scale shadow-lg"
                      style={{ background: '#0C1027', border: '1px solid rgba(139,92,246,0.12)' }}>
                      {searchResults.map(article => (
                        <button key={article.id}
                          onClick={() => handleSearchSelect(article.id)}
                          className="w-full px-4 py-2.5 text-left cursor-pointer transition-colors flex flex-col gap-1"
                          style={{ borderBottom: '1px solid rgba(148,163,184,0.04)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.06)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span className="text-sm text-[#F1F5F9] font-medium">{article.title}</span>
                          <span className="text-[11px] text-[#64748B]">
                            {article.tags.slice(0, 3).map(t => `#${t}`).join(' ')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#94A3B8] hover:bg-white/5 transition-colors cursor-pointer"
                  title="关闭搜索 (Esc)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ) : (
              <button onClick={() => setShowSearch(true)}
                className={`${iconBtnClass} ${iconBtnInactive}`} title="搜索 Ctrl+K">
                <Search size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button onClick={() => { setShowNotifications(!showNotifications); }}
              className={`${iconBtnClass} ${showNotifications ? iconBtnActive : iconBtnInactive} relative`} title="通知">
              <Bell size={16} strokeWidth={1.5} />
              {hasNotification && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] animate-pulse-glow" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute top-full right-0 mt-1.5 w-72 rounded-xl overflow-hidden z-50 animate-scale shadow-lg"
                style={{ background: '#0C1027', border: '1px solid rgba(139,92,246,0.12)' }}>
                <div className="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider"
                  style={{ borderBottom: '1px solid rgba(148,163,184,0.04)' }}>
                  通知中心
                </div>
                <div className="py-10 text-center">
                  <Bell size={24} className="mx-auto mb-3 text-[#334155]" strokeWidth={1} />
                  <div className="text-sm text-[#475569]">暂无新通知</div>
                  <div className="text-xs text-[#334155] mt-1">新消息会显示在这里</div>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-5 mx-1" style={{ background: 'rgba(148,163,184,0.06)' }} />

          {/* User */}
          {state.user ? (
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl cursor-pointer transition-all duration-200"
                style={{ background: showUserMenu ? 'rgba(139,92,246,0.08)' : '#111833' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #A78BFA, #6366F1)', color: 'white' }}>
                  {state.user.nickname[0]}
                </div>
                <ChevronDown size={12} className="text-[#475569] transition-transform"
                  style={{ transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-1.5 w-48 rounded-xl overflow-hidden z-50 animate-scale shadow-lg"
                  style={{ background: '#0C1027', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(148,163,184,0.04)' }}>
                    <div className="text-sm font-semibold text-[#F1F5F9]">{state.user.nickname}</div>
                    <div className="text-xs text-[#475569] mt-0.5">{state.user.email}</div>
                  </div>
                  <div className="py-1">
                    {([
                      { label: '个人中心', icon: User, action: () => { dispatch({ type: 'SET_VIEW_MODE', payload: 'user-profile' }); setShowUserMenu(false); } },
                      { label: '设置', icon: Settings, action: () => { dispatch({ type: 'SET_VIEW_MODE', payload: 'settings' }); setShowUserMenu(false); } },
                      ...(state.user?.isAdmin ? [{ label: '数据看板', icon: BarChart3, action: () => { dispatch({ type: 'SET_VIEW_MODE', payload: 'admin' }); setShowUserMenu(false); } }] : []),
                    ] as const).map(item => (
                      <button key={item.label}
                        onClick={item.action}
                        className="w-full px-4 py-2.5 text-left text-sm cursor-pointer transition-colors flex items-center gap-2.5 text-[#94A3B8]"
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; e.currentTarget.style.color = '#E2E8F0' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8' }}
                      >
                        <item.icon size={15} strokeWidth={1.5} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="py-1" style={{ borderTop: '1px solid rgba(148,163,184,0.04)' }}>
                    <button onClick={() => { dispatch({ type: 'SET_USER', payload: null }); setShowUserMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm cursor-pointer transition-colors flex items-center gap-2.5 text-[#EF4444]"
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <LogOut size={15} strokeWidth={1.5} />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (<>
          <button onClick={() => dispatch({ type: 'SHOW_LOGIN' })} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white transition-all cursor-pointer">登录</button>
            <button onClick={() => dispatch({ type: 'SHOW_REGISTER' })}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #A78BFA 0%, #6366F1 100%)',
                color: 'white',
                boxShadow: '0 0 20px rgba(139,92,246,0.2)',
              }}>
              <span className="hidden sm:inline">注册</span><span className="sm:hidden">注册</span>
            </button>
          </>)}

          {/* 联系学长 CTA */}
          <button onClick={() => setShowConsult(true)}
            className="hidden lg:flex px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              boxShadow: '0 0 16px rgba(16,185,129,0.25)',
            }}>
            联系学长
          </button>
        </div>
      </div>

      {/* ─── Mobile Bottom Nav ─── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around py-2 px-2"
        style={{
          background: 'rgba(6,11,20,0.90)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid rgba(139,92,246,0.06)',
        }}
      >
        {/* First 4 nav items */}
        {mobileNavItems.slice(0, 4).map(item => {
          const isActive = state.viewMode === item.key
          const Icon = item.icon
          return (
            <button key={item.key}
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: item.key as ViewMode })}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 min-w-[44px] xs:min-w-[56px]"
              style={{ color: isActive ? '#A78BFA' : '#64748B' }}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}

        {/* Shieldy shortcut — special brand highlight */}
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            window.dispatchEvent(new CustomEvent('open-shieldy'))
          }}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 min-w-[44px] xs:min-w-[56px]"
          style={{ color: '#A78BFA' }}>
          <div className="relative">
            <Bot size={18} strokeWidth={2} />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-[10px] font-medium">Shieldy</span>
        </button>

        {/* 社区 */}
        {mobileNavItems[4] && (() => {
          const item = mobileNavItems[4]
          const isActive = state.viewMode === item.key
          const Icon = item.icon
          return (
            <button key={item.key}
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: item.key as ViewMode })}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 min-w-[44px] xs:min-w-[56px]"
              style={{ color: isActive ? '#A78BFA' : '#64748B' }}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })()}
      </div>
    </nav>

    {/* ── 咨询弹窗 ── */}
    {showConsult && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        onClick={e => { if (e.target === e.currentTarget) setShowConsult(false) }}>
        <div className="relative w-full max-w-sm rounded-2xl overflow-hidden animate-scale"
          style={{ background: 'linear-gradient(180deg, #0F1729 0%, #0C1027 100%)', border: '1px solid rgba(139,92,246,0.18)', boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,246,0.08)' }}>

          {/* 顶部装饰条 */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #059669, #10B981, #34D399)' }} />

          {/* 关闭按钮 */}
          <button onClick={() => setShowConsult(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-white/5"
            style={{ color: '#64748B' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          {/* 内容 */}
          <div className="px-8 pt-8 pb-8 text-center">

            {/* 图标 */}
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15))', border: '1px solid rgba(16,185,129,0.2)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#10B981"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.72.72 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.87c-.135-.004-.272-.012-.406-.012zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/></svg>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">联系学长</h3>
            <p className="text-sm mb-6" style={{ color: 'rgba(148,163,184,0.8)' }}>
              1对1 职业规划 · 训练营咨询
            </p>

                        <img src="/wechat-qr.png" alt="微信二维码" className="w-44 h-44 rounded-2xl mx-auto mb-5 object-cover" style={{ border: '1px solid rgba(16,185,129,0.2)' }} />

            <p className="text-xs mb-1" style={{ color: 'rgba(148,163,184,0.55)' }}>
              长按识别二维码，或搜索微信号
            </p>
            <p className="text-sm font-semibold" style={{ color: '#10B981' }}>
              备注「AI安全」优先通过
            </p>
          </div>
        </div>
      </div>
    )}
    </>
  )
}