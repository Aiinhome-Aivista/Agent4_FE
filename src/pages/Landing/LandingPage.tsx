import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldAlert, Activity, LayoutDashboard, Plug, AlertTriangle, 
  ArrowRight, Play, Server, Cpu, Database, Network, CheckCircle, 
  RefreshCw, BarChart2, ShieldCheck, Sparkles, Terminal, ArrowUpRight,
  ExternalLink, Mail, Zap, Code
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const METRICS = [
  { value: '99.4%', label: 'Risk Model Accuracy', desc: 'Predictive neural net scoring confidence' },
  { value: '< 1.2s', label: 'Autonomous MTTT', desc: 'Mean Time to Triaged & categorized' },
  { value: '60s', label: 'Live Connector Sync', desc: 'Real-time incident ingestion cycle' },
  { value: '84%', label: 'SLA Breach Reduction', desc: 'Average proactive prevention rate' }
]

const PIPELINE_PHASES = [
  {
    id: 'ingestion',
    title: 'Omnichannel Ingestion',
    icon: Database,
    color: '#2563eb',
    desc: 'Ingests tickets from Jira, ServiceNow, Custom Webhooks, or parsed email streams in real-time.',
    details: {
      source: 'Jira Webhook Triggered',
      payload: {
        ticket_id: 'INC-2048X',
        title: 'PostgreSQL Pool Connection Exhaustion in Production',
        source: 'jira',
        priority: 'critical',
        created_at: new Date().toISOString()
      },
      log: [
        '[System] Webhook received from jira.atlassian.net',
        '[Parser] Extracted payload fields; structure verified.',
        '[Ingest] Saved to staging queue (Latency: 42ms)'
      ]
    }
  },
  {
    id: 'triage',
    title: 'Autonomous Triage',
    icon: Cpu,
    color: '#7c3aed',
    desc: 'Extracts entities, analyzes sentiment, assigns urgency levels, and links to relevant product components.',
    details: {
      source: 'AI Metadata Classifier',
      payload: {
        category: 'database',
        impact_score: 9.8,
        affected_services: ['AuthService', 'BillingAPI'],
        urgency: 'immediate'
      },
      log: [
        '[Triage] Analyzing description for keywords...',
        '[NLP] Detected Entities: PostgreSQL (DB), Production (Env), Connection Exhaustion',
        '[Router] Categorized under infrastructure::database'
      ]
    }
  },
  {
    id: 'prediction',
    title: 'SLA Risk Prediction',
    icon: ShieldAlert,
    color: '#dc2626',
    desc: 'Predicts breach probability using real-time machine learning models factoring in agent workload, historical times, and priority.',
    details: {
      source: 'SLA Predictive Engine ML-v4',
      payload: {
        breach_probability: '94.2%',
        calculated_sla_duration: '4h 0m',
        time_remaining: '2h 14m',
        calculated_risk_score: 9.4,
        risk_level: 'HIGH'
      },
      log: [
        '[Predictor] Fetching past metrics for priority::critical, category::database',
        '[Model] Inputs: 8 open critical tickets, 2 active DB engineers on shift',
        '[SLA] Breach predicted with 94.2% confidence. Risk score: 9.4/10'
      ]
    }
  },
  {
    id: 'analysis',
    title: 'Mistral AI Diagnosis',
    icon: Sparkles,
    color: '#d97706',
    desc: 'Orchestrates a Mistral-powered analysis to pinpoint the root cause, write an active resolution plan, and query knowledge bases.',
    details: {
      source: 'Mistral-7B-Instruct-v0.3',
      payload: {
        root_cause: 'Connection leak in user billing routine during payment retry loops.',
        confidence: 0.91,
        suggested_action: 'Increase max_connections parameter to 200 in postgresql.conf and apply patch to BillingAPI retry logic.'
      },
      log: [
        '[Mistral] Triggered multi-agent reasoning sub-loop',
        '[KnowledgeBase] Found 2 similar incidents resolved: INC-1029X, INC-1847A',
        '[Agent] Completed synthesis. Resolution strategy index formulated.'
      ]
    }
  },
  {
    id: 'mitigation',
    title: 'Orchestrated Actions',
    icon: Zap,
    color: '#059669',
    desc: 'Pushes alerts, notifies on-call teams, synchronizes statuses across connected systems, and presents solutions to engineers.',
    details: {
      source: 'Incident Orchestrator Daemon',
      payload: {
        notified_slack_channels: ['#ops-incidents-severe'],
        jira_status_updated: 'IN_PROGRESS',
        pagerduty_escalation: 'Tier-1 Database On-call Paged'
      },
      log: [
        '[Orchestration] Updating source Jira ticket status -> In Progress',
        '[Notification] Paged DBA on-call via PagerDuty (Response ID: pd-493)',
        '[Dashboard] Broadcasted high-risk live alert telemetry'
      ]
    }
  }
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [activePhase, setActivePhase] = useState(PIPELINE_PHASES[0])
  const [tickerIncident, setTickerIncident] = useState({
    id: 'INC-2940A',
    title: 'API Gateway SSL Certificate Expiry Alert',
    source: 'servicenow',
    risk: '9.2',
    color: '#dc2626'
  })

  // Simulate scrolling live alerts ticker
  useEffect(() => {
    const liveAlerts = [
      { id: 'INC-4921C', title: 'Redis Cache Memory Usage Exceeds 92%', source: 'jira', risk: '7.8', color: '#d97706' },
      { id: 'INC-9912A', title: 'Rate Limiter Blocking Valid Stripe Webhooks', source: 'webhook', risk: '6.4', color: '#d97706' },
      { id: 'INC-7731K', title: 'Kubernetes Node Memory Leak (Node-04)', source: 'jira', risk: '8.9', color: '#dc2626' },
      { id: 'INC-1052Z', title: 'Email Service Delivery Queue Backlog (5000+ mails)', source: 'email', risk: '5.2', color: '#059669' }
    ]
    let index = 0
    const interval = setInterval(() => {
      setTickerIncident(liveAlerts[index])
      index = (index + 1) % liveAlerts.length
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen text-[#0f172a] overflow-x-hidden relative"
      style={{
        background: '#f8fafc',
        fontFamily: "'DM Sans', sans-serif"
      }}>
      
      {/* Dynamic Futuristic Gentle Light Glow Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-400/10 blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[30%] right-[10%] w-[600px] h-[600px] rounded-full bg-purple-400/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-400/10 blur-[140px] pointer-events-none z-0" />

      {/* Grid Pattern overlay with perfect low opacity slate lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-100 z-0" />

      {/* FLOATING GLASS LIGHT NAVBAR */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-md"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
              <ShieldAlert size={22} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-blue-700">
                SLA RISK ENGINE
              </span>
              <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">Predictive Intelligence</div>
            </div>
          </div>

          {/* Links for beautiful layout */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Key Capabilities</a>
            <a href="#pipeline" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Autonomous Pipeline</a>
            <a href="#connectors" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Integrations</a>
            <a href="#metrics" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Telemetry</a>
          </div>

          {/* System Pulse + Action */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SLA Risk Engine: Operational
            </div>
            <button
              onClick={() => navigate(token ? '/dashboard' : '/login')}
              className="relative px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-300 overflow-hidden group shadow-md hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)'
              }}
            >
              <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {token ? 'Enter Console' : 'Launch Engine'}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-20 pb-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Typography Lockup */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700 uppercase tracking-wider">
              <Sparkles size={13} className="text-blue-600" /> Next-Gen AI Incident Prevention
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] text-slate-900">
              Predictive SLA <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                Risk Intelligence
              </span>
            </h1>

            <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Stop fighting fires after the breach. SLA Risk Engine ingests live alert pipelines, predicts SLA violation likelihood with machine learning models, and uses autonomous Mistral Agents to deliver root-cause analysis and mitigation suggestions instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => navigate(token ? '/dashboard' : '/login')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-white shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transition-transform hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #6366f1)',
                  boxShadow: '0 20px 40px -10px rgba(37,99,235,0.3)'
                }}
              >
                Launch Risk Console <ArrowRight size={20} />
              </button>
              <a href="#pipeline"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-slate-700 border border-slate-200 hover:border-slate-300 bg-white/60 backdrop-blur-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Play size={16} fill="currentColor" /> Watch Orchestration
              </a>
            </div>

            {/* Live simulation ticker pill */}
            <div className="pt-4">
              <div className="p-4 rounded-[20px] bg-white border border-slate-200/80 flex items-center gap-3.5 max-w-lg mx-auto lg:mx-0 text-left backdrop-blur-md shadow-md">
                <span className="flex-shrink-0 w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span>LIVE PIPELINE FEED</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-mono text-[9px] font-bold uppercase">{tickerIncident.source}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">{tickerIncident.title}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-[10px] font-mono text-slate-500">Risk Score</span>
                  <p className="text-sm font-bold font-mono text-red-500 leading-none">{tickerIncident.risk}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Mini Dashboard Mockup */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-[500px] rounded-[32px] p-6 shadow-2xl border border-slate-200/80 bg-white/95 backdrop-blur-2xl">
              
              {/* Inner ambient lights */}
              <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
              <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

              {/* Titlebar */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 font-mono ml-2">Console::Live_Status</span>
                </div>
                <div className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-[10px] text-blue-600 font-mono font-bold animate-pulse">
                  SYNCING LIVE
                </div>
              </div>

              {/* Mini Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold block">TOTAL INCIDENTS</span>
                  <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">42</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-red-500 font-bold block">CRITICAL RISK</span>
                  <span className="text-xl font-bold font-mono text-red-500 mt-1 block">5</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-emerald-600 font-bold block">AVG RISK</span>
                  <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">3.4</span>
                </div>
              </div>

              {/* Risk Score Widget */}
              <div className="p-4 rounded-2xl bg-red-50/40 border border-red-100 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-500 animate-bounce" />
                    <span className="text-xs font-bold text-slate-800">INC-384C Connection Exhaustion</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-600 border border-red-200">
                    Breach predicted
                  </span>
                </div>
                
                {/* Risk score slider */}
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                  <span>ML Forecasted Risk Weight</span>
                  <span className="font-bold text-red-500 font-mono text-sm">9.4/10</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500" style={{ width: '94%' }} />
                </div>
              </div>

              {/* Live activity log - Premium Dark Terminal contrasting beautifully */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2 shadow-inner">
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest pb-1 border-b border-white/5">
                  Mistral Agent Diagnostic Output
                </div>
                <p className="text-white flex items-center gap-1.5">
                  <span className="text-blue-400">&gt;</span> root_cause: billing retries connection exhaustion.
                </p>
                <p className="text-white flex items-center gap-1.5">
                  <span className="text-blue-400">&gt;</span> suggested_fix: scale connections, deploy db patch.
                </p>
                <p className="text-emerald-400 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span> status: Slack notification pushed to #ops
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM STATS SECTION */}
      <section id="metrics" className="relative z-10 py-12 px-6 max-w-7xl mx-auto border-t border-slate-200">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {METRICS.map((stat, i) => (
            <div key={i} className="p-6 rounded-[24px] bg-white border border-slate-200 shadow-sm relative group hover:border-slate-300 hover:shadow-md transition-all">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-700 block">
                {stat.value}
              </span>
              <span className="text-sm font-bold text-slate-800 mt-2 block">{stat.label}</span>
              <span className="text-xs text-slate-500 mt-1 block leading-relaxed">{stat.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="features" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <ShieldCheck size={12} /> ENTERPRISE CAPABILITIES
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Built for High-Velocity Service Teams
          </h2>
          <p className="text-base text-slate-600">
            Harness real-time incident diagnostics, predictive risk classification, and autonomous operational runbooks to optimize your incident lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm group hover:-translate-y-1 transition-all hover:border-blue-500/30 hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity size={22} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Predictive SLA Forecasting</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Leverage custom machine learning models trained on structural attributes, team workloads, and historic MTTR metrics to foresee and eliminate SLA breaches before they occurs.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm group hover:-translate-y-1 transition-all hover:border-purple-500/30 hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles size={22} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Mistral AI Diagnosis Agent</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              No more manual deep dives. Mistral LLM agent analyzes ticket telemetry, queries our indexing vector storage for similar patterns, compiles detailed diagnostics, and presents actionable solutions.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm group hover:-translate-y-1 transition-all hover:border-emerald-500/30 hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Plug size={22} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Live Telemetry Connectors</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Bi-directional, zero-lag integrations with Atlassian Jira Service Management, ServiceNow, webhook systems, and SMTP email endpoints. Changes instantly sync both ways.
            </p>
          </div>
        </div>
      </section>

      {/* DYNAMIC PIPELINE SHOWCASE SECTION */}
      <section id="pipeline" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-slate-200 bg-slate-50/50">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text and phase selectors */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-xs font-bold text-purple-700 uppercase tracking-wider">
              <Network size={12} /> END-TO-END FLOW
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Interactive AI Orchestration Pipeline
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Step through our intelligent mitigation pipeline. Click any phase to inspect the live engine JSON metadata payloads, database logs, and automation actions.
            </p>

            {/* Vertical Phase Steps */}
            <div className="space-y-3 pt-4">
              {PIPELINE_PHASES.map((phase) => {
                const Icon = phase.icon
                const isSelected = activePhase.id === phase.id
                return (
                  <button
                    key={phase.id}
                    onClick={() => setActivePhase(phase)}
                    className="w-full p-4 rounded-2xl text-left border flex items-center gap-4 transition-all duration-300 shadow-sm"
                    style={{
                      background: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                      borderColor: isSelected ? phase.color : 'rgba(15, 23, 42, 0.08)',
                      boxShadow: isSelected ? `0 4px 20px -5px ${phase.color}25` : 'none'
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300"
                      style={{
                        background: `${phase.color}10`,
                        border: `1px solid ${phase.color}20`,
                        color: phase.color
                      }}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900">{phase.title}</h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{phase.desc}</p>
                    </div>
                    <ArrowRight size={14} className={`text-slate-400 transition-transform duration-300 ${isSelected ? 'translate-x-1 text-slate-900' : ''}`} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Interactive Live Console Panel */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl p-6 bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
              {/* Grid lights for terminal */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-600/5 to-purple-600/5 rounded-full blur-3xl pointer-events-none" />

              {/* Console header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-400">
                  <Terminal size={14} style={{ color: activePhase.color }} />
                  <span>Pipeline_Telemetry::</span>
                  <span style={{ color: activePhase.color }}>{activePhase.id}.json</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-400">Active</span>
                </div>
              </div>

              {/* Console Tabs */}
              <div className="flex gap-4 border-b border-slate-800 pb-2 mb-4 text-xs font-mono">
                <span className="text-white border-b border-blue-500 pb-2 cursor-pointer font-bold">Metadata Payload</span>
                <span className="text-slate-500 hover:text-slate-300 cursor-pointer">Service Logs</span>
              </div>

              {/* AnimatePresence for content change */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePhase.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Source identifier */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Engine Process Module</span>
                    <span className="font-mono text-xs font-bold" style={{ color: activePhase.color }}>
                      {activePhase.details.source}
                    </span>
                  </div>

                  {/* JSON Code Area */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">Engine JSON Payload</span>
                    <pre className="p-4 rounded-xl bg-slate-900/70 border border-slate-850 font-mono text-xs text-emerald-400 overflow-x-auto max-h-60 max-w-full">
                      {JSON.stringify(activePhase.details.payload, null, 2)}
                    </pre>
                  </div>

                  {/* Operational Logs */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">Real-Time Event Stream</span>
                    <div className="space-y-1.5 font-mono text-xs text-slate-300 p-3 rounded-xl bg-slate-900/30 border border-slate-850">
                      {activePhase.details.log.map((logLine, idx) => (
                        <p key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-slate-500 flex-shrink-0">[{idx+1}]</span>
                          <span>{logLine}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC CONNECTORS SHOWCASE */}
      <section id="connectors" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <Plug size={12} /> ENTERPRISE INTEGRATIONS
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Pre-Built Core Pipelines
          </h2>
          <p className="text-base text-slate-600">
            Connect incident workflows seamlessly. Out-of-the-box ingestion triggers compile data automatically with absolutely zero coding required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Jira Connector */}
          <div className="p-6 rounded-[28px] bg-white border border-slate-200 hover:border-blue-500/30 hover:bg-blue-50/10 transition-all duration-300 relative group shadow-sm">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
              style={{ background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.15)' }}>
              <Plug size={22} className="text-blue-600" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Jira Connector</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Sync issues, transitions, comments, and priority states instantly via real-time webhooks or polling.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
            </span>
          </div>

          {/* ServiceNow Connector */}
          <div className="p-6 rounded-[28px] bg-white border border-slate-200 hover:border-emerald-500/30 hover:bg-emerald-50/10 transition-all duration-300 relative group shadow-sm">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
              style={{ background: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.15)' }}>
              <Plug size={22} className="text-emerald-600" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">ServiceNow</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Full inbound integration with incident/problem tables, syncing operational SLA details natively.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
            </span>
          </div>

          {/* Webhook Connector */}
          <div className="p-6 rounded-[28px] bg-white border border-slate-200 hover:border-blue-500/30 hover:bg-slate-50 transition-all duration-300 relative group shadow-sm">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
              style={{ background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.15)' }}>
              <Code size={22} className="text-blue-600" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Custom Webhooks</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Generic REST endpoints to post any external JSON ticket structures. Extremely simple payload structures.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
              Ready to configure
            </span>
          </div>

          {/* Email Connector */}
          <div className="p-6 rounded-[28px] bg-white border border-slate-200 hover:border-amber-500/30 hover:bg-slate-50 transition-all duration-300 relative group shadow-sm">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
              style={{ background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.15)' }}>
              <Mail size={22} className="text-amber-600" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Email Streams</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Scrapes designated enterprise support mailboxes, parsing unstructured threads into structured incidents.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
              Ready to configure
            </span>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="relative z-10 py-24 px-6 max-w-5xl mx-auto">
        <div className="p-12 rounded-[40px] border border-slate-200/80 bg-gradient-to-br from-white to-blue-50/50 relative overflow-hidden shadow-xl text-center space-y-8">
          {/* Inner decorative light */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Ready to Take Control <br/>
            of Your SLA Commitments?
          </h2>
          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Initialize your Predictive SLA engine in less than two minutes. Connect your workspace, configure your alert thresholds, and let AI agents mitigate incident breaches.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 pt-4">
            <button
              onClick={() => navigate(token ? '/dashboard' : '/login')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-white shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transition-transform hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #6366f1)',
                boxShadow: '0 20px 40px -10px rgba(37,99,235,0.3)'
              }}
            >
              Get Started Free <ArrowRight size={18} />
            </button>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-slate-700 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all shadow-sm"
            >
              Explore Source Code <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-200 py-12 px-6 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 border border-blue-100 shadow-sm">
              <ShieldAlert size={18} className="text-blue-600" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900">SLA RISK ENGINE</span>
              <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">SYSTEM ACTIVE v1.0.0</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-slate-500 font-semibold">
            <a href="#features" className="hover:text-blue-600 transition-colors">Key Capabilities</a>
            <a href="#pipeline" className="hover:text-blue-600 transition-colors">Autonomous Pipeline</a>
            <a href="#connectors" className="hover:text-blue-600 transition-colors">Integrations</a>
            <a href="#metrics" className="hover:text-blue-600 transition-colors">Telemetry</a>
          </div>
          <p className="text-xs text-slate-400 text-center md:text-right font-medium">
            &copy; 2026 SLA RISK ENGINE. SYSTEM OPERATIONAL.
          </p>
        </div>
      </footer>

    </div>
  )
}
