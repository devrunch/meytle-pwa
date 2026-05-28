import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

function BrandPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
      style={{ background: 'linear-gradient(145deg, #00D4AA 0%, #00C2D8 45%, #4F8CFF 100%)' }}
    >
      {/* Squiggly top-right */}
      <svg className="absolute top-8 right-8 opacity-20" width="120" height="80" viewBox="0 0 120 80" fill="none">
        <path d="M4 40 Q20 10 36 40 Q52 70 68 40 Q84 10 100 40 Q116 70 132 40" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <path d="M4 60 Q20 30 36 60 Q52 90 68 60 Q84 30 100 60" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>

      {/* Squiggly bottom-left */}
      <svg className="absolute bottom-24 left-6 opacity-15" width="100" height="60" viewBox="0 0 100 60" fill="none">
        <path d="M4 30 Q18 8 32 30 Q46 52 60 30 Q74 8 88 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>

      {/* Floating dots cluster top-left */}
      <svg className="absolute top-16 left-1/2 opacity-20" width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="12" cy="12" r="5" fill="white"/>
        <circle cx="40" cy="8" r="3" fill="white"/>
        <circle cx="68" cy="18" r="6" fill="white"/>
        <circle cx="25" cy="45" r="4" fill="white"/>
        <circle cx="60" cy="50" r="3" fill="white"/>
        <circle cx="10" cy="65" r="5" fill="white"/>
        <circle cx="72" cy="70" r="4" fill="white"/>
      </svg>

      {/* Large ring bottom-right */}
      <svg className="absolute -bottom-12 -right-12 opacity-10" width="220" height="220" viewBox="0 0 220 220" fill="none">
        <circle cx="110" cy="110" r="100" stroke="white" strokeWidth="12"/>
        <circle cx="110" cy="110" r="70" stroke="white" strokeWidth="6"/>
      </svg>

      {/* Scattered emoji-style icons */}
      <div className="absolute top-1/4 right-16 opacity-25 text-white text-4xl select-none rotate-12">🍽️</div>
      <div className="absolute top-2/5 left-16 opacity-20 text-white text-3xl select-none -rotate-6">✈️</div>
      <div className="absolute bottom-1/3 right-20 opacity-20 text-white text-3xl select-none rotate-6">🎭</div>

      {/* Zigzag line middle */}
      <svg className="absolute left-0 top-1/2 -translate-y-1/2 opacity-10" width="60" height="200" viewBox="0 0 60 200" fill="none">
        <polyline points="50,10 10,50 50,90 10,130 50,170 10,210" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>

      {/* Logo */}
      <span className="relative text-white text-2xl font-bold z-10">Meytle</span>

      {/* Headline */}
      <div className="relative z-10">
        <h1 className="text-white text-5xl font-extrabold leading-tight mb-4">
          Real<br />connections,<br />real<br />experiences.
        </h1>
        <p className="text-white/70 text-base">
          Book a companion for dining, travel, events and more — across India.
        </p>
      </div>

      <p className="relative z-10 text-white/35 text-xs">© 2025 Meytle</p>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/home';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email';
    if (form.password.length < 6) e.password = 'At least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await authApi.login({ email: form.email, password: form.password });
      setAuth(data.accessToken, data.user);
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center bg-surface-mint px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <span className="text-3xl font-bold gradient-primary-text">Meytle</span>
          </div>

          <h2 className="text-2xl font-extrabold text-heading mb-1">Welcome back</h2>
          <p className="text-muted mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-body mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                onBlur={validate}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-xl border bg-surface text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/40 transition ${
                  errors.email ? 'border-red-400' : 'border-border'
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-body">Password</label>
                <Link to="/forgot-password" className="text-xs text-accent-green hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border bg-surface text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/40 transition ${
                    errors.password ? 'border-red-400' : 'border-border'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-body"
                >
                  {showPass ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <IconLoader2 size={18} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent-green font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
