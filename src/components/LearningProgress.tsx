import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { LearningRecord } from '../types';

const CATEGORIES = [
  { id: 'prompt-injection', name: 'Prompt 注入', color: '#EF4444', total: 35 },
  { id: 'adversarial',     name: '对抗攻击',   color: '#F59E0B', total: 30 },
  { id: 'model-safety',     name: '模型安全',   color: '#3B82F6', total: 42 },
  { id: 'data-privacy',     name: '数据隐私',   color: '#8B5CF6', total: 25 },
  { id: 'compliance',       name: '合规治理',   color: '#10B981', total: 22 },
  { id: 'red-team',         name: '红队测试',   color: '#EC4899', total: 28 },
];

// 模拟学习记录（localStorage 持久化）
function loadLearningData(): { completedArticles: string[]; learningRecords: LearningRecord[]; dailyGoal: number } {
  try {
    const a = localStorage.getItem('aishield-completed-articles');
    const r = localStorage.getItem('aishield-learning-records');
    const g = localStorage.getItem('aishield-daily-goal');
    return {
      completedArticles: a ? JSON.parse(a) : [],
      learningRecords: r ? JSON.parse(r) : [],
      dailyGoal: g ? Number(g) : 30, // 默认30分钟
    };
  } catch {
    return { completedArticles: [], learningRecords: [], dailyGoal: 30 };
  }
}



export const LearningProgress = () => {
  const { dispatch } = useAppContext();
  const [data, setData] = useState(loadLearningData);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [goalInput, setGoalInput] = useState(String(data.dailyGoal));
  const hasMounted = useRef(false);

  useEffect(() => { hasMounted.current = true; }, []);

  // 今日已学时间（模拟：根据 completedArticles 长度估算）
  const todayMinutes = data.completedArticles.filter(() => true).length * 8; // 每篇约8分钟

  // 连续学习天数
  const streak = (() => {
    const days = new Set(data.learningRecords.map(r => r.date));
    let s = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().split('T')[0];
      if (days.has(key)) { s++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return s;
  })();

  // 本周热力图数据（最近 7 天）
  const weekData = (() => {
    const result: { date: string; minutes: number }[] = [];
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(d);
      dt.setDate(dt.getDate() - i);
      const key = `${dt.getMonth() + 1}/${dt.getDate()}`;
      const mins = data.learningRecords
        .filter(r => r.date === dt.toISOString().split('T')[0])
        .reduce((s, r) => s + r.duration, 0);
      result.push({ date: key, minutes: mins });
    }
    return result;
  })();

  const maxMinutes = Math.max(...weekData.map(d => d.minutes), 1);

  // 各类别完成数（模拟：根据 completedArticles 随机分配）
  const catProgress = CATEGORIES.map(cat => {
    const done = Math.min(
      Math.floor(data.completedArticles.length * (cat.total / 182) * 2),
      cat.total
    );
    return { ...cat, done };
  });

  const handleSaveGoal = () => {
    const g = Math.max(10, Math.min(120, Number(goalInput) || 30));
    setData(d => ({ ...d, dailyGoal: g }));
    localStorage.setItem('aishield-daily-goal', String(g));
    setShowGoalEditor(false);
  };

  const goalPercent = Math.min(Math.round((todayMinutes / data.dailyGoal) * 100), 100);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* 返回 */}
      <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })}
        className="text-xs cursor-pointer flex items-center gap-1"
        style={{ color: '#10B981' }}>
        ← 返回首页
      </button>

      <h1 className="text-2xl font-black text-white">📊 我的学习进度</h1>

      {/* 今日目标 */}
      <div className="rounded-3xl p-6"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.08))', border: '1px solid rgba(16,185,129,0.12)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-white mb-1">🎯 今日学习目标</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              已完成 {todayMinutes} / {data.dailyGoal} 分钟
            </div>
          </div>
          <button onClick={() => setShowGoalEditor(!showGoalEditor)}
            className="text-[10px] px-3 py-1 rounded-lg cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            ⚙️ 修改目标
          </button>
        </div>
        {showGoalEditor && (
          <div className="flex items-center gap-2 mb-4">
            <input value={goalInput} onChange={e => setGoalInput(e.target.value)}
              type="number" min={10} max={120} step={5}
              className="w-24 px-3 py-1.5 rounded-lg text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(16,185,129,0.2)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>分钟/天</span>
            <button onClick={handleSaveGoal}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              style={{ background: '#10B981', color: 'white' }}>保存</button>
          </div>
        )}
        <div className="h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-700 flex items-center justify-center"
            style={{
              width: `${goalPercent}%`,
              background: goalPercent >= 100
                ? 'linear-gradient(90deg, #10B981, #059669)'
                : goalPercent >= 60
                ? 'linear-gradient(90deg, #10B981, #3B82F6)'
                : 'linear-gradient(90deg, #10B981, #F59E0B)',
            }}>
            {goalPercent >= 30 && (
              <span className="text-[10px] font-bold text-white">{goalPercent}%</span>
            )}
          </div>
        </div>
        {goalPercent >= 100 && (
          <div className="mt-3 text-xs font-semibold" style={{ color: '#10B981' }}>
            🎉 恭喜！今日学习目标已完成！
          </div>
        )}
      </div>

      {/* 连续学习 & 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: '🔥', label: '连续学习', value: `${streak}天`, color: '#EF4444' },
          { icon: '📖', label: '完成文章', value: data.completedArticles.length, color: '#10B981' },
          { icon: '🎯', label: '通关关卡', value: '2', color: '#3B82F6' },
          { icon: '⏱️', label: '总学习时长', value: `${data.learningRecords.reduce((s, r) => s + r.duration, 0)}m`, color: '#F59E0B' },
        ].map(stat => (
          <div key={stat.label} className="p-4 rounded-2xl text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 本周热力图 */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-sm font-semibold text-white mb-4">📅 本周学习时间</div>
        <div className="flex items-end gap-2 h-28">
          {weekData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-lg transition-all duration-500"
                style={{
                  height: `${Math.max((d.minutes / maxMinutes) * 100, 3)}%`,
                  background: d.minutes > 0
                    ? 'linear-gradient(180deg, #10B981, #059669)'
                    : 'rgba(255,255,255,0.03)',
                  minHeight: '4px',
                }} />
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{d.date}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <span>🟢 已学习  &nbsp; ⚪ 未学习</span>
          <span>本周总时长：{weekData.reduce((s, d) => s + d.minutes, 0)} 分钟</span>
        </div>
      </div>

      {/* 分类进度 */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-sm font-semibold text-white mb-4">📚 分类学习进度</div>
        <div className="space-y-3">
          {catProgress.map(cat => {
            const pct = Math.round((cat.done / cat.total) * 100);
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{cat.name}</span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{cat.done}/{cat.total}（{pct}%）</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 提示 */}
      <div className="rounded-xl p-4 text-xs" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', color: 'rgba(255,255,255,0.5)' }}>
        💡 学习进度会自动保存到浏览器本地。清除浏览器数据会导致进度丢失。未来版本将支持云端同步。
      </div>
    </div>
  );
};
