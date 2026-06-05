import React from 'react'
import { useAuthStore } from '../../store/authStore'

export default function Header() {
  const { user } = useAuthStore()

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Incident Response Management
      </div>
      <div className="flex items-center gap-6">
        {/* <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          System Status: <span className="text-green-500 font-bold">Optimal</span>
        </div> */}
        
        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-slate-900"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {user?.name}
          </div>
        </div>
      </div>
    </header>
  )
}
