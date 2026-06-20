import React, { useState } from 'react';

interface LoginModalProps {
  onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8001';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = mode === 'login'
        ? `${API_BASE}/api/auth/login`
        : `${API_BASE}/api/auth/register`;
      
      const body: Record<string, string> = { email, password };
      if (mode === 'register') {
        body.nickname = nickname || '创作者';
      }

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.detail || '操作失败');
      }

      // 保存 token 和用户信息
      localStorage.setItem('wuliao-studio_token', data.token);
      localStorage.setItem('wuliao-studio_user', JSON.stringify(data.user));
      
      // 刷新页面以更新状态
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#334155]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {mode === 'login' ? '欢迎回来' : '加入五迷工坊'}
          </h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-white transition-colors text-2xl leading-none">
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-[#0F172A] rounded-lg p-1">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'login'
                ? 'bg-[#3B82F6] text-white shadow-lg'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'register'
                ? 'bg-[#3B82F6] text-white shadow-lg'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            注册
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="你的昵称"
                className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-white placeholder-[#64748B] focus:border-[#3B82F6] focus:outline-none transition-colors"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1.5">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-white placeholder-[#64748B] focus:border-[#3B82F6] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-[#94A3B8] mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="至少6位字符"
              required
              minLength={6}
              className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-white placeholder-[#64748B] focus:border-[#3B82F6] focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-[#64748B]">
          继续即表示同意
          <a href="/privacy" className="text-[#3B82F6] hover:underline ml-1">用户协议</a>
          和
          <a href="/privacy" className="text-[#3B82F6] hover:underline ml-1">隐私政策</a>
        </p>
      </div>
    </div>
  );
}
