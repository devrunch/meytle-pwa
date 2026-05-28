import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { IconUsers, IconEye, IconEyeOff, IconAlertCircle, IconShieldCheck, IconCalendar, IconMessageCircle } from '@tabler/icons-react'
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

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore(s => s.login)
  const toast = useToast()

  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({ email: false, password: false })
  const [loading, setLoading] = useState(false)

  function blur(field: keyof typeof touched) {
    setTouched(t => ({ ...t, [field]: true }))
  }

  const emailError = touched.email && !form.email ? 'Email is required' :
    touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'Enter a valid email' : ''
  const passwordError = touched.password && !form.password ? 'Password is required' :
    touched.password && form.password.length < 8 ? 'Password must be at least 8 characters' : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (emailError || passwordError || !form.email || !form.password) return
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.user, data.accessToken)
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/app'
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      const detail = Array.isArray(msg) ? msg[0] : (msg ?? 'Please check your credentials and try again.')
      toast('error', 'Login failed', detail)
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
        <h1 className="text-[22px] font-semibold text-[var(--color-dark)]">Welcome back</h1>
        <p className="text-[13px] text-[var(--color-gray)] mt-1">Sign in to your Meytle account</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
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
          <label className="block text-[12px] font-semibold text-[var(--color-gray)] mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
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
        </div>

        <div className="flex justify-end">
          <button type="button" className="text-[12px] text-[var(--color-amber)] hover:underline">
            Forgot password?
          </button>
        </div>

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Log In'}
        </Button>
      </form>

      <p className="text-center text-[13px] text-[var(--color-gray)] mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-[var(--color-amber)] font-medium hover:underline">
          Sign up
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
              Real People.<br />Real Experiences.
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
        <div className="flex-1 flex items-center justify-center px-8 bg-white">
          {form_jsx}
        </div>
      </div>
    </>
  )
}
