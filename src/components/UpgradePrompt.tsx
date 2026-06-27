import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, X, Zap, ArrowRight } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

interface UpgradePromptProps {
  open: boolean
  onClose: () => void
  feature?: string
  description?: string
}

const FEATURE_INFO: Record<string, { icon: string; title: string; desc: string }> = {
  range: { icon: '🎯', title: '解锁全部25关靶场', desc: '第6-25关覆盖OWASP LLM Top 10全部风险类型，从基础注入到高级对抗' },
  knowledge: { icon: '📚', title: '解锁知识库全文', desc: '25篇深度文章无字数限制，涵盖Prompt注入、对抗攻击、模型安全等方向' },
  video: { icon: '🎬', title: '解锁完整视频教程', desc: '12个实战教程无时长限制，从入门到高级全覆盖' },
  interview: { icon: '🎤', title: '解锁面试搭子无限次', desc: 'AI安全面试真题参考回答，结合简历生成个性化回答，不限次数' },
}

export const UpgradePrompt = ({ open, onClose, feature = 'range' }: UpgradePromptProps) => {
  const { dispatch } = useAppContext()
  const info = FEATURE_INFO[feature] || FEATURE_INFO.range

  const handleUpgrade = () => {
    onClose()
    dispatch({ type: 'SET_VIEW_MODE', payload: 'pricing' })
  }

  // 使用 React Portal 确保弹窗渲染在 body 层级，不受父容器 overflow/transform 影响
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 弹窗 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[90%] max-w-md rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #0F1125 0%, #0A0E1F 100%)',
              border: '1px solid rgba(167,139,250,0.25)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(167,139,250,0.1)',
            }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* 内容区 */}
            <div className="p-6 pt-8">
              {/* 图标 + 标题 */}
              <div className="text-center mb-5">
                <div className="text-4xl mb-3">{info.icon}</div>
                <h3 className="text-lg font-bold text-white mb-1">{info.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{info.desc}</p>
              </div>

              {/* 分隔线 */}
              <div className="h-px mb-5" style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.2), transparent)' }} />

              {/* 套餐选项 */}
              <div className="space-y-2.5">
                {/* 月度 */}
                <button
                  onClick={handleUpgrade}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/[0.04] cursor-pointer group"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-3">
                    <Zap size={18} style={{ color: '#60A5FA' }} />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">月度会员</div>
                      <div className="text-[10px] text-white/30">适合短期体验</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold" style={{ color: '#60A5FA' }}>¥19.9</div>
                    <div className="text-[10px] text-white/30">/月</div>
                  </div>
                </button>

                {/* 年度 - 推荐 */}
                <button
                  onClick={handleUpgrade}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/[0.04] cursor-pointer relative group"
                  style={{ border: '1px solid rgba(167,139,250,0.25)', background: 'rgba(167,139,250,0.04)' }}
                >
                  <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ background: '#A78BFA', color: '#0d1117' }}>最划算</div>
                  <div className="flex items-center gap-3">
                    <Crown size={18} style={{ color: '#A78BFA' }} />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">年度会员</div>
                      <div className="text-[10px] text-white/30">月均 ¥8.25</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold" style={{ color: '#A78BFA' }}>¥99</div>
                    <div className="text-[10px] text-white/30">/年</div>
                  </div>
                </button>

                {/* 终身 */}
                <button
                  onClick={handleUpgrade}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/[0.04] cursor-pointer group"
                  style={{ border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.03)' }}
                >
                  <div className="flex items-center gap-3">
                    <ArrowRight size={18} style={{ color: '#34D399' }} />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">终身会员</div>
                      <div className="text-[10px] text-white/30">一次买断 · 持续更新</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold" style={{ color: '#34D399' }}>¥299</div>
                    <div className="text-[10px] text-white/30">买断</div>
                  </div>
                </button>
              </div>

              {/* 底部提示 */}
              <p className="text-center text-[10px] text-white/20 mt-4">
                免费用户可体验前5关靶场 + 知识库预览 + 视频预览 + 面试搭子每天3次
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
