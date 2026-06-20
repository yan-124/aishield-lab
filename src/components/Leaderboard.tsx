import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { LeaderboardEntry } from '../types';

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
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
  { rank: 11, userId: 'u11', nickname: '小白学安全', avatar: '🎓', score: 5120, completedLevels: 5, totalXp: 1180, streak: 8 },
  { rank: 12, userId: 'u12', nickname: '转行日记', avatar: '🔄', score: 4680, completedLevels: 4, totalXp: 980, streak: 6 },
];

type SortKey = 'score' | 'completedLevels' | 'streak' | 'totalXp';

export const Leaderboard = () => {
  const { state, dispatch } = useAppContext();
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');

  const sorted = [...MOCK_LEADERBOARD].sort((a, b) => b[sortKey] - a[sortKey]);

  // currentUserRank reserved for future use when real user matching is available

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

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 relative overflow-hidden">
      {/* gold/amber ambient glow in header */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.45), rgba(245,158,11,0.25))' }}
      />

      <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })}
        className="text-xs cursor-pointer flex items-center gap-1 relative" style={{ color: '#10B981' }}>
        ← 返回首页
      </button>

      <div className="relative">
        <h1 className="text-2xl font-black text-white mb-1">🏅 排行榜</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>看看你在 AI 安全学习者中的位置</p>
      </div>

      {/* 前三名高亮 */}
      <div className="grid grid-cols-3 gap-4">
        {sorted.slice(0, 3).map((entry) => {
          const rankInfo = getRankDisplay(entry.rank);
          const isFirst = entry.rank === 1;
          const isSecond = entry.rank === 2;
          return (
            <div key={entry.userId} className={`${isFirst ? 'order-2 scale-110' : isSecond ? 'order-1' : 'order-3'} flex flex-col items-center`}>
              <div className={`${isFirst ? 'h-44' : isSecond ? 'h-36' : 'h-32'} w-full rounded-2xl p-4 flex flex-col items-center justify-center transition-all`}
                style={{
                  background: isFirst
                    ? 'linear-gradient(180deg, rgba(255,215,0,0.12), rgba(255,215,0,0.03))'
                    : isSecond
                    ? 'linear-gradient(180deg, rgba(192,192,192,0.08), rgba(192,192,192,0.02))'
                    : 'linear-gradient(180deg, rgba(205,127,50,0.08), rgba(205,127,50,0.02))',
                  border: `1px solid ${rankInfo.color}25`,
                }}>
                <div className="text-3xl mb-2">{entry.avatar}</div>
                <div className="text-2xl mb-1">{rankInfo.emoji}</div>
                <div className="text-sm font-bold text-white mb-1">{entry.nickname}</div>
                <div className="text-lg font-black" style={{ color: rankInfo.color }}>{entry.score}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{entry.completedLevels}关 · 🔥{entry.streak}天</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 排序选项 */}
      <div className="flex items-center gap-2">
        {SORT_OPTIONS.map(opt => (
          <button key={opt.key}
            onClick={() => setSortKey(opt.key)}
            className="px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
            style={{
              background: sortKey === opt.key ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
              color: sortKey === opt.key ? '#10B981' : 'rgba(255,255,255,0.4)',
              border: sortKey === opt.key ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.06)',
            }}>
            {opt.label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {(['week', 'month', 'all'] as const).map(range => (
            <button key={range}
              onClick={() => setTimeRange(range)}
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

      {/* 排行列表 */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {sorted.map((entry) => {
          const rankInfo = getRankDisplay(entry.rank);
          return (
            <div key={entry.userId}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-8 text-center">
                {rankInfo.emoji ? (
                  <span className="text-lg">{rankInfo.emoji}</span>
                ) : (
                  <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>{entry.rank}</span>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'rgba(255,255,255,0.04)' }}>{entry.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{entry.nickname}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {entry.completedLevels}关通关 · 🔥{entry.streak}天连续 · {entry.totalXp} XP
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black" style={{ color: rankInfo.color }}>{entry[sortKey]}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {sortKey === 'score' ? '总分' : sortKey === 'completedLevels' ? '关' : sortKey === 'streak' ? '天' : 'XP'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 我的排名 */}
      <div className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
        <div className="text-lg">🎯</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">{state.user?.nickname || '你'}</div>
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            完成更多关卡来提升排名！
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'range' })}
          className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
          去靶场
        </button>
      </div>
    </div>
  );
};
