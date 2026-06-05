import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Plug, AlertTriangle, LogOut, Activity, ShieldAlert, Book, MessageSquare } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const nav = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/connectors', label: 'Connectors', icon: Plug },
  { to: '/incidents',  label: 'Incidents',  icon: AlertTriangle },
  { to: '/runbooks',   label: 'Knowledge Base',   icon: Book },
  { to: '/chat',       label: 'Speak to the SLA wisdom', icon: MessageSquare },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside className="w-64 h-full flex flex-col" style={{
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
    }}>
      {/* Logo */}
      <div className="h-14 px-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          <ShieldAlert size={20} className="text-slate-900" />
        </div>
        <div>
          <div className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>SLA Risk</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Engine</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'text-slate-900 font-medium'
                  : 'hover:bg-slate-50'
              }`
            }
            style={({ isActive }) => isActive
              ? { background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.1))',
                  color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }
              : { color: 'var(--text-secondary)' }
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-2.5" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-red-500/10"
          style={{ color: '#f87171' }}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
