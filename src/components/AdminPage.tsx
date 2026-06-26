import { useState, useEffect } from 'react'

interface StatsData {
  counters: Record<string, number>
  recentEvents: Array<{ event: string; timestamp: string; meta?: any }>
  topQuestions: Array<{ question: string; count: number }>
  daily: Record<string, Record<string, number>>
}

export function AdminPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('aishield_token')
      const resp = await fetch('/api/auth/stats/dashboard', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          setIsAuthorized(false)
          setError('')
        } else {
          setError('加载数据失败')
        }
        return
      }
      const json = await resp.json()
      setData(json)
      setIsAuthorized(true)
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  if (loading && !data) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0C1027', color: '#94A3B8' }}>Loading...</div>
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-root)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white mb-2">无访问权限</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>该功能仅对管理员开放</p>
        </div>
      </div>
    )
  }
  if (error && !data) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0C1027', color: '#F87171' }}>{error}</div>

  const eventLabels: Record<string, string> = {
    register: '注册',
    login: '登录',
    mfa_setup: 'MFA开启',
    passkey_register: 'Passkey注册',
    career_click: '职业诊断点击',
    payment_success: '付费成功',
    chat_message: 'AI对话',
  }

  const eventColors: Record<string, string> = {
    register: '#A78BFA',
    login: '#60A5FA',
    mfa_setup: '#34D399',
    passkey_register: '#F472B6',
    career_click: '#FBBF24',
    payment_success: '#F87171',
    chat_message: '#818CF8',
  }

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: '#0C1027' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">AIShield Lab 数据看板</h1>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>实时监控网站运营数据</p>
          </div>
          <button onClick={loadData} className="px-4 py-2 rounded-lg text-sm cursor-pointer"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA' }}>
            刷新
          </button>
        </div>

        {data && (
          <>
            {/* Counter Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
              {Object.entries(eventLabels).map(([key, label]) => (
                <div key={key} className="rounded-xl p-4 text-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-2xl font-bold" style={{ color: eventColors[key] || '#fff' }}>
                    {data.counters[key] || 0}
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#64748B' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Daily Chart */}
            <div className="rounded-2xl p-6 mb-8"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-bold text-white mb-4">7天趋势</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-2" style={{ color: '#64748B' }}>日期</th>
                      {Object.entries(eventLabels).map(([k, l]) => (
                        <th key={k} className="text-center py-2 px-1" style={{ color: eventColors[k] }}>{l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.daily).map(([date, counts]) => (
                      <tr key={date} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="py-2 px-2" style={{ color: '#94A3B8' }}>{date.slice(5)}</td>
                        {Object.keys(eventLabels).map(k => (
                          <td key={k} className="text-center py-2 px-1" style={{ color: (counts[k] || 0) > 0 ? '#E2E8F0' : '#334155' }}>
                            {counts[k] || 0}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Questions */}
              <div className="rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-sm font-bold text-white mb-4">AI 对话高频问题 Top 20</h2>
                {data.topQuestions.length === 0 ? (
                  <p className="text-xs" style={{ color: '#475569' }}>暂无数据</p>
                ) : (
                  <div className="space-y-2">
                    {data.topQuestions.map((q, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs font-mono flex-shrink-0 w-5 text-right" style={{ color: '#64748B' }}>{i + 1}</span>
                        <span className="text-xs flex-1" style={{ color: '#CBD5E1' }}>{q.question}</span>
                        <span className="text-xs flex-shrink-0 px-1.5 py-0.5 rounded" style={{ background: 'rgba(129,140,248,0.15)', color: '#818CF8' }}>{q.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Events */}
              <div className="rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-sm font-bold text-white mb-4">最近事件</h2>
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {data.recentEvents.slice(0, 50).map((evt, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs py-1" style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                      <span className="flex-shrink-0" style={{ color: '#475569' }}>
                        {new Date(evt.timestamp).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: (eventColors[evt.event] || '#64748B') + '20', color: eventColors[evt.event] || '#64748B' }}>
                        {eventLabels[evt.event] || evt.event}
                      </span>
                      {evt.meta?.question && (
                        <span className="truncate" style={{ color: '#64748B' }}>{evt.meta.question}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
