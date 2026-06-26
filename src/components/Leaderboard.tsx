import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext'
import { useRequireAuth } from '../hooks/useRequireAuth';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Trophy, Flame, Target, Zap, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LeaderboardEntry } from '../types';

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', nickname: 'ShadowBreaker', avatar: '🥷', score: 9850, completedLevels: 10, totalXp: 3200, streak: 28 },
  { rank: 2, userId: 'u2', nickname: 'RedTeam_Alice', avatar: '🔴', score: 9420, completedLevels: 10, totalXp: 2950, streak: 21 },
  { rank: 3, userId: 'u3', nickname: 'PromptMaster99', avatar: '⚡', score: 9180, completedLevels: 9, totalXp: 2780, streak: 15 },
  { rank: 4, userId: 'u4', nickname: 'AIHunter', avatar: '🔍', score: 8760, completedLevels: 9, totalXp: 2540, streak: 12 },
  { rank: 5, userId: 'u5', nickname: 'NeuralSec', avatar: '🧠', score: 8320, completedLevels: 8, totalXp: 2310, streak: 18 },
  { rank: 6, userId: 'u6', nickname: 'ZeroDayHunter', avatar: '🎯', score: 7890, completedLevels: 8, totalXp: 2080, streak: 9 },
  { rank: 7, userId: 'u7', nickname: 'BreachExpert', avatar: '🔓', score: 7450, completedLevels: 7, totalXp: 1860, streak: 7 },
  { rank: 8, userId: 'u8', nickname: 'DarkPrompt', avatar: '🌙', score: 7120, completedLevels: 7, totalXp: 1720, streak: 14 },
  { rank: 9, userId: 'u9', nickname: 'SecResearcher', avatar: '🔬', score: 6780, completedLevels: 6, totalXp: 1580, streak: 5 },
  { rank: 10, userId: 'u10', nickname: 'LLMTester', avatar: '🤖', score: 6340, completedLevels: 6, totalXp: 1420, streak: 3 },
  { rank: 11, userId: 'u11', nickname: '小白}学安全', avatar: '🎓', score: 5120, completedLevels: 5, totalXp: 1180, streak: 8 },
  { rank: 12, userId: 'u12', nickname: '转行日记', avatar: '🔄', score: 4680, completedLevels: 4, totalXp: 980, streak: 6 },
];

// Simulated rank changes
const RANK_CHANGES: Record<string, number> = {
  u1: 0, u2: 1, u3: -1, u4: 2, u5: 0, u6: -2, u7: 1, u8: 0, u9: -1, u10: 3, u11: 0, u12: -1
};

// Achievement badges
function getBadges(entry: LeaderboardEntry): {icon: string; label: string; color: string}[] {
  const badges = [];
  if (entry.completedLevels >= 10) badges.push({ icon: "👑", label: "靶场高手", color: "#FBBF24" });
  if (entry.streak >= 14) badges.push({ icon: "🔥", label: "连续打卡王", color: "#F97316" });
  if (entry.totalXp >= 2000) badges.push({ icon: "⚡", label: "XP达人", color: "#8B5CF6" });
  if (entry.completedLevels >= 5 && entry.completedLevels < 10) badges.push({ icon: "🎯", label: "稳步提升", color: "#10B981" });
  if (entry.rank <= 3) badges.push({ icon: "🏆", label: "奖牌选手", color: "#EC4899" });
  return badges;
}

type SortKey = 'score' | 'completedLevels' | 'streak' | 'totalXp';

function getUserRealScore(): { completedLevels: number; score: number } {
  try {
    const stored = localStorage.getItem('aishield-completed-levels');
    const completed = stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    const completedLevels = completed.size;
    const score = completedLevels * 980;
    return { completedLevels, score };
  } catch { return { completedLevels: 0, score: 0 }; }
}

