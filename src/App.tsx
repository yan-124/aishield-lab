import { useEffect, useState } from 'react'
import { ToastProvider } from './components/Toast'
import { Navigation } from './components/Navigation'
import { RegisterModal } from './components/RegisterModal'
import { LoginModal } from './components/LoginModal'
import { PaymentModal } from './components/PaymentModal'
import { HomePage } from './components/HomePage'
import { KnowledgeBase } from './components/KnowledgeBase'
import { KnowledgeDetail } from './components/KnowledgeDetail'
import { VideoSection } from './components/VideoSection'
import { RangeArena } from './components/RangeArena'
import { InterviewCoach } from './components/InterviewCoach'
import { CommunityFeed } from './components/CommunityFeed'
import { EnterprisePage } from './components/EnterprisePage'
import { NewsFeed } from './components/NewsFeed'
import { NewsDetail } from './components/NewsDetail'
import { UserProfile } from './components/UserProfile'
import { LearningPath } from './components/LearningPath'
import { PracticeRecords } from './components/PracticeRecords'
import { Leaderboard } from './components/Leaderboard'
import { ShieldyAssistant } from './components/ShieldyAssistant'
import { AdminPage } from './components/AdminPage'
import { CommandPalette } from './components/CommandPalette'
import { CareerGuide } from './components/CareerGuide'
import { PricingPage } from './components/PricingPage'
import { SettingsPage } from './components/SettingsPage'
import { CreditsPage } from './components/CreditsPage'
import { useAppContext } from './context/AppContext'

interface AppProps {
  onLoadComplete?: () => void
}

export const App = ({ onLoadComplete }: AppProps) => {
  const { state } = useAppContext()
  const [showPayment, setShowPayment] = useState(false)
  const [paymentOptions, setPaymentOptions] = useState<{ amount?: number; title?: string }>({})

  // 全局支付弹窗：任意页面触发 open-payment-modal 事件即可打开
  // 支持通过 CustomEvent.detail 传递 { amount, title }，默认 ¥19.90 月度会员
  useEffect(() => {
    const handler = ((e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail && typeof detail === 'object') {
        setPaymentOptions({ amount: detail.amount, title: detail.title })
      } else {
        setPaymentOptions({})
      }
      setShowPayment(true)
    }) as EventListener
    window.addEventListener('open-payment-modal', handler)
    return () => window.removeEventListener('open-payment-modal', handler)
  }, [])

  useEffect(() => {
    if (onLoadComplete) {
      const timer = setTimeout(() => {
        onLoadComplete()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [onLoadComplete])

  // 切换页面时强制滚动到顶部（解决点击导航/卡片后页面停在中间的问题）
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [state.viewMode, state.currentArticleId])

  const renderPage = () => {
    switch (state.viewMode) {
      case 'home':        return <HomePage />;
      case 'knowledge':   return <KnowledgeBase />;
      case 'knowledge-detail': return <KnowledgeDetail articleId={state.currentArticleId || 'a1'} />;
      case 'videos':      return <VideoSection />;
      case 'interview':    return <InterviewCoach />;
      case 'range':
      case 'range-level': return <RangeArena />;
      case 'community':   return <CommunityFeed />;
      case 'enterprise':        return <EnterprisePage />;
      case 'news':        return <NewsFeed />;
      case 'news-detail': return <NewsDetail newsId={state.currentArticleId || '1'} />;
      case 'user-profile': return <UserProfile />;
      case 'learning-progress': return <UserProfile />;
      case 'learning-path': return <LearningPath />;
      case 'practice-records': return <PracticeRecords />;
      case 'leaderboard': return <Leaderboard />;
      case 'career-guide': return <CareerGuide />;
      case 'pricing': return <PricingPage />;
      case 'settings': return <SettingsPage />;
      case 'credits': return <CreditsPage />;
      case 'admin': return <AdminPage />;
      default:            return <HomePage />;
    }
  }

  return (
    <ToastProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-root)' }}>
        <Navigation />
        <div className="pt-16 pb-16 md:pb-0">
          {renderPage()}
        </div>
        <CommandPalette />
        <ShieldyAssistant />
        {state.showLogin && <LoginModal />}
        <RegisterModal />
        {showPayment && (
          <PaymentModal
            onPaid={() => { setShowPayment(false); setPaymentOptions({}) }}
            onClose={() => { setShowPayment(false); setPaymentOptions({}) }}
            amount={paymentOptions.amount}
            title={paymentOptions.title}
          />
        )}
      </div>
    </ToastProvider>
  )
}
