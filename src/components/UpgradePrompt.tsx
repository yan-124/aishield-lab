import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, X, Zap, ArrowRight } from 'lucide-react'

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
  const info = FEATURE_INFO[feature] || FEATURE_INFO.range

  const handleUpgrade = (amount: number, title: string) => {
    onClose()
    window.dispatchEvent(new CustomEvent('open-payment-modal', {
      detail: { amount, title: `AIShield Lab - ${title}` }
    }))
  }

  // 外层 fixed div 负责绝对居中定位（不受 framer-motion transform 干扰）
  // 内层 motion.div 只负责 opacity/scale 动画
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

          {/* 定位居中容器 */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* 弹窗（只做 fade+scale 动画，不动位置） */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-2xl overflow-hidden relative"
              style={{
                background: 'linear-gradient(180deg, #0F1125 0%, #0A0E1F 100%)',
                border: '1px solid rgba(167,139,250,0.25)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(167,139,250,0.1)',
              }}
            >
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer z-10"
              >
                <X size={16} />
              </button>

              {/* 内容区 */}
              <div className="p-6 pt-7 pb-5">
                {/* 图标 + 标题 */}
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">{info.icon}</div>
                  <h3 className="text-base font-bold text-white mb-1">{info.title}</h3>
                  <p className="text-[11px] text-white/40 leading-relaxed">{info.desc}</p>
                </div>

                {/* 分隔线 */}
                <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.15), transparent)' }} />

                {/* 套餐选项 — 横排三列，年度居中突出 */}
                <div className="flex items-stretch gap-2">
                  {/* 月度 */}
                  <button
                    onClick={() => handleUpgrade(19.90, '月度会员')}
                    className="flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all hover:bg-white/[0.04] cursor-pointer group"
                    style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <Zap size={14} style={{ color: '#60A5FA' }} />
                    <span className="text-xs font-medium text-white">月度会员</span>
                    <span className="text-[9px] text-white/30">短期体验</span>
                    <div className="text-base font-bold" style={{ color: '#60A5FA' }}>¥19.9</div>
                    <span className="text-[9px] text-white/30">/月</span>
                  </button>

                  {/* 年度 — 推荐（居中放大 + 发光） */}
                  <button
                    onClick={() => handleUpgrade(99.00, '年度会员')}
                    className="flex-[1.3] flex flex-col items-center gap-1 p-3 rounded-xl transition-all hover:bg-white/[0.06] cursor-pointer relative"
                    style={{
                      border: '1.5px solid rgba(167,139,250,0.35)',
                      background: 'rgba(167,139,250,0.06)',
                      boxShadow: '0 0 16px rgba(167,139,250,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
                      style={{ background: '#A78BFA', color: '#0d1117' }}>最划算</span>
                    <Crown size={16} style={{ color: '#A78BFA' }} />
                    <span className="text-sm font-bold text-white">年度会员</span>
                    <span className="text-[10px]" style={{ color: '#A78BFA' }}>月均 ¥8.25</span>
                    <div className="text-lg font-black" style={{ color: '#A78BFA' }}>¥99</div>
                    <span className="text-[9px] text-white/30">/年</span>
                  </button>

                  {/* 终身 */}
                  <button
                    onClick={() => handleUpgrade(299.00, '终身会员')}
                    className="flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all hover:bg-white/[0.04] cursor-pointer group"
                    style={{ border: '1px solid rgba(52,211,153,0.18)', background: 'rgba(52,211,153,0.03)' }}
                  >
                    <ArrowRight size={14} style={{ color: '#34D399' }} />
                    <span className="text-xs font-medium text-white">终身会员</span>
                    <span className="text-[9px] text-white/30">买断更新</span>
                    <div className="text-base font-bold" style={{ color: '#34D399' }}>¥299</div>
                    <span className="text-[9px] text-white/30">一次付清</span>
                  </button>
                </div>

                {/* 底部提示 */}
                <p className="text-center text-[9px] text-white/20 mt-4 leading-relaxed">
                  免费体验：前5关靶场 · 知识库预览 · 视频预览 · 面试搭子每天3次
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
