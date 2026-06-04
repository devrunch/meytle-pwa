import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconCalendarEvent, IconClock, IconMapPin, IconLoader2, IconX,
  IconBolt, IconChevronRight, IconMessage2, IconCheck, IconAlertCircle,
  IconUserCircle, IconStar,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { Booking } from '../../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function isChatOpen(booking: Booking): boolean {
  const now = Date.now();
  const start = new Date(booking.bookedStart).getTime();
  const end = new Date(booking.bookedEnd).getTime();
  return now >= start - 3 * 60 * 60 * 1000 && now <= end;
}

function dollars(paisa: number) {
  return `$${(paisa / 100).toLocaleString('en-US')}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const STATUS_CFG = {
  pending:     { label: 'Pending',     bg: '#FEF3C7', color: '#D97706', dot: '#F59E0B' },
  confirmed:   { label: 'Confirmed',   bg: '#D1FAE5', color: '#059669', dot: '#10B981' },
  in_progress: { label: 'In Progress', bg: '#DBEAFE', color: '#2563EB', dot: '#3B82F6' },
  completed:   { label: 'Completed',   bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
  cancelled:   { label: 'Cancelled',   bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' },
} as const;

// ── OTP Modal (user shows OTP to companion) ────────────────────────────────────

function OtpModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get<{ otpCode: string }>(`/bookings/${booking.id}/otp`)
      .then((r) => setOtpCode(r.data.otpCode))
      .catch(() => toast.error('Could not load OTP'))
      .finally(() => setLoading(false));
  }, [booking.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <p className="text-base font-bold text-heading">Show OTP</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-gray-100 transition">
            <IconX size={14} />
          </button>
        </div>
        <p className="text-sm text-muted mb-5">
          Read this code aloud to <b>{booking.companion?.displayName}</b> when you meet.<br />
          They'll enter it to start the session.
        </p>
        {loading ? (
          <div className="flex justify-center py-6"><IconLoader2 size={24} className="animate-spin text-teal-500" /></div>
        ) : otpCode ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-4">
              {otpCode.split('').map((d, i) => (
                <div key={i} className="w-11 h-14 rounded-xl flex items-center justify-center text-2xl font-extrabold text-heading border-2 border-accent-green/40 bg-teal-50">{d}</div>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2.5 mb-4">
              <IconBolt size={13} className="text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-700">Valid for 45 minutes from your booking start time</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-center text-muted py-4">OTP unavailable</p>
        )}
        <button onClick={onClose} className="w-full py-3 rounded-xl border border-border text-sm font-semibold text-muted hover:bg-gray-50 transition">Close</button>
      </div>
    </div>
  );
}

// ── Review Modal ──────────────────────────────────────────────────────────────

function ReviewModal({ booking, onClose, onDone }: {
  booking: Booking;
  onClose: () => void;
  onDone: (bookingId: string) => void;
}) {
  const [stars, setStars]     = useState(0);
  const [hover, setHover]     = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) { toast.error('Please select a star rating'); return; }
    setLoading(true);
    try {
      await client.post('/reviews', { bookingId: booking.id, starRating: stars, comment: comment.trim() || undefined });
      toast.success('Thanks for your feedback!');
      onDone(booking.id);
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast('You already reviewed this session.');
        onDone(booking.id);
      } else {
        toast.error(err.response?.data?.message ?? 'Could not submit review');
      }
    } finally { setLoading(false); }
  };

  const companion = booking.companion;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-black/5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold text-heading">Leave a review</p>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-gray-100 transition">
              <IconX size={14} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-linear-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {companion?.profilePhotoUrl
                ? <img src={companion.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                : companion?.displayName?.[0] ?? '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-heading">{companion?.displayName ?? 'Companion'}</p>
              <p className="text-xs text-muted capitalize">{booking.serviceType.replace('_', ' ')} · {fmtDate(booking.bookedStart)}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Stars */}
          <div>
            <p className="text-xs font-semibold text-muted mb-2.5">How was your experience?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button"
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setStars(s)}
                  className="transition-transform hover:scale-110 active:scale-95">
                  <IconStar size={32}
                    className={`transition-colors ${(hover || stars) >= s ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
            {stars > 0 && (
              <p className="text-xs text-muted mt-1.5">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][stars]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <p className="text-xs font-semibold text-muted mb-1.5">Add a comment <span className="font-normal">(optional)</span></p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Share what made this session special…"
              className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/30 resize-none"
            />
            <p className="text-[10px] text-muted text-right mt-0.5">{comment.length}/300</p>
          </div>

          <button type="submit" disabled={loading || stars === 0}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
            {loading ? <IconLoader2 size={15} className="animate-spin" /> : <IconCheck size={15} />}
            {loading ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── OTP Verify Modal (companion enters OTP from client) ────────────────────────

function VerifyOtpModal({ booking, onClose, onVerified }: {
  booking: Booking;
  onClose: () => void;
  onVerified: (b: Booking) => void;
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const r0 = useRef<HTMLInputElement>(null);
  const r1 = useRef<HTMLInputElement>(null);
  const r2 = useRef<HTMLInputElement>(null);
  const r3 = useRef<HTMLInputElement>(null);
  const r4 = useRef<HTMLInputElement>(null);
  const r5 = useRef<HTMLInputElement>(null);
  const refs = [r0, r1, r2, r3, r4, r5];

  const handleInput = (i: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[i] = char; setDigits(next);
    if (char && i < 5) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const { data } = await client.post<Booking>(`/bookings/${booking.id}/verify-otp`, { otpCode: otp });
      toast.success('Session started!');
      onVerified(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Invalid OTP');
      setDigits(['', '', '', '', '', '']);
      refs[0].current?.focus();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <p className="text-base font-bold text-heading">Enter Client OTP</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-gray-100 transition"><IconX size={14} /></button>
        </div>
        <p className="text-sm text-muted mb-5">Ask <b>{booking.user?.fullName ?? 'the client'}</b> to read their code, then enter it below to start the session.</p>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 justify-center mb-5">
            {digits.map((d, i) => (
              <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-14 text-center text-2xl font-extrabold rounded-xl border-2 bg-surface text-heading focus:outline-none transition-all"
                style={{ borderColor: d ? '#00D4AA' : undefined }} />
            ))}
          </div>
          <button type="submit" disabled={loading || digits.join('').length < 6}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
            {loading ? <IconLoader2 size={15} className="animate-spin" /> : <IconCheck size={15} />}
            {loading ? 'Verifying…' : 'Start Session'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── User booking card ──────────────────────────────────────────────────────────

function BookingCard({ booking, onCancel, onShowOtp, onReview, reviewed }: {
  booking: Booking;
  onCancel: (id: string) => void;
  onShowOtp: (b: Booking) => void;
  onReview: (b: Booking) => void;
  reviewed: boolean;
}) {
  const navigate = useNavigate();
  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.pending;
  const [cancelling, setCancelling] = useState(false);
  const companion = booking.companion;

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-linear-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
          {companion?.profilePhotoUrl
            ? <img src={companion.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
            : (companion?.displayName?.[0] ?? '?')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-heading truncate">{companion?.displayName ?? 'Companion'}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ background: cfg.dot }} />
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-muted capitalize mt-0.5">{booking.serviceType.replace('_', ' ')}</p>
        </div>
        <button onClick={() => navigate(`/companions/${booking.companionId}`)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-gray-50 transition shrink-0">
          <IconChevronRight size={15} />
        </button>
      </div>
      <div className="px-4 pb-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <IconCalendarEvent size={12} className="shrink-0" />
          <span>{fmtDate(booking.bookedStart)} · {fmtTime(booking.bookedStart)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <IconClock size={12} className="shrink-0" />
          <span>{booking.bookedDurationMinutes / 60}h</span>
        </div>
        {booking.meetingSpotText && (
          <div className="flex items-start gap-1.5 text-xs text-muted">
            <IconMapPin size={12} className="shrink-0 mt-0.5" />
            <span className="truncate">{booking.meetingSpotText}</span>
          </div>
        )}
        <p className="text-xs font-semibold text-heading">{dollars(booking.amountPaisa)}</p>
      </div>
      {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'in_progress') && (
        <div className="px-4 pb-4 flex gap-2">
          {booking.status === 'confirmed' && (
            <button onClick={() => onShowOtp(booking)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90 transition"
              style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
              <IconBolt size={13} /> Show OTP
            </button>
          )}
          {(booking.status === 'confirmed' || booking.status === 'in_progress') && isChatOpen(booking) && (
            <button onClick={() => navigate(`/bookings/${booking.id}/chat`)}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-teal-200 text-teal-600 text-xs font-semibold hover:bg-teal-50 transition">
              <IconMessage2 size={12} /> Chat
            </button>
          )}
          {booking.status === 'pending' && (
            <button onClick={async () => { setCancelling(true); try { await onCancel(booking.id); } finally { setCancelling(false); } }}
              disabled={cancelling}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition disabled:opacity-60">
              {cancelling ? <IconLoader2 size={12} className="animate-spin" /> : <IconX size={12} />} Cancel
            </button>
          )}
        </div>
      )}
      {booking.status === 'completed' && !reviewed && (
        <div className="px-4 pb-4">
          <button onClick={() => onReview(booking)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border-2 transition-all active:scale-95"
            style={{ borderColor: '#F59E0B', color: '#D97706', background: '#FFFBEB' }}>
            <IconStar size={13} className="fill-amber-400 text-amber-400" /> Leave a Review
          </button>
        </div>
      )}
      {booking.status === 'completed' && reviewed && (
        <div className="px-4 pb-4">
          <p className="text-center text-xs text-muted flex items-center justify-center gap-1">
            <IconCheck size={11} className="text-accent-green" /> Review submitted
          </p>
        </div>
      )}
    </div>
  );
}

// ── Companion booking card ─────────────────────────────────────────────────────

function CompanionBookingCard({ booking, onUpdate }: {
  booking: Booking;
  onUpdate: (b: Booking) => void;
}) {
  const navigate = useNavigate();
  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.pending;
  const [busy, setBusy] = useState<string | null>(null);
  const [showVerify, setShowVerify] = useState(false);
  const clientUser = booking.user;

  const act = async (action: string, label: string) => {
    setBusy(label);
    try {
      const { data } = await client.patch<Booking>(`/bookings/${booking.id}/${action}`);
      onUpdate(data);
      toast.success(label === 'accept' ? 'Booking accepted' : label === 'decline' ? 'Booking declined' : 'Session ended');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Action failed');
    } finally { setBusy(null); }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        {/* Client info header */}
        <div className="flex items-center gap-3 p-4 pb-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-linear-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
            {clientUser?.avatarUrl
              ? <img src={clientUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              : <IconUserCircle size={22} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-heading truncate">{clientUser?.fullName ?? 'Client'}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ background: cfg.dot }} />
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-muted capitalize mt-0.5">{booking.serviceType.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Details */}
        <div className="px-4 pb-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <IconCalendarEvent size={12} className="shrink-0" />
            <span>{fmtDate(booking.bookedStart)} · {fmtTime(booking.bookedStart)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <IconClock size={12} className="shrink-0" />
            <span>{booking.bookedDurationMinutes / 60}h</span>
          </div>
          {booking.meetingSpotText && (
            <div className="flex items-start gap-1.5 text-xs text-muted">
              <IconMapPin size={12} className="shrink-0 mt-0.5" />
              <span className="truncate">{booking.meetingSpotText}</span>
            </div>
          )}
          <p className="text-xs font-semibold text-heading">{dollars(booking.amountPaisa)}</p>
          {booking.customNote && (
            <div className="flex items-start gap-1.5 text-xs text-muted bg-surface-alt rounded-lg px-2.5 py-2 mt-1">
              <IconAlertCircle size={12} className="shrink-0 mt-0.5 text-amber-500" />
              <span className="italic">{booking.customNote}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex gap-2 flex-wrap">
          {booking.status === 'pending' && (
            <>
              <button onClick={() => act('accept', 'accept')} disabled={!!busy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                {busy === 'accept' ? <IconLoader2 size={12} className="animate-spin" /> : <IconCheck size={12} />} Accept
              </button>
              <button onClick={() => act('decline', 'decline')} disabled={!!busy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition disabled:opacity-60">
                {busy === 'decline' ? <IconLoader2 size={12} className="animate-spin" /> : <IconX size={12} />} Decline
              </button>
            </>
          )}
          {booking.status === 'confirmed' && (
            <>
              {isChatOpen(booking) && (
                <button onClick={() => navigate(`/bookings/${booking.id}/chat`)}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-teal-200 text-teal-600 text-xs font-semibold hover:bg-teal-50 transition">
                  <IconMessage2 size={12} /> Chat
                </button>
              )}
              <button onClick={() => setShowVerify(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90 transition"
                style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                <IconBolt size={13} /> Enter OTP
              </button>
            </>
          )}
          {booking.status === 'in_progress' && (
            <>
              {isChatOpen(booking) && (
                <button onClick={() => navigate(`/bookings/${booking.id}/chat`)}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-teal-200 text-teal-600 text-xs font-semibold hover:bg-teal-50 transition">
                  <IconMessage2 size={12} /> Chat
                </button>
              )}
              <button onClick={() => act('end-session', 'end')} disabled={!!busy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#F59E0B,#EF4444)' }}>
                {busy === 'end' ? <IconLoader2 size={12} className="animate-spin" /> : <IconCheck size={12} />} End Session
              </button>
            </>
          )}
        </div>
      </div>

      {showVerify && (
        <VerifyOtpModal
          booking={booking}
          onClose={() => setShowVerify(false)}
          onVerified={(updated) => { onUpdate(updated); setShowVerify(false); }}
        />
      )}
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type Tab = 'upcoming' | 'past' | 'requests';

export function BookingsPage() {
  const navigate    = useNavigate();
  const isCompanion = useAuthStore((s) => s.isCompanion)();

  const [userBookings, setUserBookings]           = useState<Booking[]>([]);
  const [companionBookings, setCompanionBookings] = useState<Booking[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [tab, setTab]                             = useState<Tab>('upcoming');
  const [otpBooking, setOtpBooking]               = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking]         = useState<Booking | null>(null);
  const [reviewedIds, setReviewedIds]             = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [client.get<Booking[]>('/bookings')];
      if (isCompanion) requests.push(client.get<Booking[]>('/bookings/companion'));
      const [userRes, compRes] = await Promise.all(requests);
      setUserBookings(userRes.data);
      if (compRes) setCompanionBookings(compRes.data);
    } catch {
      toast.error('Could not load bookings');
    } finally {
      setLoading(false);
    }
  }, [isCompanion]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id: string) => {
    try {
      await client.patch(`/bookings/${id}/cancel`);
      setUserBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled');
    } catch {
      toast.error('Could not cancel booking');
    }
  };

  const updateCompanionBooking = (updated: Booking) =>
    setCompanionBookings((prev) => prev.map((b) => b.id === updated.id ? updated : b));

  const upcoming = userBookings
    .filter((b) => ['pending', 'confirmed', 'in_progress'].includes(b.status))
    .sort((a, b) => new Date(a.bookedStart).getTime() - new Date(b.bookedStart).getTime());

  const past = userBookings
    .filter((b) => ['completed', 'cancelled'].includes(b.status))
    .sort((a, b) => new Date(b.bookedStart).getTime() - new Date(a.bookedStart).getTime());

  const requestsUpcoming = companionBookings
    .filter((b) => ['pending', 'confirmed', 'in_progress'].includes(b.status))
    .sort((a, b) => new Date(a.bookedStart).getTime() - new Date(b.bookedStart).getTime());

  const requestsPast = companionBookings
    .filter((b) => ['completed', 'cancelled'].includes(b.status))
    .sort((a, b) => new Date(b.bookedStart).getTime() - new Date(a.bookedStart).getTime());

  const pendingCount = requestsUpcoming.filter((b) => b.status === 'pending').length;

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    ...(isCompanion ? [{ key: 'requests' as Tab, label: 'Requests', badge: pendingCount || undefined }] : []),
  ];

  const displayed =
    tab === 'upcoming' ? upcoming :
    tab === 'past' ? past :
    [...requestsUpcoming, ...requestsPast];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-heading">My Bookings</h1>
          <p className="text-xs text-muted mt-0.5">Track and manage your sessions</p>
        </div>
        <button onClick={() => navigate('/browse')}
          className="text-xs font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
          + Book
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/5 mb-5">
        {tabs.map(({ key, label, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-3 text-sm font-semibold relative transition-colors flex items-center justify-center gap-1.5 ${tab === key ? '' : 'text-muted'}`}
            style={tab === key ? { color: '#00D4AA' } : {}}>
            {label}
            {badge ? (
              <span className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center text-white"
                style={{ background: '#EF4444' }}>{badge}</span>
            ) : null}
            {tab === key && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                style={{ background: 'linear-gradient(90deg,#00D4AA,#4F8CFF)' }} />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <IconLoader2 size={28} className="animate-spin text-teal-500" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">{tab === 'requests' ? '📋' : tab === 'upcoming' ? '📅' : '📦'}</div>
          <p className="text-base font-semibold text-heading mb-1">
            {tab === 'requests' ? 'No booking requests yet' : tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
          </p>
          <p className="text-sm text-muted mb-6">
            {tab === 'requests' ? 'Client requests will appear here' : tab === 'upcoming' ? 'Book a companion to get started' : 'Completed sessions will appear here'}
          </p>
          {tab === 'upcoming' && (
            <button onClick={() => navigate('/browse')}
              className="px-6 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
              Browse Companions
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tab === 'requests'
            ? displayed.map((b) => <CompanionBookingCard key={b.id} booking={b} onUpdate={updateCompanionBooking} />)
            : displayed.map((b) => (
                <BookingCard key={b.id} booking={b}
                  onCancel={handleCancel}
                  onShowOtp={setOtpBooking}
                  onReview={setReviewBooking}
                  reviewed={reviewedIds.has(b.id)}
                />
              ))
          }
        </div>
      )}

      {otpBooking && <OtpModal booking={otpBooking} onClose={() => setOtpBooking(null)} />}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onDone={(id) => { setReviewedIds((prev) => new Set([...prev, id])); setReviewBooking(null); }}
        />
      )}
    </div>
  );
}
