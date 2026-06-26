import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { UserBadge, LearningRecord } from '../types';

const CREDITS_KEY = 'aishield_credits'
const DEFAULT_CREDITS = 50

function getCreditsBalance(): number {
  try {
    const stored = localStorage.getItem(CREDITS_KEY)
    return stored ? parseInt(stored, 10) : DEFAULT_CREDITS
  } catch {
    return DEFAULT_CREDITS
  }
}

interface BadgeConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  requiredHours: number;
}

const BADGE_CONFIGS: BadgeConfig[] = [
  { id: 'beginner', name: '初学者', icon: '🌱', description: '累计学习1小时', requiredHours: 1 },
  { id: 'learner', name: '勤奋学习者', icon: '📚', description: '累计学习5小时', requiredHours: 5 },
  { id: 'hardworker', name: '努力拼搏', icon: '💪', description: '累计学习20小时', requiredHours: 20 },
  { id: 'expert', name: '学习专家', icon: '🎓', description: '累计学习50小时', requiredHours: 50 },
  { id: 'master', name: '大师', icon: '🏆', description: '累计学习100小时', requiredHours: 100 },
  { id: 'legend', name: '传奇', icon: '⭐', description: '累计学习500小时', requiredHours: 500 },
];

const LEARNING_HISTORY: LearningRecord[] = [
  { date: '2026-06-14', type: 'article', title: '什么是Prompt注入？',             duration: 8  },
  { date: '2026-06-14', type: 'range',   title: '靶场 L1 角色扮演（通关）',      duration: 12 },
  { date: '2026-06-13', type: 'video',   title: 'Prompt注入攻击实战演示',        duration: 13 },
  { date: '2026-06-13', type: 'article', title: '直接注入 vs 间接注入',         duration: 10 },
  { date: '2026-06-12', type: 'range',   title: '靶场 L2 开发者模式（通关）',  duration: 18 },
  { date: '2026-06-12', type: 'article', title: 'FGSM对抗样本生成',            duration: 10 },
  { date: '2026-06-11', type: 'article', title: '模型水印技术',                duration: 10 },
];

interface LeaderboardEntry {
  rank: number;
  nickname: string;
  avatar: string;
  hours: number;
  isSelf?: boolean;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, nickname: '张三', avatar: '🐯', hours: 128.5 },
  { rank: 2, nickname: '李四', avatar: '🐺', hours: 98.3 },
  { rank: 3, nickname: '王五', avatar: '🦊', hours: 86.7 },
  { rank: 4, nickname: '赵六', avatar: '🦁', hours: 72.4 },
  { rank: 5, nickname: '钱七', avatar: '🐼', hours: 65.2 },
  { rank: 6, nickname: '孙八', avatar: '🐨', hours: 58.9 },
  { rank: 7, nickname: '周九', avatar: '🦁', hours: 52.1 },
  { rank: 8, nickname: '吴十', avatar: '🐯', hours: 45.6 },
  { rank: 9, nickname: '郑十一', avatar: '🐺', hours: 38.2 },
  { rank: 10, nickname: '王十二', avatar: '🦊', hours: 32.8 },
];

const TYPE_ICON: Record<string, string> = { article: '📖', range: '🎯', video: '🎬' };
const TYPE_COLOR: Record<string, string> = { article: '#10B981', range: '#3B82F6', video: '#F59E0B' };

