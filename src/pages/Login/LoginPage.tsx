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
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>()

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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ 
        background: '#f8fafc',
        fontFamily: "'DM Sans', sans-serif"
      }}>
      
      {/* Animated Background Blobs with robust styles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-30"
        style={{ 
          background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
          filter: 'blur(120px)'
        }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-20"
        style={{ 
          background: 'linear-gradient(135deg, #7c3aed, #db2777)',
          filter: 'blur(120px)'
        }}></div>

      <div className="w-full max-w-[460px] relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] mb-8 shadow-2xl"
            style={{ 
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)', 
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.5)'
            }}>
            <ShieldAlert size={48} className="text-slate-900" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tighter mb-3" 
            style={{ color: '#3b82f6', letterSpacing: '-0.02em' }}>
            SLA <span style={{ color: '#3b82f6' }}>Risk Engine</span>
          </h1>
          <p className="text-slate-600 font-medium text-lg">
            Predictive AI for Service Management
          </p>
        </div>

        {/* Login Card with Glassmorphism */}
        <div className="rounded-[40px] p-10 shadow-2xl border border-slate-300"
          style={{ 
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(40px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p style={{ color: '#94a3b8' }}>Please sign in to access your dashboard</p>
          </div>

          {error && (
            <div className="mb-8 px-5 py-4 rounded-[20px] text-sm flex items-center gap-4"
              style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div className="w-2 h-2 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2.5 ml-2" style={{ color: '#cbd5e1' }}>
                Work Email
              </label>
              <input
                type="email"
                className="w-full px-6 py-4 rounded-[22px] text-base outline-none transition-all duration-300 border"
                style={{
                  borderColor: errors.email ? '#ef4444' : 'rgba(0, 0, 0, 0.1)',
                  background: 'rgba(2, 6, 23, 0.4)',
                  color: '#ffffff',
                }}
                placeholder="alice@company.com"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="text-xs mt-2 ml-2 text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2.5 ml-2" style={{ color: '#cbd5e1' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="w-full px-6 py-4 pr-14 rounded-[22px] text-base outline-none transition-all duration-300 border"
                  style={{
                    borderColor: errors.password ? '#ef4444' : 'rgba(0, 0, 0, 0.1)',
                    background: 'rgba(2, 6, 23, 0.4)',
                    color: '#ffffff'
                  }}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors"
                  style={{ color: '#64748b' }}>
                  {showPw ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-2 ml-2 text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 rounded-[22px] text-lg font-bold text-slate-900 transition-all duration-500 flex items-center justify-center gap-3 mt-6 shadow-2xl"
              style={{
                background: isSubmitting
                  ? 'rgba(59, 130, 246, 0.5)'
                  : 'linear-gradient(135deg, #2563eb, #6366f1)',
                boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)'
              }}
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
        <p className="text-center mt-12 text-sm text-slate-500 font-medium">
          &copy; 2026 SLA RISK ENGINE. SYSTEM READY.
        </p>
      </div>
    </div>
  )
}
