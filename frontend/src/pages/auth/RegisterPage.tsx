import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconUsers, IconEye, IconEyeOff } from '@tabler/icons-react'
import { Button, Input } from '../../components/ui'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/auth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)

  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', dateOfBirth: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      login(data.user, data.accessToken)
      navigate('/app', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-[10px] bg-[var(--color-amber)] flex items-center justify-center mb-3">
            <IconUsers size={20} stroke={1.5} color="white" />
          </div>
          <h1 className="text-[22px] font-semibold text-[var(--color-dark)]">Create your account</h1>
          <p className="text-[13px] text-[var(--color-gray)] mt-1">Free to join, no credit card needed</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Full name"
            type="text"
            placeholder="Your name"
            value={form.fullName}
            onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <Input
            label="Date of birth"
            type="date"
            value={form.dateOfBirth}
            onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
            required
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-[34px] text-[var(--color-gray)] hover:text-[var(--color-dark)] transition-colors"
            >
              {showPassword ? <IconEyeOff size={16} stroke={1.5} /> : <IconEye size={16} stroke={1.5} />}
            </button>
          </div>

          {error && (
            <p className="text-[12px] text-[var(--color-error)] bg-[var(--color-error-bg)] rounded-[8px] px-3 py-2">
              {error}
            </p>
          )}

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
    </div>
  )
}
