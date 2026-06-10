import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Lock, User, Sparkles } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setIsLoading(true)

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Name is required for sign up')
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        })

        if (signUpError) throw signUpError

        // If session is immediately active (email confirmation disabled in Supabase)
        if (data.session) {
          navigate('/')
        } else {
          setSuccessMsg('Verification email sent! Check your inbox to verify.')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError
        navigate('/')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setIsLoading(true)
    try {
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/`,
        },
      })
      if (oAuthError) throw oAuthError
    } catch (err: any) {
      setError(err.message || 'OAuth initialization failed')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-hero shadow-card p-6 flex flex-col gap-6">
        
        {/* App Branding */}
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <div className="w-12 h-12 rounded-hero bg-accent text-white flex items-center justify-center shadow-cta animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary mt-2">
            Yaari Khaatha
          </h1>
          <p className="text-[13px] text-text-secondary text-center max-w-[260px]">
            Log who owes you in 3 taps. Share pay links instantly.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-chip text-error text-[12px] font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-positive/10 border border-positive/20 rounded-chip text-positive text-[12px] font-semibold leading-relaxed">
              {successMsg}
            </div>
          )}

          {isSignUp && (
            <Input
              label="Full Name"
              type="text"
              placeholder="Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              prefixIcon={<User className="w-4.5 h-4.5" />}
              required
            />
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="rahul@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            prefixIcon={<Mail className="w-4.5 h-4.5" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            prefixIcon={<Lock className="w-4.5 h-4.5" />}
            required
          />

          <Button type="submit" variant="primary" fullWidth isLoading={isLoading} className="mt-2">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-divider" />
          </div>
          <span className="relative bg-card px-3.5 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
            or continue with
          </span>
        </div>

        {/* Google OAuth */}
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-text-primary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Google
        </Button>

        {/* Switch mode */}
        <div className="text-center mt-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[13px] text-text-secondary hover:text-accent font-medium transition-colors cursor-pointer"
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  )
}
