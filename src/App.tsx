import { Navigation } from './components/Navigation'
import { RegisterModal } from './components/RegisterModal'
import { HomePage } from './components/HomePage'
import { KnowledgeBase } from './components/KnowledgeBase'
import { KnowledgeDetail } from './components/KnowledgeDetail'
import { VideoSection } from './components/VideoSection'
import { RangeArena } from './components/RangeArena'
import { CommunityFeed } from './components/CommunityFeed'
import { JobBoard } from './components/JobBoard'
import { NewsFeed } from './components/NewsFeed'
import { UserProfile } from './components/UserProfile'
import { LearningProgress } from './components/LearningProgress'
import { LearningPath } from './components/LearningPath'
import { PracticeRecords } from './components/PracticeRecords'
import { Leaderboard } from './components/Leaderboard'
import { ShieldyAssistant } from './components/ShieldyAssistant'
import { useAppContext } from './context/AppContext'

export const App = () => {
  const { state } = useAppContext()

  const renderPage = () => {
    switch (state.viewMode) {
      case 'home':        return <HomePage />;
      case 'knowledge':   return <KnowledgeBase />;
      case 'knowledge-detail': return <KnowledgeDetail articleId={state.currentArticleId || 'a1'} />;
      case 'videos':      return <VideoSection />;
      case 'range':
      case 'range-level': return <RangeArena />;
      case 'community':   return <CommunityFeed />;
      case 'jobs':        return <JobBoard />;
      case 'news':        return <NewsFeed />;
      case 'user-profile': return <UserProfile />;
      case 'learning-progress': return <LearningProgress />;
      case 'learning-path': return <LearningPath />;
      case 'practice-records': return <PracticeRecords />;
      case 'leaderboard': return <Leaderboard />;
      default:            return <HomePage />;
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0F1C' }}>
      {/* Global navigation */}
      <Navigation />

      {/* Page content with top offset for nav bar */}
      <div className="pt-16 pb-16 md:pb-0">
        {renderPage()}
      </div>

      {/* Floating AI mascot — always visible across all pages */}
      <ShieldyAssistant />

      {/* Auth modals */}
      <RegisterModal />
    </div>
  )
}
