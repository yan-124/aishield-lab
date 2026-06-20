// AI安全学习平台 - AIShield Lab

export type ViewMode =
  | 'home'
  | 'knowledge'
  | 'knowledge-detail'
  | 'videos'
  | 'range'
  | 'range-level'
  | 'community'
  | 'jobs'
  | 'news'
  | 'settings'
  | 'my'
  | 'learning-progress'
  | 'learning-path'
  | 'practice-records'
  | 'leaderboard'
  | 'user-profile';

export type ThemeMode = 'dark';

export interface UserInfo {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  identity?: 'student' | 'professional' | 'career_change';
  goals?: string[];
  painPoints?: string[];
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  articleCount: number;
  color: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  categoryId: string;
  summary: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  tags: string[];
  content?: string;
  category?: string;
}

export interface ArticleProgress {
  liked: boolean;
  favorited: boolean;
  readTime: number;
  lastReadAt: string;
}

export interface LearningRecord {
  date: string;
  type: 'article' | 'range' | 'video';
  title: string;
  duration: number;
}

export interface UserBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
}

export interface LevelHint {
  text: string;
  scorePenalty: number;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  views: number;
  category: string;
}

export interface RangeLevel {
  id: string;
  number: number;
  name: string;
  attackType: string;
  difficulty: number;
  description: string;
  completed?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  tags?: string[];
}

export interface JobItem {
  id: string;
  company: string;
  logo: string;
  title: string;
  location: string;
  salary: string;
  tags: string[];
  postedAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  summary: string;
  category: string;
  url?: string;
}

export interface AppState {
  viewMode: ViewMode;
  currentLevel: RangeLevel | null;
  currentArticleId: string | null;
  chatMessages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  theme: ThemeMode;
  user: UserInfo | null;
  showRegister: boolean;
  registerStep: number;
  searchQuery: string;
  showSearch: boolean;
  gameProfile: GameProfile;
  showLevelUp: { newLevel: number; albumName: string } | null;
  practiceRecords: PracticeRecord[];
}

export type AppAction =
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_CURRENT_LEVEL'; payload: RangeLevel | null }
  | { type: 'SET_CURRENT_ARTICLE'; payload: string | null }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'CLEAR_CHAT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: UserInfo | null }
  | { type: 'SHOW_REGISTER' }
  | { type: 'HIDE_REGISTER' }
  | { type: 'SET_REGISTER_STEP'; payload: number }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'TOGGLE_SEARCH'; payload?: string }
  | { type: 'SET_GAME_PROFILE'; payload: Partial<GameProfile> }
  | { type: 'SHOW_LEVEL_UP'; payload: { newLevel: number; albumName: string } }
  | { type: 'ADD_PRACTICE_RECORD'; payload: PracticeRecord }
  | { type: 'SET_PRACTICE_RECORDS'; payload: PracticeRecord[] };

export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  tags: string[];
}

export interface ArticleContent {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  summary: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  tags: string[];
  body: string;
  related: string[];
}

export interface GameProfile {
  level: number;
  xp: number;
  badges: string[];
  streak: number;
  lastActive: string;
}

// 学习路径
export interface LearningPathNode {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisiteIds: string[];
  type: 'article' | 'range' | 'video';
  targetId: string; // 对应的文章/关卡/视频 ID
  xpReward: number;
}

export interface LearningPathProgress {
  completedNodeIds: string[];
  currentNodeId: string | null;
  startedAt: string;
}

// 实战记录
export interface PracticeRecord {
  id: string;
  levelId: string;
  levelName: string;
  attackType: string;
  completedAt: string;
  attemptCount: number;
  hintCount: number;
  score: number;
  duration: number; // 秒
  keyPayload: string; // 成功的 payload 摘要
}

// 排行榜
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  avatar: string;
  score: number;
  completedLevels: number;
  totalXp: number;
  streak: number;
}

// 教学内容
export interface TeachingTip {
  id: string;
  category: string;
  title: string;
  summary: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}
