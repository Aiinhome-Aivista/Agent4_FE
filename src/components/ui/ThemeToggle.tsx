import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../store/themeStore'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors"
      style={{
        color: 'var(--foreground)',
        background: 'var(--card)',
        borderColor: 'var(--border)'
      }}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
