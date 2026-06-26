import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext'
import { authFetch } from '../services/authFetch';

export function LoginModal() {
  const { dispatch } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaEmail, setMfaEmail] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [pkLoading, setPkLoading] = useState(false);

  const handleClose = () => {
    setMfaStep(false);
    setMfaCode('');
    setBackupCode('');
    dispatch({ type: 'HIDE_LOGIN' });
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/auth/mfa/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mfaEmail, code: mfaCode, backupCode }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error === 'Invalid verification code' ? '\u9A8C\u8BC1\u7801\u9519\u8BEF\uFF0C\u8BF7\u91CD\u8BD5' : data.error || '\u9A8C\u8BC1\u5931\u8D25');
        return;
      }
      localStorage.setItem('aishield_token', data.token);
      localStorage.setItem('aishield_user', JSON.stringify({ ...data.user, token: data.token, isLoggedIn: true }));
      dispatch({ type: 'SET_USER', payload: { ...data.user, token: data.token, isLoggedIn: true } });
      dispatch({ type: 'HIDE_LOGIN' });
      fetch('/api/auth/stats/track', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event:'login' }) }).catch(() => {})
    } catch (err) {
      setError('\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u91CD\u8BD5');
    } finally {
      setLoading(false);
    }
  };


  const handlePasskeyLogin = async () => {
    if (!window.PublicKeyCredential) {
      setError('\u60A8\u7684\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 Passkey');
      return;
    }
    setPkLoading(true);
    setError('');
    try {
      const optResp = await fetch('/api/auth/passkey/authenticate-options', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const optData = await optResp.json();

      const publicKey: any = {
        challenge: Uint8Array.from(atob(optData.challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        rpId: optData.rpId,
        timeout: optData.timeout,
        userVerification: optData.userVerification,
        allowCredentials: [],
      };

      const credential = await navigator.credentials.get({ publicKey }) as PublicKeyCredential | null;
      if (!credential) { setPkLoading(false); return; }

      const response = credential.response as AuthenticatorResponse;
      const authResp = await fetch('/api/auth/passkey/authenticate-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: credential.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
          response: {
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array((response as any).clientDataJSON))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
            authenticatorData: btoa(String.fromCharCode(...new Uint8Array((response as any).authenticatorData))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
            signature: btoa(String.fromCharCode(...new Uint8Array((response as any).signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
          },
          challengeId: optData.challengeId,
        }),
      });

      const authData = await authResp.json();
      if (!authResp.ok) {
        setError(authData.error || 'Passkey \u767B\u5F55\u5931\u8D25');
        return;
      }

      localStorage.setItem('aishield_token', authData.token);
      localStorage.setItem('aishield_user', JSON.stringify({ ...authData.user, token: authData.token, isLoggedIn: true }));
      dispatch({ type: 'SET_USER', payload: { ...authData.user, token: authData.token, isLoggedIn: true } });
      dispatch({ type: 'HIDE_LOGIN' });
    } catch (err: any) {
      if (err.name === 'NotAllowedError') { /* user cancelled */ }
      else { setError('Passkey \u767B\u5F55\u5931\u8D25'); }
    } finally {
      setPkLoading(false);
    }
  };

  const switchToRegister = () => {
    dispatch({ type: 'HIDE_LOGIN' });
    dispatch({ type: 'SHOW_REGISTER' });
  };

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = '\u8BF7\u8F93\u5165\u90AE\u7BB1\u5730\u5740';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '\u90AE\u7BB1\u683C\u5F0F\u4E0D\u6B63\u786E';
    }
    if (!password) {
      errors.password = '\u8BF7\u8F93\u5165\u5BC6\u7801';
    } else if (password.length < 6) {
      errors.password = '\u5BC6\u7801\u81F3\u5C116\u4F4D';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (resp.status === 401) {
          setError('\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF\uFF0C\u8BF7\u91CD\u8BD5');
        } else if (resp.status === 429) {
          setError('\u5C1D\u8BD5\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5');
        } else if (resp.status === 404) {
          setError('\u8D26\u53F7\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5148\u6CE8\u518C');
        } else {
          setError(data.error || '\u767B\u5F55\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5');
        }
        return;
      }

      if (data.mfaRequired) {
        setMfaEmail(email);
        setMfaStep(true);
        setLoading(false);
        return;
      }

      localStorage.setItem('aishield_token', data.token);
      localStorage.setItem('aishield_user', JSON.stringify({ ...data.user, token: data.token, isLoggedIn: true }));

      dispatch({ type: 'SET_USER', payload: { ...data.user, token: data.token, isLoggedIn: true } });
      dispatch({ type: 'HIDE_LOGIN' });
      fetch('/api/auth/stats/track', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event:'login' }) }).catch(() => {})
    } catch (err) {
      setError('\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u68C0\u67E5\u8FDE\u63A5\u540E\u91CD\u8BD5');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={handleClose}>
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden animate-scale"
        style={{ background: 'linear-gradient(180deg, #0F1729 0%, #0C1027 100%)', border: '1px solid rgba(139,92,246,0.18)', boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,246,0.08)' }}
        onClick={e => e.stopPropagation()}>

        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #8B5CF6, #6366F1, #3B82F6)' }} />

        <button onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-white/5"
          style={{ color: '#64748B' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <div className="px-8 pt-8 pb-8">
          {mfaStep ? (
            <>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.15))', border: '1px solid rgba(139,92,246,0.2)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white text-center mb-1">{'\u4E8C\u6B65\u9A8C\u8BC1'}</h2>
              <p className="text-sm text-center mb-6" style={{ color: 'rgba(148,163,184,0.7)' }}>
                {'\u8BF7\u8F93\u5165\u9A8C\u8BC1\u5668\u4E2D\u76846\u4F4D\u6570\u5B57'}
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg text-sm flex items-start gap-2"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleMfaVerify} className="space-y-4">
                {!useBackup ? (
                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: '#94A3B8' }}>{'\u9A8C\u8BC1\u7801'}</label>
                    <input
                      type="text"
                      value={mfaCode}
                      onChange={e => { setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                      className="w-full px-4 py-3 rounded-lg text-white text-2xl text-center tracking-[0.5em] font-mono transition-colors focus:outline-none"
                      style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(139,92,246,0.3)', color: '#E2E8F0' }}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: '#94A3B8' }}>{'\u5907\u7528\u7801'}</label>
                    <input
                      type="text"
                      value={backupCode}
                      onChange={e => { setBackupCode(e.target.value.toUpperCase().slice(0, 8)); setError(''); }}
                      placeholder="XXXXXXXX"
                      maxLength={8}
                      autoFocus
                      className="w-full px-4 py-3 rounded-lg text-white text-lg text-center tracking-[0.3em] font-mono transition-colors focus:outline-none"
                      style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(139,92,246,0.3)', color: '#E2E8F0' }}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (!useBackup ? mfaCode.length !== 6 : backupCode.length !== 8)}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #6366F1 100%)', color: 'white', boxShadow: '0 0 20px rgba(139,92,246,0.2)' }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      {'\u9A8C\u8BC1\u4E2D...'}
                    </span>
                  ) : '\u9A8C\u8BC1'}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-center gap-3">
                <button onClick={() => { setUseBackup(!useBackup); setMfaCode(''); setBackupCode(''); setError(''); }}
                  className="text-xs cursor-pointer transition-colors" style={{ color: '#A78BFA' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#C4B5FD')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#A78BFA')}>
                  {useBackup ? '\u4F7F\u7528\u9A8C\u8BC1\u7801' : '\u4F7F\u7528\u5907\u7528\u7801'}
                </button>
                <span style={{ color: 'rgba(100,116,139,0.3)' }}>|</span>
                <button onClick={() => { setMfaStep(false); setMfaCode(''); setBackupCode(''); setError(''); }}
                  className="text-xs cursor-pointer transition-colors" style={{ color: '#64748B' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#94A3B8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}>
                  {'\u8FD4\u56DE\u767B\u5F55'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.15))', border: '1px solid rgba(139,92,246,0.2)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>

              <h2 className="text-xl font-bold text-white text-center mb-1">{'\u6B22\u8FCE\u56DE\u6765'}</h2>
              <p className="text-sm text-center mb-6" style={{ color: 'rgba(148,163,184,0.7)' }}>
                {'\u767B\u5F55 AIShield Lab\uFF0C\u7EE7\u7EED\u4F60\u7684\u5B89\u5168\u4E4B\u65C5'}
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg text-sm flex items-start gap-2"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2.5 mb-5">
                <button type="button" onClick={() => { setError('GitHub \u767B\u5F55\u5373\u5C06\u4E0A\u7EBF\uFF0C\u8BF7\u4F7F\u7528\u90AE\u7BB1\u767B\u5F55') }}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg text-sm cursor-pointer transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E2E8F0' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  {'\u4F7F\u7528 GitHub \u767B\u5F55'}
                </button>
                <button type="button" onClick={() => { setError('Google \u767B\u5F55\u5373\u5C06\u4E0A\u7EBF\uFF0C\u8BF7\u4F7F\u7528\u90AE\u7BB1\u767B\u5F55') }}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg text-sm cursor-pointer transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E2E8F0' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  {'\u4F7F\u7528 Google \u767B\u5F55'}
                </button>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs" style={{ color: 'rgba(148,163,184,0.5)' }}>{'\u6216\u4F7F\u7528\u90AE\u7BB1'}</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: '#94A3B8' }}>{'\u90AE\u7BB1'}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: undefined })); }}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-2.5 rounded-lg text-white text-sm transition-colors focus:outline-none"
                    style={{ background: 'rgba(15,23,42,0.6)', border: fieldErrors.email ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)', color: '#E2E8F0' }}
                  />
                  {fieldErrors.email && <p className="text-xs mt-1" style={{ color: '#F87171' }}>{fieldErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-1.5" style={{ color: '#94A3B8' }}>{'\u5BC6\u7801'}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: undefined })); }}
                      placeholder={'\u81F3\u5C116\u4F4D\u5B57\u7B26'}
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 pr-10 rounded-lg text-white text-sm transition-colors focus:outline-none"
                      style={{ background: 'rgba(15,23,42,0.6)', border: fieldErrors.password ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)', color: '#E2E8F0' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                      style={{ color: '#64748B' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#94A3B8')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}>
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-xs mt-1" style={{ color: '#F87171' }}>{fieldErrors.password}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #6366F1 100%)', color: 'white', boxShadow: '0 0 20px rgba(139,92,246,0.2)' }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      {'\u767B\u5F55\u4E2D...'}
                    </span>
                  ) : '\u767B\u5F55'}
                </button>
              </form>

              <p className="mt-5 text-center text-xs" style={{ color: 'rgba(148,163,184,0.5)' }}>
                {'\u8FD8\u6CA1\u6709\u8D26\u53F7\uFF1F'}{' '}
                <button onClick={switchToRegister} className="cursor-pointer transition-colors" style={{ color: '#A78BFA' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#C4B5FD')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#A78BFA')}>
                  {'\u7ACB\u5373\u6CE8\u518C'}
                </button>
              </p>

              <p className="mt-3 text-center text-xs" style={{ color: 'rgba(100,116,139,0.4)' }}>
                {'\u7EE7\u7EED\u5373\u8868\u793A\u540C\u610F'}<a href="/privacy" style={{ color: '#64748B' }}>{'\u7528\u6237\u534F\u8BAE'}</a> {'\u548C'}<a href="/privacy" style={{ color: '#64748B' }}>{'\u9690\u79C1\u653F\u7B56'}</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
