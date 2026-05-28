import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { DatePicker } from '../../components/ui/DatePicker';

function passwordStrength(p: string): { score: number; label: string; color: string } {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const map = [
    { label: '', color: 'bg-border' },
    { label: 'Weak', color: 'bg-red-400' },
    { label: 'Fair', color: 'bg-yellow-400' },
    { label: 'Good', color: 'bg-blue-400' },
    { label: 'Strong', color: 'bg-accent-green' },
  ];
  return { score, ...map[score] };
}

function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
      style={{ background: 'linear-gradient(145deg, #4F8CFF 0%, #00C2D8 55%, #00D4AA 100%)' }}>
      <svg className="absolute top-10 left-10 opacity-20" width="140" height="60" viewBox="0 0 140 60" fill="none">
        <path d="M4 30 Q22 6 40 30 Q58 54 76 30 Q94 6 112 30 Q130 54 148 30" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
      </svg>
      <svg className="absolute top-1/2 right-6 opacity-15" width="60" height="160" viewBox="0 0 60 160" fill="none">
        <path d="M30 4 Q56 24 30 44 Q4 64 30 84 Q56 104 30 124 Q4 144 30 164" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>
      <svg className="absolute bottom-20 left-10 opacity-20" width="90" height="90" viewBox="0 0 90 90" fill="none">
        <circle cx="10" cy="10" r="5" fill="white"/><circle cx="35" cy="6" r="3" fill="white"/>
        <circle cx="70" cy="15" r="6" fill="white"/><circle cx="20" cy="45" r="4" fill="white"/>
        <circle cx="58" cy="55" r="3" fill="white"/><circle cx="8" cy="75" r="5" fill="white"/>
        <circle cx="80" cy="80" r="4" fill="white"/><circle cx="45" cy="80" r="3" fill="white"/>
      </svg>
      <svg className="absolute -top-16 -right-16 opacity-10" width="200" height="200" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="90" stroke="white" strokeWidth="10"/>
        <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="5"/>
      </svg>
      <div className="absolute top-1/3 right-24 text-5xl opacity-20 select-none -rotate-12">✈️</div>
      <div className="absolute bottom-2/5 left-14 text-4xl opacity-15 select-none rotate-8">🎭</div>
      <div className="absolute top-1/2 left-1/3 text-3xl opacity-15 select-none rotate-12">🍽️</div>
      <span className="relative text-white text-2xl font-bold z-10">Meytle</span>
      <div className="relative z-10">
        <h1 className="text-white text-5xl font-extrabold leading-tight mb-4">
          Your next<br />great<br />experience<br />starts here.
        </h1>
        <p className="text-white/70 text-base">Join thousands discovering companions for every occasion.</p>
      </div>
      <p className="relative z-10 text-white/35 text-xs">© 2025 Meytle</p>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ fullName: '', dateOfBirth: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof typeof form, boolean>>>({});

  const strength = passwordStrength(form.password);

  const validateField = (field: keyof typeof form, value: string) => {
    const e = { ...errors };
    if (field === 'fullName') { if (!value.trim()) e.fullName = 'Required'; else delete e.fullName; }
    if (field === 'dateOfBirth') { if (!value) e.dateOfBirth = 'Required'; else delete e.dateOfBirth; }
    if (field === 'email') { if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email'; else delete e.email; }
    if (field === 'password') { if (value.length < 8) e.password = 'At least 8 characters'; else delete e.password; }
    setErrors(e);
  };

  const handleBlur = (field: keyof typeof form) => {
    setTouched((t) => ({ ...t, [field]: true }));
    validateField(field, form[field]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, dateOfBirth: true, email: true, password: true });
    const newErrors: Partial<typeof form> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Required';
    if (!form.dateOfBirth) newErrors.dateOfBirth = 'Required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Enter a valid email';
    if (form.password.length < 8) newErrors.password = 'At least 8 characters';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const data = await authApi.register(form);
      setAuth(data.accessToken, data.user);
      navigate('/home', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg ?? 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (name: keyof typeof form) =>
    `w-full px-4 py-3 rounded-xl border bg-surface text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/40 transition ${
      errors[name] && touched[name] ? 'border-red-400' : 'border-border'
    }`;

  const field = (name: keyof typeof form, label: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="block text-sm font-medium text-body mb-1.5">{label}</label>
      <input
        value={form[name]}
        onChange={(e) => { setForm((f) => ({ ...f, [name]: e.target.value })); if (touched[name]) validateField(name, e.target.value); }}
        onBlur={() => handleBlur(name)}
        className={inputClass(name)}
        {...extra}
      />
      {errors[name] && touched[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <BrandPanel />
      <div className="flex-1 flex items-center justify-center bg-surface-mint px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <span className="text-3xl font-bold gradient-primary-text">Meytle</span>
          </div>
          <h2 className="text-2xl font-extrabold text-heading mb-1">Create your account</h2>
          <p className="text-muted mb-8">Start discovering companions near you</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {field('fullName', 'Full name', { placeholder: 'Aditya Agarwal' })}

            <div>
              <label className="block text-sm font-medium text-body mb-1.5">Date of birth</label>
              <DatePicker
                value={form.dateOfBirth}
                onChange={(v) => {
                  setForm((f) => ({ ...f, dateOfBirth: v }));
                  setTouched((t) => ({ ...t, dateOfBirth: true }));
                  validateField('dateOfBirth', v);
                }}
                placeholder="Select your date of birth"
              />
              {errors.dateOfBirth && touched.dateOfBirth && (
                <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
              )}
            </div>

            {field('email', 'Email', { type: 'email', placeholder: 'you@example.com' })}

            {/* Password with strength */}
            <div>
              <label className="block text-sm font-medium text-body mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); if (touched.password) validateField('password', e.target.value); }}
                  onBlur={() => handleBlur('password')}
                  placeholder="At least 8 characters"
                  className={`${inputClass('password')} pr-12`}
                />
                <button type="button" onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-body">
                  {showPass ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-border'}`} />
                  ))}
                  <span className="ml-2 text-xs text-muted w-12">{strength.label}</span>
                </div>
              )}
              {errors.password && touched.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading && <IconLoader2 size={18} className="animate-spin" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-green font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
