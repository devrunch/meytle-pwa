import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';

function BrandPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
      style={{ background: 'linear-gradient(145deg, #00D4AA 0%, #00C2D8 45%, #4F8CFF 100%)' }}
    >
      <svg className="absolute top-8 right-8 opacity-20" width="120" height="80" viewBox="0 0 120 80" fill="none">
        <path d="M4 40 Q20 10 36 40 Q52 70 68 40 Q84 10 100 40 Q116 70 132 40" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <path d="M4 60 Q20 30 36 60 Q52 90 68 60 Q84 30 100 60" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
      <svg className="absolute bottom-24 left-6 opacity-15" width="100" height="60" viewBox="0 0 100 60" fill="none">
        <path d="M4 30 Q18 8 32 30 Q46 52 60 30 Q74 8 88 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>
      <svg className="absolute -bottom-12 -right-12 opacity-10" width="220" height="220" viewBox="0 0 220 220" fill="none">
        <circle cx="110" cy="110" r="100" stroke="white" strokeWidth="12"/>
        <circle cx="110" cy="110" r="70" stroke="white" strokeWidth="6"/>
      </svg>

      <span className="relative text-white text-2xl font-bold z-10">Meytle</span>

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

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (form.password.length < 8) e.password = 'At least 8 characters';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!token) {
      toast.error('Reset link is missing or invalid. Request a new one.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, form.password);
      toast.success('Password updated! Please sign in.');
      navigate('/login', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-mint px-6">
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-extrabold text-heading mb-2">Invalid link</h2>
          <p className="text-muted mb-6">This reset link is missing or malformed. Request a new one.</p>
          <Link to="/forgot-password" className="btn-primary">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center bg-surface-mint px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <span className="text-3xl font-bold gradient-primary-text">Meytle</span>
          </div>

          <h2 className="text-2xl font-extrabold text-heading mb-1">Set new password</h2>
          <p className="text-muted mb-8">Choose a strong password for your account.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-body mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="At least 8 characters"
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

            <div>
              <label className="block text-sm font-medium text-body mb-1.5">Confirm password</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat your password"
                className={`w-full px-4 py-3 rounded-xl border bg-surface text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/40 transition ${
                  errors.confirm ? 'border-red-400' : 'border-border'
                }`}
              />
              {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <IconLoader2 size={18} className="animate-spin" />}
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            <Link to="/login" className="text-accent-green font-semibold hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
