import React from 'react'
import type { RiskLevel } from '../../types'

interface Props { level: RiskLevel | null | undefined; size?: 'sm' | 'md' }

export default function RiskBadge({ level, size = 'md' }: Props) {
  if (!level) return <span className="text-gray-500 text-xs">—</span>

  const cls = level === 'HIGH' ? 'badge-high' : level === 'MEDIUM' ? 'badge-medium' : 'badge-low'
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'

  return (
    <span className={`${cls} ${px} rounded-full font-semibold font-mono tracking-wide`}>
      {level}
    </span>
  )
}
