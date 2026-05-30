import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconLoader2, IconMailCheck } from '@tabler/icons-react';
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

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Enter a valid email address');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
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

          {sent ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-green/10 mb-6">
                <IconMailCheck size={32} className="text-accent-green" />
              </div>
              <h2 className="text-2xl font-extrabold text-heading mb-2">Check your email</h2>
              <p className="text-muted mb-6">
                If <span className="text-body font-medium">{email}</span> is registered, you'll receive a reset link shortly. Check your spam folder if it doesn't arrive.
              </p>
              <Link
                to="/login"
                className="text-accent-green font-semibold hover:underline text-sm"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold text-heading mb-1">Forgot password?</h2>
              <p className="text-muted mb-8">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-body mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={validate}
                    placeholder="you@example.com"
                    className={`w-full px-4 py-3 rounded-xl border bg-surface text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/40 transition ${
                      error ? 'border-red-400' : 'border-border'
                    }`}
                  />
                  {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading && <IconLoader2 size={18} className="animate-spin" />}
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted">
                Remember your password?{' '}
                <Link to="/login" className="text-accent-green font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
