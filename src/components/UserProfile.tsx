import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { UserBadge, LearningRecord } from '../types';

const BADGES: UserBadge[] = [
  { id: 'b1', name: '初学者',     icon: '🌱', description: '完成第一篇知识文章阅读',             earned: true,  earnedAt: '2026-06-01' },
  { id: 'b2', name: 'Prompt猎人',   icon: '🔍', description: '成功通关3个Prompt注入关卡',       earned: true,  earnedAt: '2026-06-05' },
  { id: 'b3', name: '对抗大师',    icon: '⚔️', description: '完成全部对抗攻击文章学习',       earned: false },
  { id: 'b4', name: '安全卫士',    icon: '🛡️', description: '连续7天完成学习打卡',             earned: false },
  { id: 'b5', name: '社区贡献者',  icon: '💬', description: '在社区发布5篇有价值的帖子',       earned: false },
  { id: 'b6', name: '全能选手',    icon: '🏆', description: '完成知识库所有分类的学习',       earned: false },
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

function getWeekProgress(records: LearningRecord[]): { date: string; count: number }[] {
  const result: { date: string; count: number }[] = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(d);
    dt.setDate(dt.getDate() - i);
    const key = `${dt.getMonth() + 1}/${dt.getDate()}`;
    const cnt = records.filter(r => r.date === dt.toISOString().split('T')[0]).length;
    result.push({ date: key, count: cnt });
  }
  return result;
}

export const UserProfile = () => {
  const { state, dispatch } = useAppContext();
  const [activeTab, setActiveTab] = useState<'stats' | 'badges' | 'history'>('stats');
  const user = state.user;

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
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
  const weekData = getWeekProgress(LEARNING_HISTORY);
  const maxWeekCount = Math.max(...weekData.map(d => d.count), 1);
  const completedArticles = LEARNING_HISTORY.filter(r => r.type === 'article').length;
  const completedLevels   = LEARNING_HISTORY.filter(r => r.type === 'range').length;
  const totalMinutes      = LEARNING_HISTORY.reduce((s, r) => s + r.duration, 0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 relative overflow-hidden">
      {/* violet/purple ambient glow in header */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.45), rgba(139,92,246,0.25))' }}
      />

      {/* 返回 */}
      <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })}
        className="text-xs cursor-pointer flex items-center gap-1 relative"
        style={{ color: '#10B981' }}>
        ← 返回首页
      </button>

      {/* 用户卡片 */}
      <div className="rounded-3xl p-8 text-center relative"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08))', border: '1px solid rgba(16,185,129,0.12)' }}>
        {/* 头像 */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl font-black"
          style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)', boxShadow: '0 0 30px rgba(16,185,129,0.3)' }}>
          {user.nickname?.[0] || '🧑'}
        </div>
        <h2 className="text-xl font-bold text-white mb-1">{user.nickname}</h2>
        <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{user.email}</p>
        {user.identity && (
          <span className="inline-block text-[10px] px-3 py-1 rounded-full mt-2"
            style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA' }}>
            {user.identity === 'student' ? '🎓 学生' : user.identity === 'professional' ? '💼 从业者' : '🔄 转行者'}
          </span>
        )}

        {/* 快速统计 */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[
            { label: '学习文章', value: completedArticles, icon: '📖', color: '#10B981' },
            { label: '通关关卡', value: completedLevels,   icon: '🎯', color: '#3B82F6' },
            { label: '学习时长', value: `${totalMinutes}m`, icon: '⏱️', color: '#F59E0B' },
            { label: '连续天数', value: `${streak}天`, icon: '🔥', color: '#EF4444' },
          ].map(stat => (
            <div key={stat.label} className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-lg mb-1">{stat.icon}</div>
              <div className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1">
        {([
          { key: 'stats',    label: '📊 学习统计' },
          { key: 'badges',  label: '🏅 成就徽章' },
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

      {/* ── 学习统计 ── */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* 本周学习热力图 */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-sm font-semibold text-white mb-4">📅 本周学习情况</div>
            <div className="flex items-end gap-2 h-32">
              {weekData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${Math.max((d.count / maxWeekCount) * 100, 4)}%`,
                      background: d.count > 0
                        ? 'linear-gradient(180deg, #10B981, #059669)'
                        : 'rgba(255,255,255,0.04)',
                      minHeight: '4px',
                    }} />
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{d.date}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <span>目标：每日至少学习 1 项内容</span>
              <span>本周完成 {weekData.filter(d => d.count > 0).length}/7 天</span>
            </div>
          </div>

          {/* 分类学习进度 */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-sm font-semibold text-white mb-4">📚 分类学习进度</div>
            {[
              { name: 'Prompt 注入', color: '#EF4444', done: 8, total: 35 },
              { name: '对抗攻击',   color: '#F59E0B', done: 5, total: 30 },
              { name: '模型安全',   color: '#3B82F6', done: 3, total: 42 },
              { name: '数据隐私',   color: '#8B5CF6', done: 2, total: 25 },
              { name: '合规治理',   color: '#10B981', done: 1, total: 22 },
              { name: '红队测试',   color: '#EC4899', done: 4, total: 28 },
            ].map(cat => (
              <div key={cat.name} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{cat.name}</span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{cat.done}/{cat.total}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((cat.done / cat.total) * 100, 100)}%`, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 成就徽章 ── */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BADGES.map(badge => (
            <div key={badge.id}
              className={`p-5 rounded-2xl text-center transition-all duration-300 ${
                badge.earned ? 'hover:-translate-y-1' : 'opacity-40'
              }`}
              style={{
                background: badge.earned ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                border: `1px solid ${badge.earned ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)'}`,
              }}>
              <div className="text-4xl mb-2">{badge.earned ? badge.icon : '🔒'}</div>
              <div className="text-sm font-bold text-white mb-1">{badge.name}</div>
              <div className="text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{badge.description}</div>
              {badge.earned && badge.earnedAt && (
                <div className="text-[10px]" style={{ color: '#10B981' }}>✅ 获得于 {badge.earnedAt}</div>
              )}
              {!badge.earned && (
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>未解锁</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 学习记录 ── */}
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

      {/* 设置入口 */}
      <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'settings' })}
          className="w-full py-3 rounded-xl text-xs cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
          ⚙️ 账户设置（即将推出）
        </button>
      </div>
    </div>
  );
};
