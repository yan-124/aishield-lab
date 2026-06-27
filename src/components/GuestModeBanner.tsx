import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { Play, X } from 'lucide-react'

/**
 * 游客模式提示 - 紧急上线版本（v3修复版）
 * 目的：让用户不注册也能体验产品核心价值
 * 位置：首页HeroSection下方
 * 修复：
 *   - 移除DISMISS_GUEST_BANNER action（reducer中不存在），改用本地状态
 *   - 关闭按钮独立、不覆盖CTA、不触发跳转
 */
export function GuestModeBanner() {
  const { dispatch } = useAppContext()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleTryGuest = () => {
    dispatch({
      type: 'SET_USER',
      payload: {
        id: 'guest',
        nickname: '游客',
        isLoggedIn: false,
        isGuest: true
      }
    })
    dispatch({ type: 'SET_VIEW_MODE', payload: 'learning-path' })
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDismissed(true)
  }

  return (
    <div className="relative bg-gradient-to-r from-purple-900/30 to-cyan-900/30
                border border-purple-500/20 rounded-xl p-4 pr-10 mb-6
                backdrop-blur-sm">

      {/* 关闭按钮 - 明确放在横幅右上角，独立不重叠CTA */}
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full
                   flex items-center justify-center
                   text-white/40 hover:text-white/90 hover:bg-white/10
                   transition-colors"
        aria-label="关闭提示"
      >
        <X size={16} />
      </button>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {/* 图标 */}
          <div className="w-10 h-10 rounded-lg bg-purple-500/20
                      flex items-center justify-center flex-shrink-0">
            <Play className="w-5 h-5 text-purple-400" />
          </div>

          {/* 文案 */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-1">
              不想立即注册？先体验一下
            </h4>
            <p className="text-white/60 text-xs">
              游客模式可体验前3关靶场 + 浏览知识库（数据不会保存）
            </p>
          </div>
        </div>

        {/* CTA按钮 */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <button
            onClick={handleTryGuest}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700
                       text-white text-sm font-semibold rounded-lg
                       transition-all duration-200 hover:scale-105
                       flex items-center gap-2"
          >
            <Play size={14} />
            立即体验
          </button>
          <button
            onClick={() => dispatch({ type: 'SHOW_LOGIN' })}
            className="px-4 py-2 bg-white/5 hover:bg-white/10
                       text-white/80 text-sm font-medium rounded-lg
                       border border-white/10 transition-all duration-200"
          >
            登录
          </button>
          <button
            onClick={() => dispatch({ type: 'SHOW_REGISTER' })}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700
                       text-white text-sm font-semibold rounded-lg
                       transition-all duration-200"
          >
            注册
          </button>
        </div>
      </div>
    </div>
  )
}
