import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

interface PaymentModalProps {
  onPaid: () => void
  onClose: () => void
  amount?: number       // 金额，单位元，默认 19.90
  title?: string        // 商品名称
  creditsAmount?: number // 盾币数量（充值时使用）
}

type ModalState = 'loading' | 'qr_ready' | 'paid' | 'error' | 'timeout'

const POLL_INTERVAL = 2000 // 2秒轮询
const MAX_POLL_DURATION = 5 * 60 * 1000 // 5分钟超时

export const PaymentModal = ({
  onPaid,
  onClose,
  amount = 9.90,
  title = 'AIShield Lab - 职业引导完整报告',
  creditsAmount
}: PaymentModalProps) => {
  const [state, setState] = useState<ModalState>('loading')
  const [paymentUrl, setPaymentUrl] = useState('')
  const orderIdRef = useRef('')
  const pollTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const startTimeRef = useRef(0)

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // 生成订单ID
  const generateOrderId = () => {
    const ts = Date.now()
    const rand = Math.random().toString(36).substring(2, 8)
    return `CG${ts}${rand}`
  }

  // 创建支付订单
  const createOrder = async () => {
    setState('loading')
    const orderId = generateOrderId()
    orderIdRef.current = orderId
    startTimeRef.current = Date.now()

    try {
      const resp = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: amount.toFixed(2),
          title,
        }),
      })

      if (!resp.ok) {
        setState('error')
        return
      }

      const data = await resp.json()

      if (data.error) {
        setState('error')
        return
      }

      if (!data.url && !data.urlQrcode && !data.url_qrcode) {
        setState('error')
        return
      }

      const qrUrl = data.urlQrcode || data.url_qrcode || data.url
      setPaymentUrl(qrUrl)

      if (isMobile && data.url) {
        window.open(data.url, '_blank')
      }

      setState('qr_ready')
      startPolling()
    } catch {
      setState('error')
    }
  }

  // 轮询支付状态
  const startPolling = () => {
    const poll = async () => {
      // 超时检查
      if (Date.now() - startTimeRef.current > MAX_POLL_DURATION) {
        setState('timeout')
        return
      }

      try {
        const resp = await fetch(`/api/payment/status?orderId=${orderIdRef.current}`)
        const data = await resp.json()

        if (data.paid) {
          setState('paid')
          fetch('/api/auth/stats/track', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event:'payment_success' }) }).catch(() => {})
          // 存储解锁状态到 localStorage（兼容原有逻辑）
          try {
            localStorage.setItem('career_report_unlocked', orderIdRef.current)
          } catch {}
          // 如果是盾币充值，增加盾币余额并自动关闭
          if (creditsAmount) {
            try {
              const currentCredits = parseInt(localStorage.getItem('aishield_credits') || '50', 10)
              localStorage.setItem('aishield_credits', String(currentCredits + creditsAmount))
            } catch {}
            setTimeout(() => {
              onPaid()
            }, 1500)
          }
          // 诊断类订单（非充值）不自动关闭，展示微信二维码
          return
        }
      } catch {
        // 网络错误，继续轮询
      }

      pollTimerRef.current = setTimeout(poll, POLL_INTERVAL)
    }

    poll()
  }

  // 停止轮询
  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = undefined
    }
  }

  useEffect(() => {
    createOrder()
    return () => stopPolling()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClose = () => {
    stopPolling()
    onClose()
  }

  const handleRetry = () => {
    stopPolling()
    createOrder()
  }

  // QR码图片URL
  // 如果 paymentUrl 是完整的二维码图片URL（虎皮椒直接返回），直接使用
  // 否则用本地QR码生成服务生成
  const qrCodeUrl = paymentUrl
    ? paymentUrl.startsWith('http')
      ? paymentUrl
      : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(paymentUrl)}`
    : ''

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={state === 'paid' ? undefined : handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0F1525, #131B30)',
            border: '1px solid rgba(139,92,246,0.2)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          {/* Close button */}
          {state !== 'paid' && (
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
            >
              <X size={16} />
            </button>
          )}

          <div className="p-6 text-center">
            {/* Loading state */}
            {state === 'loading' && (
              <div className="py-8">
                <Loader2 size={40} className="mx-auto mb-4 animate-spin" style={{ color: '#A78BFA' }} />
                <p className="text-sm text-white font-medium">正在生成支付二维码...</p>
              </div>
            )}

            {/* QR code ready */}
            {state === 'qr_ready' && (
              <>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>支付金额</span>
                  <span className="text-2xl font-black" style={{ color: '#A78BFA' }}>¥{amount.toFixed(2)}</span>
                </div>
                <div className="relative inline-block mb-4">
                  {qrCodeUrl && (
                    <img
                      src={qrCodeUrl}
                      alt="支付二维码"
                      className="w-52 h-52 rounded-xl bg-white p-3"
                      style={{ display: 'block' }}
                      onError={(e) => {
                        // 如果图片加载失败，尝试使用备用服务生成二维码
                        const target = e.target as HTMLImageElement
                        if (!target.src.includes('api.qrserver.com') && paymentUrl) {
                          target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(paymentUrl)}`
                        }
                      }}
                    />
                  )}
                  {/* 扫描动画线 */}
                  <motion.div
                    className="absolute left-2 right-2 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, transparent, #A78BFA, transparent)' }}
                    animate={{ top: ['12px', '196px', '12px'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <Loader2 size={12} className="animate-spin" />
                  <span>扫码支付中...</span>
                </div>
                <p className="text-[10px] mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  微信/支付宝扫码均可，支付后自动确认
                </p>
              </>
            )}

            {/* Paid state */}
            {state === 'paid' && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(52,211,153,0.1)' }}
                >
                  <CheckCircle size={36} style={{ color: '#34D399' }} />
                </motion.div>
                <h3 className="text-base font-bold text-white mb-2">支付成功！</h3>
                {!creditsAmount ? (
                  <>
                    <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      添加微信，发送<strong style={{ color: '#A78BFA' }}>订单号+简历</strong>，48h内出具诊断书
                    </p>
                    <img src="/wechat-qr.png" alt="微信二维码" className="w-32 h-32 rounded-xl mx-auto mb-3 object-cover" style={{ border: '1px solid rgba(16,185,129,0.2)' }} />
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      订单号：{orderIdRef.current}
                    </p>
                    <button onClick={onClose}
                      className="mt-4 px-6 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all"
                      style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
                      完成
                    </button>
                  </>
                ) : (
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    盾币已到账，正在刷新...
                  </p>
                )}
              </motion.div>
            )}

            {/* Error state */}
            {state === 'error' && (
              <div className="py-6">
                <AlertCircle size={36} className="mx-auto mb-3" style={{ color: '#FBBF24' }} />
                <h3 className="text-sm font-bold text-white mb-1">支付通道临时维护</h3>
                <p className="text-xs mb-4 px-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  别急，添加学长微信，发送「解锁{title.replace(/^AIShield Lab - /, '')}」即可开通
                </p>
                <img src="/wechat-qr.png" alt="学长微信二维码" className="w-40 h-40 rounded-xl mx-auto mb-3 object-cover bg-white p-2" style={{ border: '1px solid rgba(16,185,129,0.2)' }} />
                <p className="text-[10px] mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  微信号：AIShieldLab · 备注「AI安全」优先通过
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleRetry}
                    className="px-5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <RefreshCw size={12} className="inline mr-1" /> 重试支付
                  </button>
                </div>
              </div>
            )}

            {/* Timeout state */}
            {state === 'timeout' && (
              <div className="py-6">
                <AlertCircle size={36} className="mx-auto mb-3" style={{ color: '#FBBF24' }} />
                <h3 className="text-sm font-bold text-white mb-1">支付等待超时</h3>
                <p className="text-xs mb-4 px-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  如已完成支付但未到账，或想快速开通，请直接联系学长
                </p>
                <img src="/wechat-qr.png" alt="学长微信二维码" className="w-40 h-40 rounded-xl mx-auto mb-3 object-cover bg-white p-2" style={{ border: '1px solid rgba(16,185,129,0.2)' }} />
                <p className="text-[10px] mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  微信号：AIShieldLab · 备注「AI安全」优先通过
                </p>
                <button
                  onClick={handleRetry}
                  className="px-5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all"
                  style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}
                >
                  <RefreshCw size={12} className="inline mr-1" /> 重新检查
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