export const Leaderboard = () => {
  const { state, dispatch } = useAppContext()
  const { isLoggedIn, checkAuth } = useRequireAuth();
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  const [userScore, setUserScore] = useState(getUserRealScore());

  useEffect(() => { setUserScore(getUserRealScore()); }, [state.viewMode]);

  const userNickname = state.user?.nickname || '你';
  const userAvatar = '🛡️';

  const userEntry: LeaderboardEntry = {
    rank: 0, userId: 'current-user', nickname: userNickname, avatar: userAvatar,
    score: userScore.score, completedLevels: userScore.completedLevels,
    totalXp: userScore.completedLevels * 280, streak: 0,
  };

  const allEntries = [...DEMO_LEADERBOARD, userEntry];
  const maxScore = Math.max(...allEntries.map(e => e.score));
  const sorted = [...allEntries].sort((a, b) => b[sortKey] - a[sortKey]).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  const currentUserEntry = sorted.find(e => e.userId === 'current-user');

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'score', label: '总评分' },
    { key: 'completedLevels', label: '通关数' },
    { key: 'streak', label: '连续天数' },
    { key: 'totalXp', label: '经验值' },
  ];

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', color: '#FFD700' };
    if (rank === 2) return { emoji: '🥈', color: '#C0C0C0' };
    if (rank === 3) return { emoji: '🥉', color: '#CD7F32' };
    return { emoji: null, color: 'rgba(255,255,255,0.3)' };
  };

  // Stats summary
  const totalParticipants = allEntries.length;
  const avgScore = Math.round(allEntries.reduce((s, e) => s + e.score, 0) / allEntries.length);
  const totalCompleted = allEntries.reduce((s, e) => s + e.completedLevels, 0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.45), rgba(99,102,241,0.25))' }} />
      <div className="absolute -bottom-32 -left-20 w-64 h-64 rounded-full opacity-[0.06] blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.5), transparent)' }} />

      <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })}
        className="text-xs cursor-pointer flex items-center gap-1 relative" style={{ color: '#A78BFA' }}>
        ← 返回首页
      </button>

      {/* Header */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Crown className="w-6 h-6" style={{ color: '#FBBF24' }} /> 排行榜
            </h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>你的靶场成绩已自动计入排名</p>
          </div>
          <span className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: 'rgba(139,92,246,0.08)', color: 'rgba(139,92,246,0.5)' }}>
            <RefreshCw className="w-3 h-3" />
            示例排行
          </span>
        </div>
      </div>

      {/* Stats summary cards */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3">
        {[{ icon: Target, label: "参赛人数", value: totalParticipants, color: "#A78BFA" },
          { icon: Trophy, label: "平均得分", value: avgScore, color: "#FBBF24" },
          { icon: Zap, label: "总通关数", value: totalCompleted, color: "#34D399" }].map((stat, i) => (
          <div key={i} className="rounded-xl p-3 text-center" style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <stat.icon className="w-4 h-4 mx-auto mb-1" style={{ color: stat.color }} />
            <div className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-4">
        {sorted.slice(0, 3).map((entry) => {
          const rankInfo = getRankDisplay(entry.rank);
          const isFirst = entry.rank === 1;
          const isSecond = entry.rank === 2;
          const isMe = entry.userId === 'current-user';
          return (
            <div key={entry.userId} className={`${isFirst ? 'order-2 scale-110' : isSecond ? 'order-1' : 'order-3'} flex flex-col items-center`}>
              <div className={`${isFirst ? 'h-48' : isSecond ? 'h-40' : 'h-36'} w-full rounded-2xl p-4 flex flex-col items-center justify-center transition-all relative`}
                style={{
                  background: isFirst
                    ? 'linear-gradient(180deg, rgba(139,92,246,0.15), rgba(139,92,246,0.03))'
                    : isSecond
                    ? 'linear-gradient(180deg, rgba(99,102,241,0.10), rgba(99,102,241,0.02))'
                    : 'linear-gradient(180deg, rgba(168,85,247,0.08), rgba(168,85,247,0.02))',
                  border: isMe ? '2px solid rgba(139,92,246,0.5)' : `1px solid ${rankInfo.color}20`,
                  boxShadow: isFirst ? '0 8px 32px rgba(139,92,246,0.15)' : 'none',
                }}>
                {isMe && (
                  <span className="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>我</span>
                )}
                <div className="text-3xl mb-1">{entry.avatar}</div>
                <div className="text-2xl mb-1">{rankInfo.emoji}</div>
                <div className="text-sm font-bold text-white mb-1">{entry.nickname}</div>
                <div className="text-lg font-black" style={{ color: isFirst ? '#C4B5FD' : rankInfo.color }}>{entry.score}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{entry.completedLevels}关 · 🔥{entry.streak}天</div>
                {/* Score progress bar */}
                <div className="w-full mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full" style={{
                    width: Math.round((entry.score / maxScore) * 100) + '%',
                    background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sort + time range */}
      <div className="flex items-center gap-2 flex-wrap">
        {SORT_OPTIONS.map(opt => (
          <button key={opt.key} onClick={() => setSortKey(opt.key)}
            className="px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
            style={{
              background: sortKey === opt.key ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
              color: sortKey === opt.key ? '#A78BFA' : 'rgba(255,255,255,0.4)',
              border: sortKey === opt.key ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(255,255,255,0.06)',
            }}>
            {opt.label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {(['week', 'month', 'all'] as const).map(range => (
            <button key={range} onClick={() => setTimeRange(range)}
              className="px-2 py-1 rounded-md text-[10px] cursor-pointer"
              style={{
                background: timeRange === range ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: timeRange === range ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
              }}>
              {range === 'week' ? '本周' : range === 'month' ? '本月' : '总榜'}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {sorted.map((entry, idx) => {
          const rankInfo = getRankDisplay(entry.rank);
          const isMe = entry.userId === 'current-user';
          const change = RANK_CHANGES[entry.userId] ?? 0;
          const badges = getBadges(entry);
          return (
            <motion.div key={entry.userId}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: isMe ? 'rgba(139,92,246,0.04)' : undefined,
              }}>
              {/* Rank */}
              <div className="w-8 text-center">
                {rankInfo.emoji ? (
                  <span className="text-lg">{rankInfo.emoji}</span>
                ) : (
                  <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>{entry.rank}</span>
                )}
              </div>
              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: isMe ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.04)' }}>{entry.avatar}</div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                  {entry.nickname}
                  {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>我</span>}
                  {/* Badges */}
                  {badges.slice(0, 2).map((b, bi) => (
                    <span key={bi} className="text-[9px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5"
                      style={{ background: b.color + '12', color: b.color, border: '1px solid ' + b.color + '20' }}>
                      {b.icon} {b.label}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <span>{entry.completedLevels}关通关</span>
                  <span>🔥{entry.streak}天</span>
                  <span>{entry.totalXp} XP</span>
                </div>
                {/* Progress bar */}
                <div className="mt-1.5 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', maxWidth: '200px' }}>
                  <div className="h-full rounded-full" style={{
                    width: Math.round((entry.score / maxScore) * 100) + '%',
                    background: 'linear-gradient(90deg, rgba(139,92,246,0.5), rgba(139,92,246,0.2))',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
              {/* Rank change */}
              <div className="flex items-center gap-0.5 w-8 justify-center">
                {change > 0 && <TrendingUp className="w-3 h-3" style={{ color: '#34D399' }} />}
                {change < 0 && <TrendingDown className="w-3 h-3" style={{ color: '#F87171' }} />}
                {change === 0 && <Minus className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.15)' }} />}
                {change !== 0 && <span className="text-[9px] font-bold" style={{ color: change > 0 ? '#34D399' : '#F87171' }}>{Math.abs(change)}</span>}
              </div>
              {/* Score */}
              <div className="text-right">
                <div className="text-sm font-black" style={{ color: isMe ? '#A78BFA' : rankInfo.color }}>{entry[sortKey]}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {sortKey === 'score' ? '总分' : sortKey === 'completedLevels' ? '关' : sortKey === 'streak' ? '天' : 'XP'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* My rank */}
      {currentUserEntry && (
        <div className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)' }}>
          <div className="text-lg">🎯</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">当前排名 #{currentUserEntry.rank}</div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              已完成 {userScore.completedLevels}/10 关 · 完成更多关卡来提升排名！
            </div>
          </div>
          <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'range' })}
            className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white' }}>
            去靶场
          </button>
        </div>
      )}
    </div>
  );
};