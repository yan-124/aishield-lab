import React from 'react';
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const steps = [
  { title: '基本信息', icon: '1' },
  { title: '你的身份', icon: '2' },
  { title: '学习目标', icon: '3' },
  { title: '完成', icon: '4' },
];

export const RegisterModal = () => {
  const { state, dispatch } = useAppContext();
  const [form, setForm] = useState<{ nickname: string; email: string; identity: string; goals: string[]; painPoint: string; password: string }>({ nickname: '', email: '', identity: '', goals: [], painPoint: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [slideDir, setSlideDir] = useState<1 | -1>(1);

  if (!state.showRegister) return null;

  const step = state.registerStep;

  const handleNext = async () => {
    if (step === 0) {
      const errors: { email?: string; password?: string } = {};
    if (!form.email.trim()) errors.email = '请输入邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = '邮箱格式不正确';
    if (!form.password) errors.password = '请输入密码';
    else if (form.password.length < 8) errors.password = '密码至少8位，需包含大小写字母、数字和特殊字符';
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) return;
    }
    if (step === 1 && !form.identity) {
      alert('请选择身份'); return;
    }
    if (step === 2 && form.goals.length === 0) {
      alert('请至少选一个方向'); return;
    }
    if (step < 3) {
      setSlideDir(1);
      dispatch({ type: 'SET_REGISTER_STEP', payload: step + 1 });
    } else {
        try {
          const resp = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ email: form.email, nickname: form.nickname || '安全探索者', password: form.password })
          });
          const data = await resp.json();
          if (resp.ok) {
            localStorage.setItem('aishield_token', data.token);
            localStorage.setItem('aishield_user', JSON.stringify({ ...data.user, token: data.token, isLoggedIn: true }));
            dispatch({ type: 'SET_USER', payload: { ...data.user, token: data.token, isLoggedIn: true } });
            dispatch({ type: 'HIDE_REGISTER' });
          } else {
            alert(data.error || '注册失败');
          }
        } catch {
          alert('网络异常，请检查连接');
        }
      }
  };

  const handleBack = () => {
    if (step > 0) {
      setSlideDir(-1);
      dispatch({ type: 'SET_REGISTER_STEP', payload: step - 1 });
    }
  };

  const toggleGoal = (goal: string) => {
    setForm(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) ? prev.goals.filter(g => g !== goal) : [...prev.goals, goal],
    }));
  };

  const switchToLogin = () => {
    dispatch({ type: 'HIDE_REGISTER' });
    dispatch({ type: 'SHOW_LOGIN' });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) dispatch({ type: 'HIDE_REGISTER' }); }}>
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0F1729 0%, #0C1027 100%)', border: '1px solid rgba(139,92,246,0.18)', boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,246,0.08)' }}
        onClick={e => e.stopPropagation()}>

        {/* Top gradient bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #10B981, #059669, #34D399)' }} />

        {/* Close button */}
        <button onClick={() => dispatch({ type: 'HIDE_REGISTER' })}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-white/5"
          style={{ color: '#64748B' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <div className="px-8 pt-8 pb-8">
          {/* Progress indicator */}
          <div className="flex items-center gap-1 mb-8">
            {steps.map((s, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-1.5 cursor-default">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    style={{
                      background: i < step ? 'linear-gradient(135deg, #10B981, #059669)' : i === step ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                      color: i < step ? 'white' : i === step ? '#A78BFA' : 'rgba(255,255,255,0.25)',
                      border: i === step ? '1px solid rgba(139,92,246,0.3)' : 'none',
                      boxShadow: i === step ? '0 0 12px rgba(139,92,246,0.15)' : 'none',
                    }}>
                    {i < step ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    ) : i + 1}
                  </div>
                  <span className="text-[10px] font-medium hidden sm:block"
                    style={{ color: i === step ? '#A78BFA' : 'rgba(255,255,255,0.25)' }}>
                    {s.title}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-px mx-1 transition-all duration-300"
                    style={{ background: i < step ? '#10B981' : 'rgba(255,255,255,0.06)' }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step content with slide animation */}
          <div className="min-h-[280px] relative">
            <div key={step} className="space-y-5 animate-in" style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>

              {step === 0 && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">👋 欢迎来到 AIShield Lab</h3>
                    <p className="text-sm" style={{ color: 'rgba(148,163,184,0.6)' }}>先简单介绍一下自己</p>
                  </div>
                  <input value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder="你的昵称（选填）"
                    className="w-full px-4 py-3 rounded-lg text-sm text-white outline-none transition-colors focus:outline-none"
                    style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <div>
                    <input value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setFieldErrors(prev => ({ ...prev, email: undefined })); }} placeholder="邮箱（必填）" type="email" required
                      className="w-full px-4 py-3 rounded-lg text-sm text-white outline-none transition-colors"
                      style={{ background: 'rgba(15,23,42,0.6)', border: fieldErrors.email ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)' }} />
                    {fieldErrors.email && <p className="text-xs mt-1" style={{ color: '#F87171' }}>{fieldErrors.email}</p>}
                  </div>
                  <div>
                    <div className="relative">
                      <input value={form.password} onChange={e => { setForm({ ...form, password: e.target.value }); setFieldErrors(prev => ({ ...prev, password: undefined })); }}
                        placeholder="密码（至少8位，含大小写字母、数字和特殊字符）" type={showPassword ? 'text' : 'password'} minLength={8}
                        className="w-full px-4 py-3 pr-10 rounded-lg text-sm text-white outline-none transition-colors"
                        style={{ background: 'rgba(15,23,42,0.6)', border: fieldErrors.password ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)' }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: '#64748B' }}>
                        {showPassword ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-xs mt-1" style={{ color: '#F87171' }}>{fieldErrors.password}</p>}
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">你目前是谁？</h3>
                    <p className="text-sm" style={{ color: 'rgba(148,163,184,0.6)' }}>帮我们为你推荐最合适的内容</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'student', emoji: '🧑‍🎓', label: '安全实验室新人', desc: '计算机/信息安全相关专业' },
                      { value: 'professional', emoji: '🛡️', label: '安全老兵', desc: 'IT/安全相关从业者' },
                      { value: 'career_change', emoji: '🚀', label: '转行探险家', desc: '想转行到AI安全领域' },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => setForm({ ...form, identity: opt.value })}
                        className="p-4 rounded-xl text-center cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                        style={{
                          background: form.identity === opt.value ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                          border: form.identity === opt.value ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.06)',
                          boxShadow: form.identity === opt.value ? '0 0 20px rgba(139,92,246,0.08)' : 'none',
                        }}>
                        <div className="text-2xl mb-2">{opt.emoji}</div>
                        <div className="text-xs font-medium" style={{ color: form.identity === opt.value ? '#A78BFA' : 'rgba(255,255,255,0.6)' }}>{opt.label}</div>
                        <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">你最想学什么？</h3>
                    <p className="text-sm" style={{ color: 'rgba(148,163,184,0.6)' }}>可多选，帮助我们推荐内容</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Prompt注入', '对抗攻击', '模型安全', '数据隐私', '合规治理', '红队测试', '安全审计', '威胁检测'].map(goal => (
                      <button key={goal} onClick={() => toggleGoal(goal)}
                        className="px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200"
                        style={{
                          background: form.goals.includes(goal) ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)',
                          border: form.goals.includes(goal) ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.06)',
                          color: form.goals.includes(goal) ? '#A78BFA' : 'rgba(255,255,255,0.45)',
                        }}>
                        {goal}
                      </button>
                    ))}
                  </div>
                  <textarea value={form.painPoint} onChange={e => setForm({ ...form, painPoint: e.target.value })} placeholder="你目前最大的痛点或困惑是什么？（选填）" rows={3}
                    className="w-full px-4 py-3 rounded-lg text-sm text-white outline-none resize-none transition-colors"
                    style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </>
              )}

              {step === 3 && (
                <div className="text-center py-8">
                  {/* Animated shield icon */}
                  <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(16,185,129,0.15))', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 0 40px rgba(139,92,246,0.12)' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#shieldGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <defs><linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A78BFA"/><stop offset="100%" stopColor="#10B981"/></linearGradient></defs>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">准备就绪！</h3>
                  <p className="text-sm mb-6" style={{ color: 'rgba(148,163,184,0.6)' }}>
                    {form.nickname || '新同学'}，欢迎加入 AIShield Lab
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {form.identity && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(139,92,246,0.08)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}>
                        {form.identity === 'student' ? '🧑‍🎓 实验室新人' : form.identity === 'professional' ? '🛡️ 安全老兵' : '🚀 转行探险家'}
                      </span>
                    )}
                    {form.goals.slice(0, 3).map(g => (
                      <span key={g} className="px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={handleBack} className="flex-1 px-4 py-2.5 rounded-lg text-sm cursor-pointer transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.06)' }}>
                上一步
              </button>
            )}
            <button onClick={handleNext} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #6366F1 100%)', color: 'white', boxShadow: '0 0 20px rgba(139,92,246,0.15)' }}>
              {step === 3 ? '🚀 开始学习' : '下一步'}
            </button>
          </div>

          {/* Footer */}
          {step === 0 && (
            <p className="mt-4 text-center text-xs" style={{ color: 'rgba(148,163,184,0.4)' }}>
              已有账号？{' '}
              <button onClick={switchToLogin} className="cursor-pointer transition-colors" style={{ color: '#A78BFA' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#C4B5FD')}
                onMouseLeave={e => (e.currentTarget.style.color = '#A78BFA')}>
                登录
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};