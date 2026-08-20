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
    <aside className="w-64 h-full flex flex-col bg-sidebar border-r border-border">
      {/* Logo */}
      <div className="h-14 px-6 flex items-center gap-3 border-b border-border">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary border border-border">
          <ShieldAlert size={20} className="text-primary-foreground" />
        </div>
        <div>
          <div className="font-semibold text-sm leading-tight text-white">SLA Risk</div>
          <div className="text-xs text-gray-300">Engine</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                isActive
                  ? 'bg-primary/20 text-white border-primary/30 font-medium'
                  : 'border-transparent text-gray-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="m-4 border border-border rounded-[10px]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-red-500 hover:bg-red-500/10"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
