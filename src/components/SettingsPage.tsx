import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { ArrowLeft, User, Shield, Bell, LogOut, Save, Check } from 'lucide-react'

export const SettingsPage = () => {
  const { state, dispatch } = useAppContext()
  const user = state.user
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [saved, setSaved] = useState(false)
  const [notifNewPost, setNotifNewPost] = useState(true)
  const [notifComment, setNotifComment] = useState(true)
  const [notifSystem, setNotifSystem] = useState(false)

  const [mfaSetupStep, setMfaSetupStep] = useState(0)
  const [mfaSecret, setMfaSecret] = useState('')
  const [mfaQrData, setMfaQrData] = useState('')
  const [mfaVerifyCode, setMfaVerifyCode] = useState('')
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([])
  const [mfaDisablePw, setMfaDisablePw] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaError, setMfaError] = useState('')
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)
  const [passkeys, setPasskeys] = useState<{id:string;name:string;createdAt:string}[]>([])
  const [pkRegLoading, setPkRegLoading] = useState(false)
  const [pkError, setPkError] = useState('')

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-white mb-2">请先登录</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
          登录后即可管理账户设置
        </p>
        <button onClick={() => dispatch({ type: 'SHOW_REGISTER' })}
          className="px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
          注册 / 登录
        </button>
      </div>
    )
  }

  const handleSave = () => {
    dispatch({ type: 'SET_USER', payload: { ...user, nickname } })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogout = () => {
    dispatch({ type: 'SET_USER', payload: null })
    dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })
  }

  const handleMfaSetup = async () => {
    setMfaLoading(true)
    setMfaError('')
    try {
      const token = localStorage.getItem('aishield_token')
      const resp = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
      })
      const data = await resp.json()
      if (!resp.ok) {
        setMfaError(data.error || '设置失败')
        return
      }
      setMfaSecret(data.secret)
      setMfaQrData(data.qrData)
      setMfaSetupStep(1)
    } catch {
      setMfaError('网络异常')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleMfaVerify = async () => {
    if (mfaVerifyCode.length !== 6) return
    setMfaLoading(true)
    setMfaError('')
    try {
      const token = localStorage.getItem('aishield_token')
      const resp = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
        body: JSON.stringify({ code: mfaVerifyCode }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setMfaError(data.error === 'Invalid verification code' ? '验证码错误，请重试' : data.error || '验证失败')
        return
      }
      setMfaBackupCodes(data.backupCodes || [])
      setMfaSetupStep(3)
      dispatch({ type: 'SET_USER', payload: { ...user, mfaEnabled: true } })
      localStorage.setItem('aishield_user', JSON.stringify({ ...user, mfaEnabled: true }))
    } catch {
      setMfaError('网络异常')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleMfaDisable = async () => {
    if (!mfaDisablePw) return
    setMfaLoading(true)
    setMfaError('')
    try {
      const token = localStorage.getItem('aishield_token')
      const resp = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
        body: JSON.stringify({ password: mfaDisablePw }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setMfaError(data.error === 'Invalid password' ? '密码错误' : data.error || '关闭失败')
        return
      }
      dispatch({ type: 'SET_USER', payload: { ...user, mfaEnabled: false } })
      localStorage.setItem('aishield_user', JSON.stringify({ ...user, mfaEnabled: false }))
      setMfaDisablePw('')
    } catch {
      setMfaError('网络异常')
    } finally {
      setMfaLoading(false)
    }
  }


  const loadPasskeys = async () => {
    try {
      const token = localStorage.getItem('aishield_token')
      const resp = await fetch('/api/auth/passkey/list', { headers: { 'Authorization': 'Bearer ' + (token || '') } })
      const data = await resp.json()
      if (resp.ok) setPasskeys(data.credentials || [])
    } catch {}
  }

  const handlePasskeyRegister = async () => {
    if (!window.PublicKeyCredential) { setPkError('您的浏览器不支持 Passkey'); return }
    setPkRegLoading(true)
    setPkError('')
    try {
      const token = localStorage.getItem('aishield_token')
      const optResp = await fetch('/api/auth/passkey/register-options', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') }
      })
      const optData = await optResp.json()
      if (!optResp.ok) { setPkError(optData.error || '获取注册信息失败'); return }

      const publicKey: any = {
        challenge: Uint8Array.from(atob(optData.challenge.replace(/-/g, '+').replace(/_/g, '/')), (c: string) => c.charCodeAt(0)),
        rp: optData.rp,
        user: { ...optData.user, id: Uint8Array.from(atob(optData.user.id.replace(/-/g, '+').replace(/_/g, '/')), (c: string) => c.charCodeAt(0)) },
        pubKeyCredParams: optData.pubKeyCredParams,
        timeout: optData.timeout,
        attestation: optData.attestation,
        authenticatorSelection: optData.authenticatorSelection,
      }

      const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential | null
      if (!credential) { setPkRegLoading(false); return }

      const response = credential.response as any
      const regResp = await fetch('/api/auth/passkey/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
        body: JSON.stringify({
          id: credential.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
          response: {
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
            attestationObject: btoa(String.fromCharCode(...new Uint8Array(response.attestationObject))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
          },
        }),
      })
      const regData = await regResp.json()
      if (!regResp.ok) { setPkError(regData.error || '注册失败'); return }
      fetch('/api/auth/stats/track', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event:'passkey_register' }) }).catch(() => {})
      loadPasskeys()
    } catch (err: any) {
      if (err.name === 'NotAllowedError') { /* cancelled */ }
      else { setPkError('注册 Passkey 失败') }
    } finally {
      setPkRegLoading(false)
    }
  }

  const handlePasskeyDelete = async (credId: string) => {
    try {
      const token = localStorage.getItem('aishield_token')
      const resp = await fetch('/api/auth/passkey/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
        body: JSON.stringify({ credentialId: credId }),
      })
      if (resp.ok) loadPasskeys()
    } catch {}
  }

  // Load passkeys on mount
  if (user && passkeys.length === 0) { loadPasskeys() }

  const isMfaEnabled = !!user.mfaEnabled

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'user-profile' })}
        className="text-xs cursor-pointer flex items-center gap-1" style={{ color: '#10B981' }}>
        <ArrowLeft size={14} /> 返回个人中心
      </button>

      <h1 className="text-2xl font-black text-white">账户设置</h1>

      {/* Profile section */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-5">
          <User size={16} style={{ color: '#A78BFA' }} />
          <h2 className="text-sm font-bold text-white">个人信息</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] block mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>昵称</label>
            <input value={nickname} onChange={e => setNickname(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
          </div>
          <div>
            <label className="text-[11px] block mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>邮箱</label>
            <input value={user.email} disabled
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }} />
          </div>
          <div>
            <label className="text-[11px] block mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>身份</label>
            <div className="flex gap-2">
              {(['student', 'professional', 'career_change'] as const).map(id => (
                <button key={id} onClick={() => dispatch({ type: 'SET_USER', payload: { ...user, identity: id } })}
                  className="px-3 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all"
                  style={{
                    background: user.identity === id ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                    color: user.identity === id ? '#A78BFA' : 'rgba(255,255,255,0.4)',
                    border: '1px solid ' + (user.identity === id ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.06)'),
                  }}>
                  {id === 'student' ? '🎓 学生' : id === 'professional' ? '💼 从业者' : '🔄 转行者'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
            style={{
              background: saved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #10B981, #059669)',
              color: saved ? '#10B981' : 'white',
            }}>
            {saved ? <><Check size={14} /> 已保存</> : <><Save size={14} /> 保存修改</>}
          </button>
        </div>
      </div>

      {/* Notification section */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-5">
          <Bell size={16} style={{ color: '#FBBF24' }} />
          <h2 className="text-sm font-bold text-white">通知偏好</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: '社区新动态', desc: '有新帖子发布时通知', value: notifNewPost, setter: setNotifNewPost },
            { label: '评论回复', desc: '有人回复你的帖子或评论时通知', value: notifComment, setter: setNotifComment },
            { label: '系统通知', desc: '平台更新、活动通知', value: notifSystem, setter: setNotifSystem },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div>
                <div className="text-xs text-white">{item.label}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.desc}</div>
              </div>
              <button onClick={() => item.setter(!item.value)}
                className="w-9 h-5 rounded-full cursor-pointer transition-all relative"
                style={{ background: item.value ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)' }}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{
                    left: item.value ? '18px' : '2px',
                    background: item.value ? '#10B981' : 'rgba(255,255,255,0.3)',
                  }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MFA / Two-Factor Auth Section */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="flex items-center gap-2 mb-5">
          <Shield size={16} style={{ color: '#A78BFA' }} />
          <h2 className="text-sm font-bold text-white">二步验证 (MFA)</h2>
          {isMfaEnabled && mfaSetupStep === 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>已开启</span>
          )}
        </div>

        {mfaError && (
          <div className="mb-3 p-2.5 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
            {mfaError}
          </div>
        )}

        {!isMfaEnabled && mfaSetupStep === 0 && (
          <div>
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
              启用二步验证后，登录时需要额外输入验证器中的动态验证码，大幅提升账户安全性。
            </p>
            <button onClick={handleMfaSetup} disabled={mfaLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #A78BFA, #6366F1)', color: 'white' }}>
              <Shield size={14} /> {mfaLoading ? '加载中...' : '开启二步验证'}
            </button>
          </div>
        )}

        {!isMfaEnabled && mfaSetupStep === 1 && (
          <div className="space-y-4">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              1. 使用验证器 App（如 Google Authenticator）扫描下方二维码
            </p>
            <div className="flex justify-center">
              <div className="p-3 rounded-xl" style={{ background: 'white' }}>
                <img src={'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(mfaQrData)}
                  alt="MFA QR Code" width={180} height={180} />
              </div>
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                2. 若无法扫描，手动输入密钥：
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg text-xs font-mono tracking-wider"
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', color: '#A78BFA' }}>
                  {mfaSecret}
                </code>
                <button onClick={() => { navigator.clipboard.writeText(mfaSecret); setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2000); }}
                  className="px-3 py-2 rounded-lg text-[10px] cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.06)', color: copiedSecret ? '#10B981' : 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {copiedSecret ? '已复制' : '复制'}
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                3. 输入验证器中显示的6位数字：
              </p>
              <div className="flex gap-2">
                <input type="text" value={mfaVerifyCode} onChange={e => setMfaVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" maxLength={6}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono tracking-widest text-center outline-none"
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(139,92,246,0.3)', color: '#E2E8F0' }} />
                <button onClick={handleMfaVerify} disabled={mfaLoading || mfaVerifyCode.length !== 6}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #A78BFA, #6366F1)', color: 'white' }}>
                  {mfaLoading ? '验证中...' : '验证'}
                </button>
              </div>
            </div>
            <button onClick={() => { setMfaSetupStep(0); setMfaError(''); }}
              className="text-[10px] cursor-pointer" style={{ color: '#64748B' }}>
              取消
            </button>
          </div>
        )}

        {!isMfaEnabled && mfaSetupStep === 3 && mfaBackupCodes.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold" style={{ color: '#10B981' }}>✅ 二步验证已开启！</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              请妥善保存以下备用码，丢失验证器时可用来登录。每个备用码仅可使用一次。
            </p>
            <div className="grid grid-cols-2 gap-2">
              {mfaBackupCodes.map((code, i) => (
                <code key={i} className="px-3 py-1.5 rounded-lg text-xs font-mono text-center"
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', color: '#FBBF24' }}>
                  {code}
                </code>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(mfaBackupCodes.join('\n')); setCopiedCodes(true); setTimeout(() => setCopiedCodes(false), 2000); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.06)', color: copiedCodes ? '#10B981' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                📋 {copiedCodes ? '已复制' : '复制全部备用码'}
              </button>
              <button onClick={() => { setMfaSetupStep(0); setMfaBackupCodes([]); }}
                className="text-xs cursor-pointer px-4 py-2 rounded-xl font-semibold"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                完成
              </button>
            </div>
          </div>
        )}

        {isMfaEnabled && mfaSetupStep === 0 && (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              账户已启用二步验证。关闭需要验证当前密码。
            </p>
            <div className="flex gap-2">
              <input type="password" value={mfaDisablePw} onChange={e => setMfaDisablePw(e.target.value)}
                placeholder="输入当前密码" className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', color: '#E2E8F0' }} />
              <button onClick={handleMfaDisable} disabled={mfaLoading || !mfaDisablePw}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                {mfaLoading ? '...' : '关闭'}
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Passkey Section */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.12)' }}>
        <div className="flex items-center gap-2 mb-5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <h2 className="text-sm font-bold text-white">Passkey</h2>
          {passkeys.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>{passkeys.length} 个已注册</span>
          )}
        </div>

        {pkError && (
          <div className="mb-3 p-2.5 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
            {pkError}
          </div>
        )}

        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Passkey 是基于设备的免密码认证，使用指纹/Face ID 即可登录，无需输入密码。
        </p>

        {passkeys.length > 0 && (
          <div className="space-y-2 mb-4">
            {passkeys.map((pk) => (
              <div key={pk.id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <div>
                    <div className="text-xs text-white">{pk.name}</div>
                    <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{pk.createdAt?.split('T')[0]}</div>
                  </div>
                </div>
                <button onClick={() => handlePasskeyDelete(pk.id)}
                  className="text-[10px] px-2 py-1 rounded-lg cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.06)', color: '#F87171', border: '1px solid rgba(239,68,68,0.1)' }}>
                  删除
                </button>
              </div>
            ))}
          </div>
        )}

        <button onClick={handlePasskeyRegister} disabled={pkRegLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #60A5FA, #3B82F6)', color: 'white' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          {pkRegLoading ? '请稍候...' : '添加 Passkey'}
        </button>
      </div>

      {/* Privacy section */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-5">
          <Shield size={16} style={{ color: '#60A5FA' }} />
          <h2 className="text-sm font-bold text-white">隐私与安全</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-xs text-white">学习数据可见性</div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>控制其他用户能否查看你的学习记录</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>仅自己可见</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-xs text-white">数据导出</div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>导出你的所有学习数据</div>
            </div>
            <button className="text-[10px] px-3 py-1 rounded-lg cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
              导出
            </button>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.12)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium" style={{ color: '#EF4444' }}>退出登录</div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>退出后学习记录仍会保留</div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs cursor-pointer transition-all"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            <LogOut size={14} /> 退出
          </button>
        </div>
      </div>

      <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
        AIShield Lab v1.0 · 数据仅存储在本地浏览器
      </p>
    </div>
  )
}
