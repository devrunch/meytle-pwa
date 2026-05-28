import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconCalendarEvent, IconClock, IconMapPin, IconLoader2, IconX,
  IconBolt, IconCurrencyRupee, IconChevronRight, IconMessage2,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import type { Booking } from '../../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function isChatOpen(booking: Booking): boolean {
  const now = Date.now();
  const start = new Date(booking.bookedStart).getTime();
  const end = new Date(booking.bookedEnd).getTime();
  return now >= start - 3 * 60 * 60 * 1000 && now <= end;
}

function rupees(paisa: number) {
  return `₹${(paisa / 100).toLocaleString('en-IN')}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const STATUS_CFG = {
  pending:     { label: 'Pending',     bg: '#FEF3C7', color: '#D97706', dot: '#F59E0B' },
  confirmed:   { label: 'Confirmed',   bg: '#D1FAE5', color: '#059669', dot: '#10B981' },
  in_progress: { label: 'In Progress', bg: '#DBEAFE', color: '#2563EB', dot: '#3B82F6' },
  completed:   { label: 'Completed',   bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
  cancelled:   { label: 'Cancelled',   bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' },
} as const;

// ── OTP Modal ─────────────────────────────────────────────────────────────────

function OtpModal({ booking, onClose }: {
  booking: Booking;
  onClose: () => void;
}) {
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
          <p className="text-base font-bold text-heading">Start Session</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-gray-100 transition">
            <IconX size={14} />
          </button>
        </div>
        <p className="text-sm text-muted mb-5">
          Read this code aloud to <b>{booking.companion?.displayName}</b> when you meet.<br />
          They'll enter it in their app to start the session.
        </p>

        {loading ? (
          <div className="flex justify-center py-6">
            <IconLoader2 size={24} className="animate-spin text-teal-500" />
          </div>
        ) : otpCode ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-4">
              {otpCode.split('').map((d, i) => (
                <div key={i} className="w-11 h-14 rounded-xl flex items-center justify-center text-2xl font-extrabold text-heading border-2 border-accent-green/40 bg-teal-50">
                  {d}
                </div>
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

        <button onClick={onClose}
          className="w-full py-3 rounded-xl border border-border text-sm font-semibold text-muted hover:bg-gray-50 transition">
          Close
        </button>
      </div>
    </div>
  );
}

// ── Booking card ──────────────────────────────────────────────────────────────

function BookingCard({ booking, onCancel, onShowOtp }: {
  booking: Booking;
  onCancel: (id: string) => void;
  onShowOtp: (b: Booking) => void;
}) {
  const navigate = useNavigate();
  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.pending;
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try { await onCancel(booking.id); } finally { setCancelling(false); }
  };

  const companion = booking.companion;

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
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

      {/* Details */}
      <div className="px-4 pb-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <IconCalendarEvent size={12} className="shrink-0" />
          <span>{fmtDate(booking.bookedStart)} · {fmtTime(booking.bookedStart)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <IconClock size={12} className="shrink-0" />
          <span>{booking.bookedDurationMinutes / 60} hour{booking.bookedDurationMinutes > 60 ? 's' : ''}</span>
        </div>
        {booking.meetingSpotText && (
          <div className="flex items-start gap-1.5 text-xs text-muted">
            <IconMapPin size={12} className="shrink-0 mt-0.5" />
            <span className="truncate">{booking.meetingSpotText}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-heading">
          <IconCurrencyRupee size={12} className="shrink-0" />
          <span>{rupees(booking.amountPaisa)}</span>
        </div>
      </div>

      {/* Actions */}
      {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'in_progress') && (
        <div className="px-4 pb-4 flex gap-2">
          {booking.status === 'confirmed' && (
            <button onClick={() => onShowOtp(booking)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-semibold transition-opacity hover:opacity-90"
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
            <button onClick={handleCancel} disabled={cancelling}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition disabled:opacity-60">
              {cancelling ? <IconLoader2 size={12} className="animate-spin" /> : <IconX size={12} />}
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type Tab = 'upcoming' | 'past';

export function BookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<Tab>('upcoming');
  const [otpBooking, setOtpBooking] = useState<Booking | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get<Booking[]>('/bookings');
      setBookings(data);
    } catch {
      toast.error('Could not load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id: string) => {
    try {
      await client.patch(`/bookings/${id}/cancel`);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled');
    } catch {
      toast.error('Could not cancel booking');
    }
  };

  const upcoming = bookings.filter((b) =>
    ['pending', 'confirmed', 'in_progress'].includes(b.status)
  ).sort((a, b) => new Date(a.bookedStart).getTime() - new Date(b.bookedStart).getTime());

  const past = bookings.filter((b) =>
    ['completed', 'cancelled'].includes(b.status)
  ).sort((a, b) => new Date(b.bookedStart).getTime() - new Date(a.bookedStart).getTime());

  const displayed = tab === 'upcoming' ? upcoming : past;

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
        {(['upcoming', 'past'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold capitalize relative transition-colors ${tab === t ? '' : 'text-muted'}`}
            style={tab === t ? { color: '#00D4AA' } : {}}>
            {t} {tab === t && (
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
          <div className="text-5xl mb-4">{tab === 'upcoming' ? '📅' : '📦'}</div>
          <p className="text-base font-semibold text-heading mb-1">
            {tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
          </p>
          <p className="text-sm text-muted mb-6">
            {tab === 'upcoming' ? 'Book a companion to get started' : 'Completed sessions will appear here'}
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
          {displayed.map((b) => (
            <BookingCard key={b.id} booking={b} onCancel={handleCancel} onShowOtp={setOtpBooking} />
          ))}
        </div>
      )}

      {otpBooking && (
        <OtpModal booking={otpBooking} onClose={() => setOtpBooking(null)} />
      )}
    </div>
  );
}
