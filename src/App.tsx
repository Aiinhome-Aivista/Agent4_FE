import React from 'react'
import AppRouter from './routes/AppRouter'
import './styles/globals.css'
import { ThemeProvider } from './store/themeStore'

export default function App() {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  )
}
