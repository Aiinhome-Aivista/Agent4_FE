import React, { useEffect, useState } from 'react'
import { AlertTriangle, Search, Filter, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import api from '../../services/api'
import type { Incident, RiskLevel } from '../../types'
import RiskBadge from '../../components/ui/RiskBadge'

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e'
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [page, setPage] = useState(1)
  const [perPage] = useState(5)
  const [loading, setLoading] = useState(false)
  const [riskFilter, setRiskFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<Incident | null>(null)
  const [refreshCountdown, setRefreshCountdown] = useState(30)

  // Fetch all records at once (up to 1000) so React can sort and paginate them correctly
  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/incidents/', {
        params: {
          page: 1,
          per_page: 1000,
        },
      })
      setIncidents(res.data.incidents || [])
    } catch (e) {
      console.error('API fetch failed.', e)
      setIncidents([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    setRefreshCountdown(30)

    // Auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      const silentLoad = async () => {
        try {
          const res = await api.get('/api/incidents/', {
            params: {
              page: 1,
              per_page: 1000,
            },
          });
          setIncidents(res.data.incidents || [])
          setRefreshCountdown(30)
        } catch (e) {
          console.error('Silent API fetch failed.', e)
        }
      }
      silentLoad()
    }, 30000)

    // Countdown timer
    const countdownIntervalId = setInterval(() => {
      setRefreshCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => {
      clearInterval(intervalId)
      clearInterval(countdownIntervalId)
    }
  }, []); // Empty dependency array: we only fetch on mount and interval now

  // 1. FILTER the data locally
  const filteredIncidents = incidents.filter(inc => {
    // Exclude incidents that haven't been scored yet
    if (inc.risk_score === null || inc.risk_score === undefined) return false;

    const matchesRisk = !riskFilter || inc.risk_level === riskFilter;
    const matchesSource = !sourceFilter || inc.source === sourceFilter;
    return matchesRisk && matchesSource;
  });

  // 2. SORT the filtered data locally
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // 3. PAGINATE the sorted data locally
  const totalPages = Math.max(1, Math.ceil(sortedIncidents.length / perPage));
  const startIndex = (page - 1) * perPage;
  const paginatedIncidents = sortedIncidents.slice(startIndex, startIndex + perPage);

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-background font-display">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 sticky top-0 bg-background z-10 -mx-8 px-8 py-4">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">
            Incident <span className="text-primary">Intelligence</span>
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="text-xs">{sortedIncidents.length} total records detected</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm bg-primary/10 border border-primary/20 text-primary">
            <Loader2 size={12} className="animate-spin" />
            Refreshing in {refreshCountdown}s
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-6 rounded-[32px] border mb-8 flex flex-wrap gap-4 items-center bg-card/80 backdrop-blur-[20px] border-border">
        <div className="flex items-center gap-2 mr-4 text-muted-foreground">
          <Filter size={18} className="text-primary" />
          <span className="text-sm font-bold uppercase tracking-widest">Segment</span>
        </div>

        <select
          value={riskFilter}
          onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
          className="px-6 py-3 rounded-2xl text-sm font-bold outline-none cursor-pointer border border-border bg-input text-foreground">
          <option value="">All Risk Levels</option>
          <option value="HIGH">HIGH RISK</option>
          <option value="MEDIUM">MEDIUM RISK</option>
          <option value="LOW">LOW RISK</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="px-6 py-3 rounded-2xl text-sm font-bold outline-none cursor-pointer border border-border bg-input text-foreground">
          <option value="">All Sources</option>
          <option value="jira">Jira Sync</option>
          <option value="servicenow">ServiceNow Sync</option>
        </select>

        {(riskFilter || sourceFilter) && (
          <button onClick={() => { setRiskFilter(''); setSourceFilter(''); setPage(1); }}
            className="text-xs font-black uppercase px-4 py-2 rounded-xl transition-all hover:bg-red-500/10 text-red-500 border border-red-500/20">
            Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Table View */}
        <div className="xl:col-span-3 transition-all duration-500">
          <div className="rounded-[40px] border overflow-hidden bg-card/80 backdrop-blur-[40px] border-border">

            {loading ? (
              <div className="flex flex-col items-center justify-center h-[500px] gap-4">
                <Loader2 size={48} className="animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Refreshing Stream...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted/50">
                        {['Title', 'Status', 'Source', 'Risk Level', 'Risk Score', 'Priority'].map(h => (
                          <th key={h} className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                        ))}
                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-secondary/10 transition-colors text-muted-foreground"
                          onClick={() => {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            setPage(1); // Reset to page 1 when sort order changes
                          }}
                        >
                          <div className="flex items-center gap-1">
                            Created At
                            <span className="text-xs">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-border">
                      {paginatedIncidents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-24 text-center text-muted-foreground font-medium">
                            No active incidents match current segment filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedIncidents.map((inc) => (
                          <tr
                            key={inc.id}
                            onClick={() => setSelected(selected?.id === inc.id ? null : inc)}
                            className={`cursor-pointer transition-all duration-300 hover:bg-muted/50 ${selected?.id === inc.id ? 'bg-primary/10' : ''}`}
                          >
                            <td className="px-4 py-4 text-sm font-bold text-foreground truncate max-w-[200px]">{inc.title}</td>
                            <td className="px-4 py-4 text-xs font-bold text-muted-foreground capitalize">{inc.status}</td>
                            <td className="px-4 py-4 text-[10px] font-bold uppercase text-muted-foreground">{inc.source}</td>
                            <td className="px-4 py-4">
                              <RiskBadge level={inc.risk_level} size="sm" />
                            </td>
                            <td className={`px-4 py-4 text-lg font-black ${inc.risk_score != null && inc.risk_score >= 70 ? 'text-red-500' : inc.risk_score != null && inc.risk_score >= 35 ? 'text-amber-500' : 'text-green-500'}`}>
                              {inc.risk_score?.toFixed(0) || '0'}%
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-xs font-black uppercase px-3 py-1.5 rounded-xl border bg-[color:var(--prio-bg)] text-[color:var(--prio-color)] border-[color:var(--prio-border)]"
                                style={{
                                  '--prio-bg': `${PRIORITY_COLOR[inc.priority] || '#94a3b8'}15`,
                                  '--prio-color': PRIORITY_COLOR[inc.priority] || '#94a3b8',
                                  '--prio-border': `${PRIORITY_COLOR[inc.priority] || '#94a3b8'}30`
                                } as React.CSSProperties}>
                                {inc.priority}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-xs font-bold text-foreground">
                              {inc.created_at ? new Date(inc.created_at).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        )))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-border flex items-center justify-between bg-card mt-4 rounded-xl shadow-sm">
                  <button
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1 || loading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${page === 1 || loading ? 'text-muted-foreground opacity-50 cursor-not-allowed' : 'text-foreground hover:bg-muted'
                      }`}
                  >
                    Prev
                  </button>
                  <span className="text-xs font-bold text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={page >= totalPages || loading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${page >= totalPages || loading ? 'text-muted-foreground opacity-50 cursor-not-allowed' : 'text-foreground hover:bg-muted'
                      }`}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Backdrop */}
        {selected && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setSelected(null)} />
        )}

        {/* Detail Drawer */}
        <div className={`fixed inset-y-0 right-0 w-[600px] bg-background border-l border-border shadow-2xl z-50 transform transition-transform duration-500 overflow-y-auto ${selected ? 'translate-x-0' : 'translate-x-full'}`}>
          {selected && (
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <AlertTriangle size={20} />
                  </span>
                  <span className="font-mono text-lg font-black text-foreground">{selected.title}</span>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-secondary/10 rounded-xl transition-colors">
                  <span className="text-muted-foreground text-sm">✕</span>
                </button>
              </div>

              {/* Summary */}
              <div className="space-y-2 mb-6">
                <p className="text-[10px] font-black text-muted-foreground uppercase">Summary</p>
                <h3 className="text-xl font-bold text-foreground leading-tight">{(selected as any).summary || selected.title}</h3>
              </div>

              {/* Solution */}
              <div className="space-y-2 mb-6">
                <p className="text-[10px] font-black text-muted-foreground uppercase">Solution</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{(selected as any).solution || selected.description}</p>
              </div>

              {/* Grid for Risk Score and Resolution Time */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-muted border border-border">
                  <p className="text-[18px] font-black text-muted-foreground uppercase mb-1">Risk Score</p>
                  <p className={`text-[22px] font-black ${(selected as any).risk_score != null && (selected as any).risk_score >= 70 ? 'text-red-500' : (selected as any).risk_score != null && (selected as any).risk_score >= 35 ? 'text-amber-500' : 'text-green-500'}`}>
                    {(selected as any).risk_score ? `${Number((selected as any).risk_score).toFixed(0)}%` : 'N/A'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-muted border border-border">
                  <p className="text-[18px] font-black text-muted-foreground uppercase mb-1">Est. Resolution Time</p>
                  <p className="text-[22px] font-bold text-foreground">{(selected as any).estimated_resolution_time || 'N/A'}</p>
                </div>
              </div>

              {/* Detailed Scores */}
              {/* <div className="mb-8 space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-3">Score Breakdown</p> */}

              {/* Impact Score */}
              {/* <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Impact Score</span>
                    <span className="text-xs font-black" style={{ color: '#14d134ff' }}>{(selected as any).impact_score?.toFixed(1) || '0.0'}/20</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${((selected as any).impact_score || 0) * 5}%` }} />
                  </div>
                </div> */}

              {/* Urgency Score */}
              {/* <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Urgency Score</span>
                    <span className="text-xs font-black" style={{ color: '#f97316' }}>{(selected as any).urgency_score?.toFixed(1) || '0.0'}/20</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${((selected as any).urgency_score || 0) * 5}%` }} />
                  </div>
                </div> */}

              {/* Complexity Score */}
              {/* <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Complexity Score</span>
                    <span className="text-xs font-black" style={{ color: '#8b5cf6' }}>{(selected as any).complexity_score?.toFixed(1) || '0.0'}/20</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${((selected as any).complexity_score || 0) * 5}%` }} />
                  </div>
                </div> */}

              {/* SLA Breach Score */}
              {/* <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">SLA Breach Score</span>
                    <span className="text-xs font-black" style={{ color: '#f43f5e' }}>{(selected as any).sla_breach_score?.toFixed(1) || '0.0'}/20</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${((selected as any).sla_breach_score|| 0) * 5}%` }} />
                  </div>
                </div> */}

              {/* New Ticket Score */}
              {/* <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">New Ticket Score</span>
                    <span className="text-xs font-black" style={{ color: '#0ea5e9' }}>{(selected as any).new_ticket_score?.toFixed(1) || '0.0'}/20</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full transition-all duration-1000" style={{ width: `${((selected as any).new_ticket_score|| 0) * 5}%` }} />
                  </div>
                </div>
              </div> */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}