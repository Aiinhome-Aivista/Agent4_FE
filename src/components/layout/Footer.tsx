import React from 'react'

export default function Footer() {
  return (
    <footer className="h-14 flex items-center justify-between px-6 border-t text-xs" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
      <div>
        © 2026 SLA Risk Engine. All rights reserved.
      </div>
      <div>
        v1.0.0
      </div>
    </footer>
  )
}
