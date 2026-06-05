import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  icon: LucideIcon
  color?: string
  sub?: string
}

export default function StatCard({ label, value, icon: Icon, color = '#3b82f6', sub }: Props) {
  return (
    <div className="card flex items-start justify-between gap-4">
      <div>
        <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
        {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
      </div>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
        <Icon size={20} style={{ color }} />
      </div>
    </div>
  )
}
