import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconUsers, IconEye, IconEyeOff } from '@tabler/icons-react'
import { Button, Input } from '../../components/ui'

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-[10px] bg-[var(--color-amber)] flex items-center justify-center mb-3">
            <IconUsers size={20} stroke={1.5} color="white" />
          </div>
          <h1 className="text-[22px] font-semibold text-[var(--color-dark)]">Welcome back</h1>
          <p className="text-[13px] text-[var(--color-gray)] mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
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

          <div className="flex justify-end">
            <button type="button" className="text-[12px] text-[var(--color-amber)] hover:underline">
              Forgot password?
            </button>
          </div>

          <Button type="submit" size="lg" className="mt-1 w-full">Log In</Button>
        </form>

        <p className="text-center text-[13px] text-[var(--color-gray)] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--color-amber)] font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
