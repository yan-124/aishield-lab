import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const steps = [
  { title: '基本信息', desc: '告诉我们你是谁' },
  { title: '你的身份', desc: '学生还是职场人' },
  { title: '学习目标', desc: '你最想学什么' },
  { title: '完成', desc: '开启你的AI安全之旅' },
];

export const RegisterModal = () => {
  const { state, dispatch } = useAppContext();
  const [form, setForm] = useState<{ nickname: string; email: string; identity: string; goals: string[]; painPoint: string }>({ nickname: '', email: '', identity: '', goals: [], painPoint: '' });

  if (!state.showRegister) return null;

  const step = state.registerStep;

  const handleNext = () => {
    if (step < 3) {
      dispatch({ type: 'SET_REGISTER_STEP', payload: step + 1 });
    } else {
      dispatch({ type: 'SET_USER', payload: { id: Date.now().toString(), nickname: form.nickname || '学员', email: form.email || '', identity: form.identity as any, goals: form.goals } });
      dispatch({ type: 'HIDE_REGISTER' });
    }
  };

  const handleBack = () => {
    if (step > 0) dispatch({ type: 'SET_REGISTER_STEP', payload: step - 1 });
  };

  const toggleGoal = (goal: string) => {
    setForm(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) ? prev.goals.filter(g => g !== goal) : [...prev.goals, goal],
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) dispatch({ type: 'HIDE_REGISTER' }); }}>
      <div className="w-full max-w-lg rounded-2xl p-6 space-y-6 relative"
        style={{ background: '#0F1629', border: '1px solid rgba(16,185,129,0.15)' }}
        onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button onClick={() => dispatch({ type: 'HIDE_REGISTER' })} className="absolute top-4 right-4 text-white/30 hover:text-white/60 cursor-pointer">✕</button>

        {/* Progress */}
        <div className="flex items-center justify-between gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 text-center">
              <div className="flex items-center gap-1">
                <div className="flex-1 h-0.5 rounded-full" style={{ background: i <= step ? '#10B981' : 'rgba(255,255,255,0.08)' }} />
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: i < step ? '#10B981' : i === step ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)', color: i <= step ? '#10B981' : 'rgba(255,255,255,0.3)' }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <div className="flex-1 h-0.5 rounded-full" style={{ background: i < step ? '#10B981' : 'rgba(255,255,255,0.08)' }} />
              </div>
              <div className="text-[10px] mt-1" style={{ color: i === step ? '#10B981' : 'rgba(255,255,255,0.3)' }}>{s.title}</div>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[240px]">
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">👋 欢迎来到 AIShield Lab</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>先简单介绍一下自己</p>
              <input value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder="你的昵称"
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-1"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', '--tw-ring-color': '#10B981' } as any} />
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="邮箱（可选）" type="email"
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-1"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', '--tw-ring-color': '#10B981' } as any} />
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">你目前是谁？</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'student', label: '🎓 在校学生', desc: '计算机/信息安全相关专业' },
                  { value: 'professional', label: '💼 职场人', desc: 'IT/安全相关从业者' },
                  { value: 'career_change', label: '🔄 转行者', desc: '想转型到AI安全领域' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setForm({ ...form, identity: opt.value })}
                    className="p-4 rounded-xl text-center cursor-pointer transition-all duration-200"
                    style={{
                      background: form.identity === opt.value ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                      border: form.identity === opt.value ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    }}>
                    <div className="text-xl mb-2">{opt.label.split(' ')[0]}</div>
                    <div className="text-xs font-medium text-white/70">{opt.label.split(' ')[1]}</div>
                    <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">你最想学什么？</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>可多选，帮助我们推荐内容</p>
              <div className="flex flex-wrap gap-2">
                {['Prompt注入', '对抗攻击', '模型安全', '数据隐私', '合规治理', '红队测试', '安全审计', '威胁检测'].map(goal => (
                  <button key={goal} onClick={() => toggleGoal(goal)}
                    className="px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
                    style={{
                      background: form.goals.includes(goal) ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                      border: form.goals.includes(goal) ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.06)',
                      color: form.goals.includes(goal) ? '#10B981' : 'rgba(255,255,255,0.5)',
                    }}>
                    {goal}
                  </button>
                ))}
              </div>
              <textarea value={form.painPoint} onChange={e => setForm({ ...form, painPoint: e.target.value })} placeholder="你目前最大的痛点或困惑是什么？（选填）" rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none resize-none focus:ring-1"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', '--tw-ring-color': '#10B981' } as any} />
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4 text-center py-6">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-white">准备就绪！</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {form.nickname || '学员'}，欢迎加入 AIShield Lab
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {form.identity && (
                  <span className="px-3 py-1 rounded-full text-xs" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                    {form.identity === 'student' ? '🎓 学生' : form.identity === 'professional' ? '💼 职场人' : '🔄 转行者'}
                  </span>
                )}
                {form.goals.slice(0, 3).map(g => (
                  <span key={g} className="px-3 py-1 rounded-full text-xs" style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)' }}>
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={handleBack} className="flex-1 px-4 py-2.5 rounded-xl text-sm cursor-pointer transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
              上一步
            </button>
          )}
          <button onClick={handleNext} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all"
            style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white' }}>
            {step === 3 ? '🚀 开始学习' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
};
