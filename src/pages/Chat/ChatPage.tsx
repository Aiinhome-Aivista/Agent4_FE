import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare, Send, Bot, User, Sparkles, Search,
  Loader2, ShieldCheck, ShieldAlert, Lock, ChevronRight, AlertTriangle
} from 'lucide-react'
import api from '../../services/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: 'assistant' | 'user'
  content: string
  time: string
  type?: 'normal' | 'guardrail' | 'error'
  streaming?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const now = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const RISK_COLOR: Record<string, string> = {
  HIGH:   'bg-red-500/10 text-red-500 border-red-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  LOW:    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am the SLA Wisdom assistant powered by RAG. Select an incident from the list to start a context-locked conversation.',
      time: now(),
      type: 'normal',
    },
  ])
  const [input, setInput]               = useState('')
  const [searchQuery, setSearchQuery]   = useState('')
  const [filter, setFilter]             = useState('ALL')
  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [incidents, setIncidents]       = useState<any[]>([])
  const [loading, setLoading]           = useState(false)
  const [streaming, setStreaming]       = useState(false)
  const [currentPage, setCurrentPage]   = useState(1)
  const [totalIncidents, setTotalIncidents] = useState(0)

  const textareaRef   = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef      = useRef<AbortController | null>(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  // Load incidents
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/api/incidents/', {
          params: { page: currentPage, per_page: 4 },
        })
        setIncidents(res.data.incidents)
        setTotalIncidents(res.data.total || res.data.incidents.length)
      } catch (err) {
        console.error('Failed to load incidents:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentPage])

  // ─── RAG Chat with SSE streaming ──────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || !selectedIncident || streaming) return

    const userMessage = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    // Append user message
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage, time: now(), type: 'normal' },
    ])

    // Placeholder assistant message (will be filled by stream)
    const assistantPlaceholder: Message = {
      role: 'assistant',
      content: '',
      time: now(),
      type: 'normal',
      streaming: true,
    }
    setMessages(prev => [...prev, assistantPlaceholder])
    setStreaming(true)

    // Cancel any previous stream
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    try {
      const token = localStorage.getItem('sla_token') || ''
      const baseURL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

      const response = await fetch(
        `${baseURL}/chat/${selectedIncident.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: userMessage }),
          signal: abortRef.current.signal,
        }
      )

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          try {
            const event = JSON.parse(raw)

            if (event.type === 'token') {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + event.content,
                  }
                }
                return updated
              })
            } else if (event.type === 'guardrail') {
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: event.content,
                  time: now(),
                  type: 'guardrail',
                  streaming: false,
                }
                return updated
              })
            } else if (event.type === 'error') {
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: event.content,
                  time: now(),
                  type: 'error',
                  streaming: false,
                }
                return updated
              })
            } else if (event.type === 'done') {
              // Mark streaming as complete
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, streaming: false }
                }
                return updated
              })
            }
          } catch {
            /* ignore malformed SSE lines */
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Connection error. Please try again.',
          time: now(),
          type: 'error',
          streaming: false,
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  // ─── Select incident ──────────────────────────────────────────────────────
  const handleSelectIncident = (inc: any) => {
    // Cancel any active stream when switching incidents
    if (abortRef.current) abortRef.current.abort()
    setStreaming(false)

    setSelectedIncident(inc)
    setMessages([
      {
        role: 'assistant',
        content: `🔒 Scope locked to **"${inc.title}"**.\n\nI am now exclusively focused on this incident. My guardrails will prevent me from answering anything outside this scope. How can I help you resolve this incident?`,
        time: now(),
        type: 'normal',
      },
    ])
  }

  // ─── Filtered incident list ───────────────────────────────────────────────
  const filteredIncidents = incidents.filter(inc => {
    const matchSearch =
      !searchQuery ||
      inc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.ticket_id?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchFilter =
      filter === 'ALL' ||
      (filter === 'OPEN'   && !['resolved', 'closed', 'done'].includes(inc.status?.toLowerCase())) ||
      (filter === 'CLOSED' && ['resolved', 'closed', 'done'].includes(inc.status?.toLowerCase()))
    return matchSearch && matchFilter
  })

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex overflow-hidden font-display bg-background">
      {/* ── Left Sidebar — Incident List ──────────────────────────────────── */}
      <div className="w-[380px] flex-shrink-0 border-r border-border flex flex-col">
        {/* Filters */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              Incidents
            </h2>
            <div className="flex items-center gap-2 bg-muted p-1 rounded-xl text-xs font-bold">
              {['OPEN', 'ALL', 'CLOSED'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filter === f
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none border border-border focus:border-primary/50 transition-all bg-input text-foreground"
            />
          </div>

          <div className="text-[10px] font-black text-muted-foreground uppercase mt-4 tracking-widest">
            {filteredIncidents.length} Incidents
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Loading Stream...
              </p>
            </div>
          ) : (
            filteredIncidents.map(inc => (
              <div
                key={inc.id}
                onClick={() => {
                  if (selectedIncident?.id === inc.id) {
                    setSelectedIncident(null)
                    setMessages([
                      {
                        role: 'assistant',
                        content: 'Hello! I am the SLA Wisdom assistant. Select an incident to start a context-locked RAG conversation.',
                        time: now(),
                        type: 'normal',
                      },
                    ])
                  } else {
                    handleSelectIncident(inc)
                  }
                }}
                className={`p-5 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors relative ${
                  selectedIncident?.id === inc.id ? 'bg-primary/10' : ''
                }`}
              >
                {selectedIncident?.id === inc.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-bold text-muted-foreground">{inc.source}</p>
                    <h3 className="text-sm font-bold text-foreground mt-0.5 leading-snug">
                      {inc.title}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border flex-shrink-0 ${
                      RISK_COLOR[inc.risk_level] || 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {inc.risk_level || '—'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Risk Score: {inc.risk_score ? Number(inc.risk_score).toFixed(1) : '—'}
                </p>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-muted text-foreground">
                    {inc.status}
                  </span>
                  {selectedIncident?.id === inc.id && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-primary">
                      <Lock size={10} /> Locked
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between shrink-0">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || loading}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentPage === 1 || loading
                ? 'text-muted-foreground opacity-50 cursor-not-allowed'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            Prev
          </button>
          <span className="text-xs font-bold text-muted-foreground">
            Page {currentPage} of {Math.max(1, Math.ceil(totalIncidents / 4))}
          </span>
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage * 4 >= totalIncidents || loading}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentPage * 4 >= totalIncidents || loading
                ? 'text-muted-foreground opacity-50 cursor-not-allowed'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* ── Right Area — Chat ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          {selectedIncident ? (
            <div>
              {/* Scope Lock Badge */}
              {/* <div className="flex items-center gap-2 mb-3"> */}
                {/* <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <ShieldCheck size={14} className="text-blue-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-blue-600">
                    Scope Locked
                  </span>
                  <ChevronRight size={12} className="text-blue-400" />
                  <span className="text-xs font-semibold text-blue-700 max-w-[280px] truncate">
                    {selectedIncident.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-slate-500">RAG Active</span>
                </div>
              </div> */}

              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-extrabold text-foreground leading-tight">
                  {selectedIncident.title}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                {selectedIncident.summary ||
                  'Summary not available. AI is analyzing this incident.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
              <Sparkles size={24} className="mb-2 text-secondary opacity-60" />
              <h2 className="text-sm font-bold">Select an incident to start</h2>
              <p className="text-xs font-medium">
                RAG + Guardrails will restrict AI to that incident only
              </p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex w-full items-start gap-4 ${
                msg.role === 'user' ? 'justify-end' : ''
              }`}
            >
              {msg.role === 'assistant' && (
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    msg.type === 'guardrail'
                      ? 'bg-primary/10 border-primary/20 text-primary'
                      : msg.type === 'error'
                      ? 'bg-red-500/10 border-red-500/20 text-red-500'
                      : 'bg-primary/10 border-primary/20 text-primary'
                  }`}
                >
                  {msg.type === 'guardrail' ? (
                    <ShieldAlert size={16} />
                  ) : msg.type === 'error' ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <Bot size={16} />
                  )}
                </div>
              )}

              <div
                className={`max-w-[70%] break-words min-w-0 p-5 rounded-3xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-foreground rounded-tr-none'
                    : msg.type === 'guardrail'
                    ? 'bg-primary/10 border border-primary/20 text-foreground rounded-tl-none shadow-sm'
                    : msg.type === 'error'
                    ? 'bg-red-500/10 border border-red-500/20 text-foreground rounded-tl-none shadow-sm'
                    : 'bg-card border border-border text-foreground rounded-tl-none shadow-sm'
                }`}
              >
                {/* Guardrail banner */}
                {msg.type === 'guardrail' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-primary/20">
                    <ShieldAlert size={14} className="text-primary flex-shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                      Guardrail Active — Off-Topic Question Blocked
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-wrap leading-relaxed break-words overflow-hidden">
                  {msg.content}
                  {/* Streaming cursor */}
                  {msg.streaming && (
                    <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                  )}
                </div>

                <div
                  className={`text-[10px] mt-2 font-medium ${
                    msg.role === 'user' ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}
                >
                  {msg.time}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground flex-shrink-0">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {/* Streaming typing indicator */}
          {streaming && messages[messages.length - 1]?.content === '' && (
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-card border border-border rounded-3xl rounded-tl-none p-5 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-border">
          {/* Guardrail hint */}
          {selectedIncident && (
            <div className="flex items-center gap-2 mb-3 px-1">
              <Lock size={11} className="text-primary flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground font-medium truncate">
                Restricted to:{' '}
                <span className="text-primary font-bold">{selectedIncident.title}</span>
              </p>
            </div>
          )}

          <div
            className={`relative flex items-end gap-3 bg-input border border-border rounded-2xl p-2 pl-4 shadow-sm focus-within:border-primary/50 transition-all ${
              !selectedIncident ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={
                selectedIncident
                  ? `Ask about "${selectedIncident.title}"...`
                  : 'Please select an incident first'
              }
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="flex-1 text-sm font-medium outline-none text-foreground bg-transparent resize-none py-1.5 max-h-32 overflow-y-auto leading-relaxed"
              disabled={!selectedIncident || streaming}
              style={{ minHeight: '24px' }}
            />

            <button
              onClick={handleSend}
              disabled={!selectedIncident || streaming || !input.trim()}
              className={`p-2.5 rounded-xl transition-colors shadow-lg flex-shrink-0 ${
                selectedIncident && !streaming && input.trim()
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {streaming ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground mt-3 font-medium">
            🔒 RAG-powered · Guardrails active · Scoped to selected incident only
          </p>
        </div>
      </div>
    </div>
  )
}
