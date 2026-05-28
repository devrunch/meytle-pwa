import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  IconUsers,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
  IconShieldCheck,
  IconCalendar,
  IconMessageCircle,
} from '@tabler/icons-react'
import { Button } from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/auth'

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="text-[11px] text-[var(--color-error)] mt-1 flex items-center gap-1">
      <IconAlertCircle size={11} />
      {msg}
    </p>
  )
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score, label: 'Weak', color: '#EF4444' }
  if (score <= 3) return { score, label: 'Fair', color: '#F59E0B' }
  return { score, label: 'Strong', color: '#10B981' }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const toast = useToast()

  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', dateOfBirth: '' })
  const [touched, setTouched] = useState({ fullName: false, email: false, password: false, dateOfBirth: false })
  const [loading, setLoading] = useState(false)

  function blur(field: keyof typeof touched) {
    setTouched(t => ({ ...t, [field]: true }))
  }

  const nameError = touched.fullName && !form.fullName.trim() ? 'Full name is required' : ''
  const emailError = touched.email && !form.email ? 'Email is required' :
    touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'Enter a valid email' : ''
  const dobError = touched.dateOfBirth && !form.dateOfBirth ? 'Date of birth is required' : ''
  const passwordError = touched.password && !form.password ? 'Password is required' :
    touched.password && form.password.length < 8 ? 'Password must be at least 8 characters' : ''

  const strength = passwordStrength(form.password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ fullName: true, email: true, password: true, dateOfBirth: true })
    if (nameError || emailError || dobError || passwordError || !form.fullName || !form.email || !form.password || !form.dateOfBirth) return
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      login(data.user, data.accessToken)
      navigate('/app', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      const detail = Array.isArray(msg) ? msg[0] : (msg ?? 'Please try again.')
      toast('error', "Couldn't create account", detail)
    } finally {
      setLoading(false)
    }
  }

  const form_jsx = (
    <div className="w-full max-w-[360px] mx-auto">
      <div className="flex flex-col items-center mb-8 md:items-start">
        <div className="w-10 h-10 rounded-[10px] bg-[var(--color-amber)] flex items-center justify-center mb-3 md:hidden">
          <IconUsers size={20} stroke={1.5} color="white" />
        </div>
        <h1 className="text-[22px] font-semibold text-[var(--color-dark)]">Create your account</h1>
        <p className="text-[13px] text-[var(--color-gray)] mt-1">Free to join, no credit card needed</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <div>
          <label className="block text-[12px] font-semibold text-[var(--color-gray)] mb-1.5">Full name</label>
          <input
            type="text"
            placeholder="Your name"
            value={form.fullName}
            onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
            onBlur={() => blur('fullName')}
            className={`w-full h-11 px-3 rounded-[10px] border text-[13px] text-[var(--color-dark)] focus:outline-none focus:border-[var(--color-amber)] transition-colors ${
              nameError ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'
            }`}
          />
          {nameError && <FieldError msg={nameError} />}
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[var(--color-gray)] mb-1.5">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            onBlur={() => blur('email')}
            className={`w-full h-11 px-3 rounded-[10px] border text-[13px] text-[var(--color-dark)] focus:outline-none focus:border-[var(--color-amber)] transition-colors ${
              emailError ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'
            }`}
          />
          {emailError && <FieldError msg={emailError} />}
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[var(--color-gray)] mb-1.5">Date of birth</label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
            onBlur={() => blur('dateOfBirth')}
            className={`w-full h-11 px-3 rounded-[10px] border text-[13px] text-[var(--color-dark)] focus:outline-none focus:border-[var(--color-amber)] transition-colors ${
              dobError ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'
            }`}
          />
          {dobError && <FieldError msg={dobError} />}
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[var(--color-gray)] mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onBlur={() => blur('password')}
              className={`w-full h-11 px-3 pr-10 rounded-[10px] border text-[13px] text-[var(--color-dark)] focus:outline-none focus:border-[var(--color-amber)] transition-colors ${
                passwordError ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-gray)] hover:text-[var(--color-dark)] transition-colors"
            >
              {showPassword ? <IconEyeOff size={16} stroke={1.5} /> : <IconEye size={16} stroke={1.5} />}
            </button>
          </div>
          {passwordError && <FieldError msg={passwordError} />}
          {form.password && !passwordError && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors duration-200"
                    style={{ backgroundColor: i <= strength.score ? strength.color : 'var(--color-border)' }}
                  />
                ))}
              </div>
              <p className="text-[11px]" style={{ color: strength.color }}>{strength.label}</p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-[var(--color-gray)] leading-relaxed mt-1">
          By creating an account, you agree to our{' '}
          <span className="text-[var(--color-amber)] cursor-pointer hover:underline">Terms of Service</span>
          {' '}and{' '}
          <span className="text-[var(--color-amber)] cursor-pointer hover:underline">Privacy Policy</span>.
        </p>

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-[13px] text-[var(--color-gray)] mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-[var(--color-amber)] font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )

  return (
    <>
      {/* Mobile — single column */}
      <div className="md:hidden min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-4">
        {form_jsx}
      </div>

      {/* Desktop — two column split */}
      <div className="hidden md:flex min-h-screen">
        {/* Left panel — brand */}
        <div className="w-[45%] flex-shrink-0 flex flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'var(--gradient-gold)' }}>
          <div className="absolute -right-16 -top-16 w-[300px] h-[300px] rounded-full border border-white/10" />
          <div className="absolute right-8 bottom-32 w-[150px] h-[150px] rounded-full border border-white/10" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-[10px] bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <IconUsers size={18} stroke={1.5} color="white" />
            </div>
            <span className="text-[18px] font-bold text-white">Meytle</span>
          </div>

          <div className="relative z-10">
            <h2 className="text-[36px] font-bold text-white leading-tight mb-4">
              Join the<br />Community.
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { icon: <IconShieldCheck size={16} stroke={1.5} />, text: 'Verified companions in Delhi NCR' },
                { icon: <IconCalendar size={16} stroke={1.5} />, text: 'Book in minutes, meet today' },
                { icon: <IconMessageCircle size={16} stroke={1.5} />, text: 'Chat directly before confirming' },
              ].map(f => (
                <div key={f.text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white">
                    {f.icon}
                  </div>
                  <span className="text-[13px] text-white/85">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-white/50 relative z-10">© 2026 Meytle</p>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center px-8 bg-white overflow-y-auto py-12">
          {form_jsx}
        </div>
      </div>
    </>
  )
}
