import { useEffect } from 'react'
import { Navigation } from './components/Navigation'
import { RegisterModal } from './components/RegisterModal'
import { LoginModal } from './components/LoginModal'
import { HomePage } from './components/HomePage'
import { KnowledgeBase } from './components/KnowledgeBase'
import { KnowledgeDetail } from './components/KnowledgeDetail'
import { VideoSection } from './components/VideoSection'
import { RangeArena } from './components/RangeArena'
import { InterviewArena } from './components/InterviewArena'
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
  const { state, dispatch } = useAppContext()

  useEffect(() => {
    if (onLoadComplete) {
      const timer = setTimeout(() => {
        onLoadComplete()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [onLoadComplete])

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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-root)' }}>
      <Navigation />
      <div className="pt-16 pb-16 md:pb-0">
        {renderPage()}
      </div>
      <CommandPalette />
      <ShieldyAssistant />
      {state.showLogin && <LoginModal />}
      <RegisterModal />
    </div>
  )
}
