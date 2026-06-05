import React, { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import api from '../../services/api'
import { Plug, CheckCircle2, XCircle, Loader2, RefreshCw, Trash2, Activity, Zap, Clock, Shield, Database } from 'lucide-react'
import type { Connector } from '../../types'

interface ConnectForm {
  connector_type: 'jira' | 'servicenow'
  base_url: string
  username: string
  api_token: string
  app_id?: string
}

interface SchedulerStatus {
  running: boolean
  sync_interval_seconds: number
  scheduler_interval_seconds: number
  jobs: { id: string; next_run: string | null }[]
}

const CONNECTOR_META = {
  jira: {
    label: 'Jira',
    color: '#0052cc',
    gradient: 'linear-gradient(135deg, #0052cc, #2684ff)',
    placeholder_url: 'https://yourcompany.atlassian.net',
    placeholder_user: 'your@email.com',
    token_label: 'API Token',
    icon: '🔷',
    docs: 'https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/',
  },
  servicenow: {
    label: 'ServiceNow',
    color: '#62d84e',
    gradient: 'linear-gradient(135deg, #62d84e, #81e868)',
    placeholder_url: 'e.g., dev12345',
    placeholder_user: 'admin',
    token_label: 'Password',
    icon: '🟢',
    docs: 'https://docs.servicenow.com/bundle/washingtondc-api-reference/page/integrate/inbound-rest/concept/c_RESTAPI.html',
  },
}



export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [activeTab, setActiveTab] = useState<'jira' | 'servicenow'>('jira')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [isFallback, setIsFallback] = useState(false)
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const pollRef = useRef<number | null>(null)

  const { register, handleSubmit, reset, formState: { errors: formErrors } } = useForm<ConnectForm>({
    defaultValues: { connector_type: 'jira' }
  })

  // ── Load connectors from API or demo fallback ──
  const loadConnectors = async () => {
    setLoading(true)
    setError('')



    try {
      const [connRes, schedRes] = await Promise.allSettled([
        api.get('/api/connectors/'),
        api.get('/api/scheduler/status'),
      ])

      if (connRes.status === 'fulfilled') {
        const data = connRes.value.data
        setConnectors(Array.isArray(data) ? data : (data?.connectors ?? []))
        setIsFallback(false)
      } else {
        throw connRes.reason
      }

      if (schedRes.status === 'fulfilled') {
        setSchedulerStatus(schedRes.value.data)
      }

      setLastRefresh(new Date())
    } catch (e: any) {
      console.error('Failed to load connectors:', e)
      if (e?.response?.status === 401) {
        setError('Session expired. Please log in again.')
      } else {
        setConnectors([])
        setSchedulerStatus(null)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Auto-poll every 30s ──
  useEffect(() => {
    loadConnectors()
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = window.setInterval(loadConnectors, 30000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  // ── Connect a new connector ──
  const onSubmit = async (data: ConnectForm) => {
    setConnecting(true)
    setError('')
    setSuccess('')



    try {
      await api.post('/api/connectors/connect', { ...data, connector_type: activeTab })
      setSuccess(`${CONNECTOR_META[activeTab].label} connected successfully! Background sync started.`)
      reset()
      loadConnectors()
    } catch (e: any) {
      let backendError = e.response?.data?.error || e.response?.data?.detail || 'Connection failed. Check your credentials.'
      // Add helpful hints for common errors
      if (backendError.includes('401') && activeTab === 'jira') {
        backendError += ' — Jira Cloud requires an API Token (not your password). Generate one at: id.atlassian.com → Security → API tokens.'
      } else if (backendError.includes('401') && activeTab === 'servicenow') {
        backendError += ' — Verify your ServiceNow instance URL, username, and password are correct.'
      } else if (backendError.includes('getaddrinfo') || backendError.includes('Name or service not known')) {
        backendError = 'Could not reach the server. Please check the Endpoint URL is correct.'
      }
      setError(backendError)
    } finally {
      setConnecting(false)
    }
  }

  // ── Disconnect ──
  const handleDisconnect = async (id: number) => {

    try {
      await api.delete(`/api/connectors/${id}`)
      loadConnectors()
    } catch (e) {
      console.error('Failed to disconnect:', e)
      setError('Failed to disconnect the integration.')
    }
  }

  // ── Trigger manual sync ──
  const triggerSync = async () => {
    setSyncing(true)

    try {
      await api.post('/api/scheduler/sync')
      setTimeout(() => { loadConnectors(); setSyncing(false) }, 3000)
    } catch {
      setSyncing(false)
      setError('Failed to trigger sync.')
    }
  }

  const meta = CONNECTOR_META[activeTab]
  const activeConnectors = connectors.filter(c => c.is_active)

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen" style={{ background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 sticky top-0 bg-[#f8fafc] z-10 -mx-8 px-8 py-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            System <span style={{ color: '#3b82f6' }}>Connectors</span>
          </h1>
          <div className="flex items-center gap-4" style={{ color: '#94a3b8' }}>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-500 ${isFallback ? 'animate-pulse' : ''}`}
              style={{
                background: error ? 'rgba(239,68,68,0.1)' : isFallback ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                border: `1px solid ${error ? 'rgba(239,68,68,0.2)' : isFallback ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
                color: error ? '#f87171' : isFallback ? '#f59e0b' : '#22c55e'
              }}>
              <div className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-red-500' : isFallback ? 'bg-amber-500' : 'bg-green-500'}`} />
              {error ? 'Connection Error' : isFallback ? 'Intelligence Mode' : 'Live Synchronization'}
            </div>
            <span className="text-xs">Pulse: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={triggerSync} disabled={syncing || loading}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
            {syncing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {syncing ? 'Syncing...' : 'Force Sync'}
          </button>
          <button onClick={loadConnectors} disabled={loading}
            className="p-3 rounded-2xl transition-all hover:bg-slate-50 border border-slate-200 text-slate-600"
            style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
          </button>
        </div>
      </div>

      {/* Scheduler Status Bar */}
      {schedulerStatus && (
        <div className="mb-8 p-5 rounded-[28px] border flex flex-wrap items-center gap-6"
          style={{ background: 'rgba(15,23,42,0.3)', borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${schedulerStatus.running ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs font-black uppercase tracking-widest text-slate-600">
              Scheduler {schedulerStatus.running ? 'Active' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Clock size={12} />
            <span className="text-[10px] font-bold">Sync every {schedulerStatus.sync_interval_seconds}s</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Shield size={12} />
            <span className="text-[10px] font-bold">Risk scan every {schedulerStatus.scheduler_interval_seconds}s</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Database size={12} />
            <span className="text-[10px] font-bold">{activeConnectors.length} active link{activeConnectors.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* ── Connection Form (left 2 cols) ── */}
        <div className="lg:col-span-2">
          <div className="p-8 rounded-[40px] border shadow-2xl relative overflow-hidden"
            style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', borderColor: 'rgba(0, 0, 0, 0.05)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Plug size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Provision New Link</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1.5 rounded-2xl mb-8" style={{ background: '#020623' }}>
              {(['jira', 'servicenow'] as const).map(t => (
                <button key={t} type="button"
                  onClick={() => { setActiveTab(t); setError(''); setSuccess('') }}
                  className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  style={{
                    background: activeTab === t ? 'rgba(59,130,246,0.1)' : 'transparent',
                    color: activeTab === t ? '#60a5fa' : '#64748b',
                    border: activeTab === t ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                  }}>
                  <span>{CONNECTOR_META[t].icon}</span>
                  {CONNECTOR_META[t].label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">
                  {activeTab === 'jira' ? 'Jira URL' : 'Instance ID'}
                </label>
                <input type={activeTab === 'jira' ? 'url' : 'text'}
                  className="w-full px-5 py-4 rounded-2xl text-sm font-bold outline-none border border-slate-200 focus:border-blue-500/50 transition-all"
                  placeholder={meta.placeholder_url}
                  style={{ background: '#f8fafc', color: '#0f172a' }}
                  {...register('base_url', { required: activeTab === 'jira' ? 'URL is required' : 'Instance is required' })}
                />
                {formErrors.base_url && <p className="text-[10px] text-red-400 ml-2 font-bold">{formErrors.base_url.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">
                  {activeTab === 'jira' ? 'Admin Email' : 'User'}
                </label>
                <input type="text"
                  className="w-full px-5 py-4 rounded-2xl text-sm font-bold outline-none border border-slate-200 focus:border-blue-500/50 transition-all"
                  placeholder={meta.placeholder_user}
                  style={{ background: '#f8fafc', color: '#0f172a' }}
                  {...register('username', { required: 'Username is required' })}
                />
                {formErrors.username && <p className="text-[10px] text-red-400 ml-2 font-bold">{formErrors.username.message}</p>}
              </div>

              {activeTab === 'jira' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">
                    Project Key (App ID)
                  </label>
                  <input type="text"
                    className="w-full px-5 py-4 rounded-2xl text-sm font-bold outline-none border border-slate-200 focus:border-blue-500/50 transition-all"
                    placeholder="e.g., KAN"
                    style={{ background: '#f8fafc', color: '#0f172a' }}
                    {...register('app_id')}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{meta.token_label}</label>
                  <a href={meta.docs} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-400 hover:underline">Docs ↗</a>
                </div>
                <input type="password"
                  className="w-full px-5 py-4 rounded-2xl text-sm font-bold outline-none border border-slate-200 focus:border-blue-500/50 transition-all font-mono"
                  placeholder="••••••••••••••"
                  style={{ background: '#f8fafc', color: '#0f172a' }}
                  {...register('api_token', { required: true })}
                />
                <p className="text-[10px] text-slate-600 ml-2 mt-1">
                  {activeTab === 'jira'
                    ? '⚠ Use a Jira API Token, not your password. Generate at id.atlassian.com → Security → API tokens.'
                    : 'Enter your ServiceNow instance password.'}
                </p>
              </div>

              <button type="submit" disabled={connecting}
                className="w-full py-5 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-900 transition-all shadow-xl disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: meta.gradient, boxShadow: `0 10px 30px -8px ${meta.color}60` }}>
                {connecting ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Authenticating...</span>
                ) : `Establish ${meta.label} Link`}
              </button>
            </form>

            {success && (
              <div className="mt-6 p-4 rounded-2xl bg-green-500/5 border border-green-500/20 text-green-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> {success}
              </div>
            )}
            {error && (
              <div className="mt-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
                <XCircle size={16} /> {error}
              </div>
            )}
          </div>
        </div>

        {/* ── Live Infrastructure (right 3 cols) ── */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4 rounded-full bg-blue-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Live Infrastructure</h2>
            <span className="text-[10px] font-bold text-slate-600 ml-auto">{activeConnectors.length} active</span>
          </div>

          {loading && connectors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-4 rounded-[40px] border border-slate-200" style={{ background: 'rgba(15,23,42,0.3)' }}>
              <Loader2 size={40} className="animate-spin text-blue-500" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Scanning Infrastructure...</p>
            </div>
          ) : activeConnectors.length === 0 ? (
            <div className="p-16 text-center rounded-[40px] border border-dashed border-slate-300">
              <Plug size={48} className="mx-auto mb-4 text-slate-700" />
              <p className="text-slate-500 font-bold mb-1">No active connectors detected</p>
              <p className="text-slate-600 text-xs">Use the form to provision your first ITSM link.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeConnectors.map(c => {
                const cMeta = CONNECTOR_META[c.connector_type as keyof typeof CONNECTOR_META] || CONNECTOR_META.jira
                const timeSinceSync = c.last_synced_at ? Math.floor((Date.now() - new Date(c.last_synced_at).getTime()) / 1000) : null
                const syncLabel = timeSinceSync !== null
                  ? timeSinceSync < 60 ? `${timeSinceSync}s ago` : timeSinceSync < 3600 ? `${Math.floor(timeSinceSync / 60)}m ago` : `${Math.floor(timeSinceSync / 3600)}h ago`
                  : 'Pending'
                const connectedDays = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000)

                return (
                  <div key={c.id} className="p-6 rounded-[32px] border relative overflow-hidden group hover:bg-white/[0.03] transition-all duration-500"
                    style={{ background: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.05)' }}>
                    {/* Accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[32px]" style={{ background: cMeta.gradient }} />

                    <div className="flex items-start justify-between pl-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl border border-slate-200"
                          style={{ background: `${cMeta.color}10` }}>
                          {cMeta.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-slate-900 text-lg tracking-tight">{cMeta.label}</h3>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">
                              <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" /> Active
                            </span>
                          </div>
                          <p className="text-xs font-mono text-slate-500 mb-3">{c.base_url}</p>
                          <div className="flex items-center gap-6 flex-wrap">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase text-slate-600 mb-0.5">User</span>
                              <span className="text-[11px] font-bold text-slate-700">{c.username}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase text-slate-600 mb-0.5">Last Sync</span>
                              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                <Activity size={10} className={syncing ? 'animate-spin text-green-400' : 'text-blue-400'} />
                                {syncing ? 'Syncing...' : syncLabel}
                              </span>
                            </div>
                            {c.app_id && (
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase text-slate-600 mb-0.5">Project Key</span>
                                <span className="text-[11px] font-bold text-slate-700">{c.app_id}</span>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase text-slate-600 mb-0.5">Uptime</span>
                              <span className="text-[11px] font-bold text-slate-700">{connectedDays}d</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDisconnect(c.id)}
                        className="p-3 rounded-xl hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
                        title="Disconnect">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Orchestration Metrics */}
          <div className="p-8 rounded-[40px] border bg-gradient-to-br from-blue-600/5 to-transparent border-slate-200">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6">Orchestration Metrics</h4>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-2xl font-black text-slate-900 mb-1">{activeConnectors.length}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Links</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 mb-1">{schedulerStatus?.sync_interval_seconds ?? 60}s</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sync Interval</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 mb-1">{schedulerStatus?.running ? '✓' : '✗'}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scheduler</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}