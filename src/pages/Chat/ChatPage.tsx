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
  HIGH:   'bg-red-50 text-red-500 border-red-100',
  MEDIUM: 'bg-amber-50 text-amber-500 border-amber-100',
  LOW:    'bg-emerald-50 text-emerald-500 border-emerald-100',
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
    <div
      className="h-full flex overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif", background: '#f8fafc' }}
    >
      {/* ── Left Sidebar — Incident List ──────────────────────────────────── */}
      <div className="w-[380px] flex-shrink-0 bg-white border-r border-slate-100 flex flex-col">
        {/* Filters */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
              Incidents
            </h2>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {['OPEN', 'ALL', 'CLOSED'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filter === f
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none border border-slate-200 focus:border-blue-500/50 transition-all bg-slate-50"
            />
          </div>

          <div className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest">
            {filteredIncidents.length} Incidents
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
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
                className={`p-5 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors relative ${
                  selectedIncident?.id === inc.id ? 'bg-blue-50/50' : ''
                }`}
              >
                {selectedIncident?.id === inc.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                )}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-500">{inc.source}</p>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                      {inc.title}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border flex-shrink-0 ${
                      RISK_COLOR[inc.risk_level] || 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}
                  >
                    {inc.risk_level || '—'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Risk Score: {inc.risk_score ? Number(inc.risk_score).toFixed(1) : '—'}
                </p>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-slate-200/50 text-slate-600">
                    {inc.status}
                  </span>
                  {selectedIncident?.id === inc.id && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600">
                      <Lock size={10} /> Locked
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || loading}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentPage === 1 || loading
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Prev
          </button>
          <span className="text-xs font-bold text-slate-500">
            Page {currentPage} of {Math.max(1, Math.ceil(totalIncidents / 4))}
          </span>
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage * 4 >= totalIncidents || loading}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentPage * 4 >= totalIncidents || loading
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* ── Right Area — Chat ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <div className="bg-white p-6 border-b border-slate-100">
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
                <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                  {selectedIncident.title}
                </h2>
              </div>
              <p className="text-sm text-slate-600 font-medium">
                {selectedIncident.summary ||
                  'Summary not available. AI is analyzing this incident.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-slate-400">
              <Sparkles size={24} className="mb-2 text-slate-300" />
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
                      ? 'bg-amber-50 border-amber-200 text-amber-500'
                      : msg.type === 'error'
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'bg-blue-100 border-blue-200 text-blue-600'
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
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : msg.type === 'guardrail'
                    ? 'bg-amber-50 border border-amber-200 text-amber-800 rounded-tl-none shadow-sm'
                    : msg.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-700 rounded-tl-none shadow-sm'
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'
                }`}
              >
                {/* Guardrail banner */}
                {msg.type === 'guardrail' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-amber-200">
                    <ShieldAlert size={14} className="text-amber-500 flex-shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-600">
                      Guardrail Active — Off-Topic Question Blocked
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-wrap leading-relaxed break-words overflow-hidden">
                  {msg.content}
                  {/* Streaming cursor */}
                  {msg.streaming && (
                    <span className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5 animate-pulse align-middle" />
                  )}
                </div>

                <div
                  className={`text-[10px] mt-2 font-medium ${
                    msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {/* Streaming typing indicator */}
          {streaming && messages[messages.length - 1]?.content === '' && (
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl rounded-tl-none p-5 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 bg-white border-t border-slate-100">
          {/* Guardrail hint */}
          {selectedIncident && (
            <div className="flex items-center gap-2 mb-3 px-1">
              <Lock size={11} className="text-blue-400 flex-shrink-0" />
              <p className="text-[11px] text-slate-400 font-medium truncate">
                Restricted to:{' '}
                <span className="text-blue-500 font-bold">{selectedIncident.title}</span>
              </p>
            </div>
          )}

          <div
            className={`relative flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 pl-4 shadow-sm focus-within:border-blue-500/50 transition-all ${
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
              className="flex-1 text-sm font-medium outline-none text-slate-700 bg-transparent resize-none py-1.5 max-h-32 overflow-y-auto leading-relaxed"
              disabled={!selectedIncident || streaming}
              style={{ minHeight: '24px' }}
            />

            <button
              onClick={handleSend}
              disabled={!selectedIncident || streaming || !input.trim()}
              className={`p-2.5 rounded-xl transition-colors shadow-lg flex-shrink-0 ${
                selectedIncident && !streaming && input.trim()
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {streaming ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
            🔒 RAG-powered · Guardrails active · Scoped to selected incident only
          </p>
        </div>
      </div>
    </div>
  )
}
