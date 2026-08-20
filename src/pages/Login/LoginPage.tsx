import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ShieldAlert, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

interface FormData { email: string; password: string }

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({
    defaultValues: {
      email: 'alice@company.com',
      password: '12345'
    }
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      console.log('Attempting login...', data)
      const res = await api.post('/api/auth/login', data)
      console.log('Login successful! Response:', res.data)
      
      if (!res.data || !res.data.token) {
        console.error('Token is missing from response payload!')
      }

      setAuth(res.data.user, res.data.token)
      console.log('Stored token via setAuth, navigating to /dashboard')
      navigate('/dashboard')
    } catch (e: any) {
      console.error('Login Error:', e)
      setError(e.response?.data?.message || e.response?.data?.error || 'Invalid credentials or server error.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background font-display">
      
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-30 bg-primary blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-20 bg-secondary blur-[120px]"></div>

      <div className="w-full max-w-[460px] relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] mb-8 shadow-2xl bg-primary border border-border">
            <ShieldAlert size={48} className="text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tighter mb-3 text-primary" style={{ letterSpacing: '-0.02em' }}>
            SLA <span>Risk Engine</span>
          </h1>
          <p className="text-muted-foreground font-medium text-lg">
            Predictive AI for Service Management
          </p>
        </div>

        {/* Login Card with Glassmorphism */}
        <div className="rounded-[40px] p-10 shadow-2xl border border-border bg-card/80 backdrop-blur-[40px]">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Please sign in to access your dashboard</p>
          </div>

          {error && (
            <div className="mb-8 px-5 py-4 rounded-[20px] text-sm flex items-center gap-4 bg-red-500/10 text-red-500 border border-red-500/20">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2.5 ml-2 text-foreground">
                Work Email
              </label>
              <input
                type="email"
                className={`w-full px-6 py-4 rounded-[22px] text-base outline-none transition-all duration-300 border bg-input text-foreground placeholder:text-muted-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.email ? 'border-red-500' : 'border-border'}`}
                placeholder="alice@company.com"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="text-xs mt-2 ml-2 text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2.5 ml-2 text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`w-full px-6 py-4 pr-14 rounded-[22px] text-base outline-none transition-all duration-300 border bg-input text-foreground placeholder:text-muted-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.password ? 'border-red-500' : 'border-border'}`}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-2 ml-2 text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 rounded-[22px] text-lg font-bold text-foreground bg-secondary hover:bg-primary transition-all duration-500 flex items-center justify-center gap-3 mt-6 shadow-[0_10px_25px_-5px_rgba(var(--primary-orange-rgb),0.4)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 size={24} className="animate-spin" /> Authenticating...</>
              ) : (
                <>Sign In <ArrowRight size={24} /></>
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <p className="text-center mt-12 text-sm text-muted-foreground font-medium">
          &copy; {new Date().getFullYear()} SLA RISK ENGINE. SYSTEM READY.
        </p>
      </div>
    </div>
  )
}
