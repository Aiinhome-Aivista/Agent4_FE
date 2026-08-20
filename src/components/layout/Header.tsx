import React from 'react'
import { useAuthStore } from '../../store/authStore'
import ThemeToggle from '../ui/ThemeToggle'

export default function Header() {
  const { user } = useAuthStore()

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b bg-card border-border">
      <div className="text-sm font-medium text-foreground">
        Incident Response Management
      </div>
      <div className="flex items-center gap-6">
        <ThemeToggle />
        {/* <div className="text-xs text-muted-foreground">
          System Status: <span className="text-green-500 font-bold">Optimal</span>
        </div> */}
        
        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground bg-gradient-to-br from-primary to-secondary">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-sm font-medium text-foreground">
            {user?.name}
          </div>
        </div>
      </div>
    </header>
  )
}