function getStreak(records: LearningRecord[]): number {
  const days = new Set(records.map(r => r.date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().split('T')[0];
    if (days.has(key)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

function calculateBadges(totalHours: number): UserBadge[] {
  return BADGE_CONFIGS.map(config => ({
    id: config.id,
    name: config.name,
    icon: config.icon,
    description: config.description,
    earned: totalHours >= config.requiredHours,
    earnedAt: totalHours >= config.requiredHours ? new Date().toISOString().split('T')[0] : undefined,
  }));
}

export const UserProfile = () => {
  const { state, dispatch } = useAppContext();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'badges' | 'history'>('leaderboard');
  const [credits, setCredits] = useState(DEFAULT_CREDITS);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'total' | '7day' | '30day' | 'yesterday'>('total');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const user = state.user;

  useEffect(() => {
    setCredits(getCreditsBalance())
    const handleStorage = () => {
      setCredits(getCreditsBalance())
    }
    window.addEventListener('storage', handleStorage)
    const interval = setInterval(() => {
      setCredits(getCreditsBalance())
    }, 1000)
    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, []);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <button
            onClick={() => dispatch({ type: 'LOGOUT' })}
            className="w-full mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer"
          >
            退出登录
          </button>
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-white mb-2">请先登录</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
          登录后即可查看个人学习数据和成就
        </p>
        <button onClick={() => dispatch({ type: 'SHOW_REGISTER' })}
          className="px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
          注册 / 登录
        </button>
      </div>
    );
  }

  const streak = getStreak(LEARNING_HISTORY);
  const completedArticles = LEARNING_HISTORY.filter(r => r.type === 'article').length;
  const completedLevels = LEARNING_HISTORY.filter(r => r.type === 'range').length;
  const totalMinutes = LEARNING_HISTORY.reduce((s, r) => s + r.duration, 0);
  const totalHours = totalMinutes / 60;
  
  const badges = calculateBadges(totalHours);
  const earnedBadges = badges.filter(b => b.earned);

  const filterLabels: Record<string, string> = {
    total: '全平台总榜',
    '7day': '7日学习巅峰榜',
    '30day': '30日学习巅峰榜',
    yesterday: '昨日学习巅峰榜',
  };

  const selfRank = 100;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 relative overflow-hidden">
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.45), rgba(139,92,246,0.25))' }}
      />

      <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })}
        className="text-xs cursor-pointer flex items-center gap-1 relative"
        style={{ color: '#10B981' }}>
        ← 返回首页
      </button>

      <div className="rounded-3xl p-8 text-center relative"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08))', border: '1px solid rgba(16,185,129,0.12)' }}>
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black"
            style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)', boxShadow: '0 0 30px rgba(16,185,129,0.3)' }}>
            {user.nickname?.[0] || '🧑'}
          </div>
          {/* 徽章展示在头像旁边 */}
          {earnedBadges.length > 0 && (
            <div className="absolute -bottom-1 -right-1 flex -space-x-2">
              {earnedBadges.slice(0, 3).map((badge, i) => (
                <div
                  key={badge.id}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-transform hover:scale-110"
                  style={{
                    background: 'rgba(0,0,0,0.8)',
                    borderColor: i === 0 ? '#FBBF24' : i === 1 ? '#9CA3AF' : '#CD7F32',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                  title={badge.name}
                >
                  {badge.icon}
                </div>
              ))}
              {earnedBadges.length > 3 && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2"
                  style={{
                    background: 'rgba(0,0,0,0.8)',
                    borderColor: '#A78BFA',
                    color: '#A78BFA',
                  }}
                  title={`+${earnedBadges.length - 3}个徽章`}
                >
                  +{earnedBadges.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{user.email}</p>

        <div className="grid grid-cols-5 gap-4 mt-6">
          {[
            { label: '学习文章', value: completedArticles, icon: '📖', color: '#10B981' },
            { label: '通关关卡', value: completedLevels, icon: '🎯', color: '#3B82F6' },
            { label: '学习时长', value: `${totalHours.toFixed(1)}h`, icon: '⏱️', color: '#F59E0B' },
            { label: '连续天数', value: `${streak}天`, icon: '🔥', color: '#EF4444' },
            { label: '盾币', value: credits, icon: '🛡️', color: '#A78BFA' },
          ].map(stat => (
            <div key={stat.label} className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-lg mb-1">{stat.icon}</div>
              <div className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.04))', border: '1px solid rgba(16,185,129,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">🛡️</div>
          <div>
            <div className="text-2xl font-black text-white">{credits}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>盾币</div>
          </div>
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'credits' })}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
          ⚡ 充值
        </button>
      </div>

      <div className="flex gap-1">
        {([
          { key: 'leaderboard', label: '🏆 学习排行榜' },
          { key: 'badges', label: '🏅 成就徽章' },
          { key: 'history', label: '📜 学习记录' },
        ] as const).map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-200"
            style={{
              background: activeTab === tab.key ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
              color: activeTab === tab.key ? '#10B981' : 'rgba(255,255,255,0.4)',
              border: activeTab === tab.key ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.06)',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'leaderboard' && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.06), rgba(245,158,11,0.04))', border: '1px solid rgba(251,191,36,0.15)' }}>
          {/* 排行榜头部 */}
          <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <span className="text-sm font-bold text-white">学习排行榜</span>
              </div>
              {/* 筛选下拉菜单 */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer flex items-center gap-2 transition-all"
                  style={{
                    background: showFilterMenu ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
                    color: showFilterMenu ? '#FBBF24' : 'rgba(255,255,255,0.6)',
                    border: showFilterMenu ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span>{filterLabels[leaderboardFilter]}</span>
                  <span className="text-[10px]">{showFilterMenu ? '▲' : '▼'}</span>
                </button>
                {/* 下拉菜单 */}
                {showFilterMenu && (
                  <div className="absolute right-0 top-full mt-2 w-40 rounded-xl overflow-hidden z-10"
                    style={{
                      background: '#131B30',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                    }}>
                    {(['total', '7day', '30day', 'yesterday'] as const).map(key => (
                      <button
                        key={key}
                        onClick={() => { setLeaderboardFilter(key); setShowFilterMenu(false); }}
                        className="w-full px-4 py-2.5 text-left text-xs cursor-pointer transition-all"
                        style={{
                          color: leaderboardFilter === key ? '#FBBF24' : 'rgba(255,255,255,0.6)',
                          background: leaderboardFilter === key ? 'rgba(251,191,36,0.1)' : 'transparent',
                        }}>
                        {filterLabels[key]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 排行榜列表 */}
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {MOCK_LEADERBOARD.map((entry, index) => (
              <div key={entry.rank} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                {/* 排名 */}
                <div className="w-6 text-center">
                  {index === 0 && <span className="text-lg">🥇</span>}
                  {index === 1 && <span className="text-lg">🥈</span>}
                  {index === 2 && <span className="text-lg">🥉</span>}
                  {index > 2 && (
                    <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {entry.rank}
                    </span>
                  )}
                </div>
                {/* 头像 */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                  {entry.avatar}
                </div>
                {/* 昵称 */}
                <div className="flex-1">
                  <span className="text-xs font-medium text-white">{entry.nickname}</span>
                </div>
                {/* 时长 */}
                <div className="text-right">
                  <span className="text-xs font-bold" style={{ color: '#FBBF24' }}>
                    {entry.hours.toFixed(2)}小时
                  </span>
                </div>
              </div>
            ))}

            {/* 自己的排名 */}
            <div className="flex items-center gap-4 px-4 py-3"
              style={{
                background: 'rgba(16,185,129,0.06)',
                borderTop: '1px solid rgba(16,185,129,0.1)',
              }}>
              <div className="w-6 text-center">
                <span className="text-xs font-bold" style={{ color: '#10B981' }}>{selfRank}+</span>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                  border: '1px solid rgba(16,185,129,0.3)',
                }}>
                {user.nickname?.[0] || '🧑'}
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium" style={{ color: '#10B981' }}>
                  （我）
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold" style={{ color: '#10B981' }}>
                  {totalHours.toFixed(2)}小时
                </span>
              </div>
            </div>

            {/* 提示 */}
            <div className="px-4 py-3 text-center">
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                当前未上榜，继续加油~
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map(badge => {
            const config = BADGE_CONFIGS.find(c => c.id === badge.id);
            const progress = config ? Math.min((totalHours / config.requiredHours) * 100, 100) : 0;
            
            return (
              <div key={badge.id}
                className={`p-5 rounded-2xl text-center transition-all duration-300 ${
                  badge.earned ? 'hover:-translate-y-1' : 'opacity-50'
                }`}
                style={{
                  background: badge.earned ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${badge.earned ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)'}`,
                }}>
                <div className="text-4xl mb-2">{badge.earned ? badge.icon : '🔒'}</div>
                <div className="text-sm font-bold text-white mb-1">{badge.name}</div>
                <div className="text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {badge.description}
                </div>
                {!badge.earned && config && (
                  <div className="mt-2">
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          background: 'linear-gradient(90deg, #FBBF24, #F59E0B)',
                        }} />
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {totalHours.toFixed(1)}/{config.requiredHours}小时
                    </div>
                  </div>
                )}
                {badge.earned && badge.earnedAt && (
                  <div className="text-[10px]" style={{ color: '#10B981' }}>
                    ✅ 获得于 {badge.earnedAt}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-2">
          {LEARNING_HISTORY.map((record, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-lg">{TYPE_ICON[record.type] || '📋'}</span>
              <div className="flex-1">
                <div className="text-xs text-white">{record.title}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{record.date}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: `${TYPE_COLOR[record.type] || '#888'}15`, color: TYPE_COLOR[record.type] || '#888' }}>
                {record.duration}分钟
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'settings' })}
          className="w-full py-3 rounded-xl text-xs cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
          ⚙️ 账户设置
        </button>
      </div>
    </div>
  );
};
