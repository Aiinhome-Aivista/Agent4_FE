import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  TrendingUp, 
  RefreshCw, 
  Loader2, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck,
  Zap
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
} from 'recharts'
import api from '../../services/api'
import type { DashboardStats, Incident } from '../../types'
import RiskBadge from '../../components/ui/RiskBadge'

const PIE_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' }
const PRIORITY_COLOR: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [bySource, setBySource] = useState<any[]>([])
  const [byPriority, setByPriority] = useState<any[]>([])
  const [topRisk, setTopRisk] = useState<Partial<Incident>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const intervalRef = useRef<number | null>(null);

  const load = async () => {
    setLoading(true)
    setError(null)
    setIsFallback(false)

    const token = localStorage.getItem('sla_token');

    // Proactively check for the token before making the API call.
    if (!token) {
      setError('Authentication token not found. Please log in again.');
      setStats(null);
      setBySource([]);
      setByPriority([]);
      setTopRisk([]);
      setLoading(false);
      return; // Stop execution if no token is found
    }



    try {
      const res = await api.get('/api/incidents/dashboard')
      setStats(res.data.stats)
      setBySource(res.data.by_source)
      setByPriority(res.data.by_priority)
      setTopRisk(res.data.top_risk_incidents)
      setLastRefresh(new Date())
    } catch (e: any) {
      console.error('Dashboard API failed.', e)
      // Clear data and set an error message
      setStats(null)
      setBySource([])
      setByPriority([])
      setTopRisk([])

      if (e.response?.status === 401) {
        // This could mean the token is expired or invalid
        // Stop any further automatic refreshes to prevent an error loop.
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setError('Your session has expired. Redirecting to login...')
        // Use a timeout to allow the user to see the message before redirecting
        setTimeout(() => {
          localStorage.removeItem('sla_token')
          navigate('/login')
        }, 2000)
      } else {
        setError('Could not connect to the dashboard service. Please check your connection.')
      }
      setLastRefresh(new Date())
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // Clear any existing interval before setting a new one.
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(load, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [])

  const pieData = stats ? [
    { name: 'HIGH',   value: stats.high_risk   || 0 },
    { name: 'MEDIUM', value: stats.medium_risk  || 0 },
    { name: 'LOW',    value: stats.low_risk     || 0 },
  ] : []

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen" style={{ background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 sticky top-0 bg-[#f8fafc] z-10 -mx-8 px-8 py-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Risk Intelligence <span style={{ color: '#3b82f6' }}>Command Center</span>
          </h1>
          <div className="flex items-center gap-4" style={{ color: '#94a3b8' }}>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-500 ${error || isFallback ? 'animate-pulse' : ''}`}
              style={{ 
                background: error ? 'rgba(239, 68, 68, 0.1)' : isFallback ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
                border: `1px solid ${error ? 'rgba(239, 68, 68, 0.2)' : isFallback ? 'rgba(245, 158, 11, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                color: error ? '#f87171' : isFallback ? '#f59e0b' : '#22c55e'
              }}>
              <div className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-red-500' : isFallback ? 'bg-amber-500' : 'bg-green-500'}`} />
              {error ? 'Connection Error' : isFallback ? 'Intelligence Mode Active' : 'Live Synchronization Active'}
            </div>
            <span className="text-xs">System Pulse: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Force Sync
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {error && (
          <div className="p-6 rounded-[32px] border text-center" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
            <p className="font-bold text-lg">An Error Occurred</p>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Active Incidents', value: stats?.total_incidents ?? 0, icon: Activity, color: '#3b82f6', trend: '+12%' },
            { label: 'Critical Risk', value: stats?.high_risk ?? 0, icon: AlertTriangle, color: '#ef4444', trend: '+5%' },
            { label: 'Stable Systems', value: stats?.low_risk ?? 0, icon: ShieldCheck, color: '#22c55e', trend: 'Optimal' },
            { label: 'Avg Risk Score', value: stats?.avg_risk_score?.toFixed(1) ?? '0', icon: TrendingUp, color: '#f59e0b', trend: '-2.4%' }
          ].map((stat, i) => (
            <div key={i} className="p-6 rounded-[32px] border relative overflow-hidden group hover:scale-[1.02] transition-all duration-500"
              style={{ 
                background: 'rgba(255, 255, 255, 0.8)', 
                backdropFilter: 'blur(16px)',
                borderColor: 'rgba(0, 0, 0, 0.05)'
              }}>
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <stat.icon size={80} style={{ color: stat.color }} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" 
                  style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
                  <stat.icon size={20} style={{ color: stat.color }} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">{stat.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{stat.value}</h3>
                <span className="text-[10px] font-black px-2 py-1 rounded-lg" style={{ background: `${stat.color}10`, color: stat.color }}>{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Visualization Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="p-8 rounded-[40px] border shadow-2xl"
            style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', borderColor: 'rgba(0, 0, 0, 0.05)' }}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tighter">Risk Segmentation</h3>
              <Zap size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100}
                    paddingAngle={8} dataKey="value" stroke="none">
                    {pieData.map((entry: any) => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '16px' }}
                    itemStyle={{ color: '#0f172a', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {pieData.map((d, i) => (
                <div key={i} className="text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase">{d.name}</p>
                  <p className="text-sm font-bold" style={{ color: PIE_COLORS[d.name as keyof typeof PIE_COLORS] }}>{d.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 p-8 rounded-[40px] border shadow-2xl"
            style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', borderColor: 'rgba(0, 0, 0, 0.05)' }}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tighter">Source Distribution</h3>
              <TrendingUp size={18} style={{ color: '#3b82f6' }} />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySource}>
                  <XAxis dataKey="source" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                    contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '16px' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[12, 12, 4, 4]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="rounded-[40px] border shadow-2xl overflow-hidden"
          style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', borderColor: 'rgba(0, 0, 0, 0.05)' }}>
          <div className="p-8 border-b flex items-center justify-between" style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}>
            <h3 className="text-lg font-bold text-slate-900 tracking-tighter">Critical Priority Alerts</h3>
            <span className="text-[10px] font-black px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-widest">High Impact</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ background: 'rgba(241, 245, 249, 0.5)' }}>
                  {['Title', 'Source', 'Risk Level', 'Risk Score', 'Priority'].map(h => (
                    <th key={h} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}>
                {topRisk.map((inc) => (
                  <tr key={inc.ticket_id} className="transition-all duration-300 group hover:bg-slate-50">
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        {/* <span className="font-mono text-xs font-black text-blue-500">{inc.ticket_id}</span> */}
                        <span className="text-sm font-bold text-slate-800 leading-snug">{inc.title}</span>
                      </div>
                    </td>
                    {/* <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                        {inc.status}
                      </span>
                    </td> */}
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                        inc.source === 'jira' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-green-50 text-green-600 border border-green-100'
                      }`}>
                        {inc.source}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <RiskBadge level={inc.risk_level} size="sm" />
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-end gap-1">
                        <span className="text-xl font-black text-slate-900">{inc.risk_score?.toFixed(0)}</span>
                        <span className="text-[10px] font-black text-slate-500 mb-1">%</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all inline-block" 
                        style={{ 
                          background: `${PRIORITY_COLOR[inc.priority || ''] || '#94a3b8'}15`, 
                          color: PRIORITY_COLOR[inc.priority || ''] || '#94a3b8',
                          border: `1px solid ${PRIORITY_COLOR[inc.priority || ''] || '#94a3b8'}30`
                        }}>
                        {inc.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
