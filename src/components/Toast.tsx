import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) { clearTimeout(timer); timers.current.delete(id) }
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 7)
    const toast: Toast = { id, message, type, duration }
    setToasts(prev => [...prev, toast])
    if (duration > 0) {
      const timer = setTimeout(() => hideToast(id), duration)
      timers.current.set(id, timer)
    }
  }, [hideToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  )
}

const iconMap: Record<ToastType, ReactNode> = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
  ),
}

const bgMap: Record<ToastType, string> = {
  success: 'rgba(52,211,153,0.12)',
  error: 'rgba(248,113,113,0.12)',
  warning: 'rgba(251,191,36,0.12)',
  info: 'rgba(96,165,250,0.12)',
}

const borderMap: Record<ToastType, string> = {
  success: 'rgba(52,211,153,0.3)',
  error: 'rgba(248,113,113,0.3)',
  warning: 'rgba(251,191,36,0.3)',
  info: 'rgba(96,165,250,0.3)',
}

const ToastContainer = ({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) => {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast, i) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-toast-in flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl"
          style={{
            background: 'rgba(12,16,39,0.95)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${borderMap[toast.type]}`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${bgMap[toast.type]}`,
            animationDelay: `${i * 80}ms`,
          }}
        >
          <span className="flex-shrink-0 mt-0.5">{iconMap[toast.type]}</span>
          <span className="text-sm text-[#E2E8F0] flex-1 leading-relaxed">{toast.message}</span>
          <button
            onClick={() => onClose(toast.id)}
            className="flex-shrink-0 ml-2 mt-0.5 text-[#475569] hover:text-[#94A3B8] transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      ))}
    </div>
  )
}
