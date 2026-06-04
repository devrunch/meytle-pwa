import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconLoader2, IconMailCheck, IconRefresh } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export function VerifyEmailPage() {
  const navigate   = useNavigate();
  const user       = useAuthStore((s) => s.user);
  const setAuth    = useAuthStore((s) => s.setAuth);
  const [digits, setDigits]     = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerify]  = useState(false);
  const [sending, setSending]   = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs               = useRef<(HTMLInputElement | null)[]>([]);

  // auto-send on mount
  useEffect(() => { send(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    if (cooldown > 0 || sending) return;
    setSending(true);
    try {
      await authApi.sendEmailOtp();
      setCooldown(RESEND_COOLDOWN);
      toast.success('Code sent — check your inbox');
    } catch {
      toast.error('Could not send code. Try again.');
    } finally { setSending(false); }
  };

  const handleInput = (i: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    if (char && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = [...digits];
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) return;
    setVerify(true);
    try {
      const data = await authApi.verifyEmail(otp);
      setAuth(data.accessToken, data.user);
      toast.success('Email verified!');
      navigate('/home', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Invalid code');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally { setVerify(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-mint px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
            <IconMailCheck size={30} className="text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-heading text-center mb-1">Check your email</h2>
        <p className="text-sm text-muted text-center mb-8">
          We sent a 6-digit code to <span className="font-semibold text-body">{user?.email}</span>
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* OTP boxes */}
          <div className="flex gap-2.5 justify-center mb-6">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-surface text-heading focus:outline-none transition-all"
                style={{
                  borderColor: d ? 'var(--color-accent-green, #00D4AA)' : undefined,
                  boxShadow: d ? '0 0 0 3px rgba(0,212,170,0.15)' : undefined,
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={verifying || digits.join('').length < OTP_LENGTH}
            className="btn-primary w-full flex items-center justify-center gap-2 mb-4">
            {verifying && <IconLoader2 size={18} className="animate-spin" />}
            {verifying ? 'Verifying…' : 'Verify email'}
          </button>
        </form>

        {/* Resend */}
        <div className="text-center">
          {cooldown > 0 ? (
            <p className="text-sm text-muted">Resend in {cooldown}s</p>
          ) : (
            <button
              onClick={send}
              disabled={sending}
              className="text-sm text-accent-green font-semibold hover:underline flex items-center gap-1.5 mx-auto disabled:opacity-50">
              {sending
                ? <IconLoader2 size={14} className="animate-spin" />
                : <IconRefresh size={14} />}
              {sending ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
