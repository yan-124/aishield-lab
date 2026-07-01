import React, { useEffect, useState, Suspense } from 'react'
import { ToastProvider } from './components/Toast'
import { Navigation } from './components/Navigation'
import { RegisterModal } from './components/RegisterModal'
import { LoginModal } from './components/LoginModal'
import { PaymentModal } from './components/PaymentModal'
import { CommandPalette } from './components/CommandPalette'
import { ShieldyAssistant } from './components/ShieldyAssistant'
import { NotFoundPage } from './components/NotFoundPage'
import { useAppContext } from './context/AppContext'

// 页面级组件：按需加载
const HomePage = React.lazy(() => import('./components/HomePage').then(m => ({ default: m.HomePage })))
const KnowledgeBase = React.lazy(() => import('./components/KnowledgeBase').then(m => ({ default: m.KnowledgeBase })))
const KnowledgeDetail = React.lazy(() => import('./components/KnowledgeDetail').then(m => ({ default: m.KnowledgeDetail })))
const VideoSection = React.lazy(() => import('./components/VideoSection').then(m => ({ default: m.VideoSection })))
const RangeArena = React.lazy(() => import('./components/RangeArena').then(m => ({ default: m.RangeArena })))
const InterviewCoach = React.lazy(() => import('./components/InterviewCoach').then(m => ({ default: m.InterviewCoach })))
const CommunityFeed = React.lazy(() => import('./components/CommunityFeed').then(m => ({ default: m.CommunityFeed })))
const EnterprisePage = React.lazy(() => import('./components/EnterprisePage').then(m => ({ default: m.EnterprisePage })))
const NewsFeed = React.lazy(() => import('./components/NewsFeed').then(m => ({ default: m.NewsFeed })))
const NewsDetail = React.lazy(() => import('./components/NewsDetail').then(m => ({ default: m.NewsDetail })))
const UserProfile = React.lazy(() => import('./components/UserProfile').then(m => ({ default: m.UserProfile })))
const LearningPath = React.lazy(() => import('./components/LearningPath').then(m => ({ default: m.LearningPath })))
const PracticeRecords = React.lazy(() => import('./components/PracticeRecords').then(m => ({ default: m.PracticeRecords })))
const Leaderboard = React.lazy(() => import('./components/Leaderboard').then(m => ({ default: m.Leaderboard })))
const CareerGuide = React.lazy(() => import('./components/CareerGuide').then(m => ({ default: m.CareerGuide })))
const PricingPage = React.lazy(() => import('./components/PricingPage').then(m => ({ default: m.PricingPage })))
const SettingsPage = React.lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })))
const CreditsPage = React.lazy(() => import('./components/CreditsPage').then(m => ({ default: m.CreditsPage })))
const AdminPage = React.lazy(() => import('./components/AdminPage').then(m => ({ default: m.AdminPage })))

const PageLoadingSkeleton = () => (
  <div className='min-h-screen flex flex-col items-center justify-center' style={{ backgroundColor: 'var(--color-bg-root)' }}>
    <div className='relative w-12 h-12 mb-4'>
      <div className='absolute inset-0 rounded-full border-2 border-transparent animate-spin' style={{ borderTopColor: 'var(--color-accent)', borderRightColor: 'var(--color-accent)' }} />
      <div className='absolute inset-1 rounded-full border-2 border-transparent animate-spin' style={{ animationDirection: 'reverse', animationDuration: '1.5s', borderBottomColor: 'var(--color-accent-secondary)' }} />
    </div>
    <p className='text-sm' style={{ color: 'var(--color-text-muted)' }}>加载中...</p>
  </div>
)

interface AppProps {
  onLoadComplete?: () => void
}

export const App = ({ onLoadComplete }: AppProps) => {
  const { state } = useAppContext()
  const [showPayment, setShowPayment] = useState(false)
  const [paymentOptions, setPaymentOptions] = useState<{ amount?: number; title?: string }>({})

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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [state.viewMode, state.currentArticleId])

  const renderPage = () => {
    switch (state.viewMode) {
      case 'home':        return <Suspense fallback={<PageLoadingSkeleton />}><HomePage /></Suspense>;
      case 'knowledge':   return <Suspense fallback={<PageLoadingSkeleton />}><KnowledgeBase /></Suspense>;
      case 'knowledge-detail': return <Suspense fallback={<PageLoadingSkeleton />}><KnowledgeDetail articleId={state.currentArticleId || 'a1'} /></Suspense>;
      case 'videos':      return <Suspense fallback={<PageLoadingSkeleton />}><VideoSection /></Suspense>;
      case 'interview':   return <Suspense fallback={<PageLoadingSkeleton />}><InterviewCoach /></Suspense>;
      case 'range':
      case 'range-level': return <Suspense fallback={<PageLoadingSkeleton />}><RangeArena /></Suspense>;
      case 'community':   return <Suspense fallback={<PageLoadingSkeleton />}><CommunityFeed /></Suspense>;
      case 'enterprise':  return <Suspense fallback={<PageLoadingSkeleton />}><EnterprisePage /></Suspense>;
      case 'news':        return <Suspense fallback={<PageLoadingSkeleton />}><NewsFeed /></Suspense>;
      case 'news-detail': return <Suspense fallback={<PageLoadingSkeleton />}><NewsDetail newsId={state.currentArticleId || '1'} /></Suspense>;
      case 'user-profile': return <Suspense fallback={<PageLoadingSkeleton />}><UserProfile /></Suspense>;
      case 'learning-progress': return <Suspense fallback={<PageLoadingSkeleton />}><UserProfile /></Suspense>;
      case 'learning-path': return <Suspense fallback={<PageLoadingSkeleton />}><LearningPath /></Suspense>;
      case 'practice-records': return <Suspense fallback={<PageLoadingSkeleton />}><PracticeRecords /></Suspense>;
      case 'leaderboard': return <Suspense fallback={<PageLoadingSkeleton />}><Leaderboard /></Suspense>;
      case 'career-guide': return <Suspense fallback={<PageLoadingSkeleton />}><CareerGuide /></Suspense>;
      case 'pricing': return <Suspense fallback={<PageLoadingSkeleton />}><PricingPage /></Suspense>;
      case 'settings': return <Suspense fallback={<PageLoadingSkeleton />}><SettingsPage /></Suspense>;
      case 'credits': return <Suspense fallback={<PageLoadingSkeleton />}><CreditsPage /></Suspense>;
      case 'admin': return <Suspense fallback={<PageLoadingSkeleton />}><AdminPage /></Suspense>;
      default:            return <NotFoundPage />;
    }
  }

  return (
    <ToastProvider>
      <div className='min-h-screen' style={{ backgroundColor: 'var(--color-bg-root)' }}>
        <Navigation />
        <div className='pt-16 pb-16 md:pb-0'>
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
