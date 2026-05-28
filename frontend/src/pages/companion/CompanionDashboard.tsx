import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  IconStar, IconCalendarEvent, IconCurrencyRupee, IconEdit,
  IconToggleLeft, IconToggleRight, IconClock, IconCheck,
  IconX, IconLoader2, IconUser, IconChartBar, IconBell,
  IconMapPin, IconArrowRight, IconBrandStripe, IconWallet,
  IconCircleCheck, IconAlertCircle,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { CompanionProfile, Booking, CompanionAvailability } from '../../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function rupees(paisa: number) {
  return `₹${(paisa / 100).toLocaleString('en-IN')}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pending',     color: '#F59E0B', bg: '#FEF3C7' },
  confirmed:   { label: 'Confirmed',   color: '#10B981', bg: '#D1FAE5' },
  in_progress: { label: 'In Progress', color: '#4F8CFF', bg: '#DBEAFE' },
  completed:   { label: 'Completed',   color: '#6B7280', bg: '#F3F4F6' },
  cancelled:   { label: 'Cancelled',   color: '#EF4444', bg: '#FEE2E2' },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 23; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 23) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

type DaySlot = { enabled: boolean; fromTime: string; toTime: string };
const DEFAULT_SLOT: DaySlot = { enabled: false, fromTime: '09:00', toTime: '21:00' };

// ── Sub-components ──────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, gradient }: {
  icon: React.ElementType; label: string; value: string; sub?: string; gradient: string;
}) {
  return (
    <div className="bg-surface rounded-2xl p-5 flex items-start gap-4 shadow-sm border border-white/40">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: gradient }}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-muted font-medium mb-0.5">{label}</p>
        <p className="text-xl font-bold text-heading">{value}</p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function BookingRow({ booking, onAccept, onDecline }: {
  booking: Booking;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.pending;
  const [busy, setBusy] = useState(false);

  async function handle(action: 'accept' | 'decline') {
    setBusy(true);
    try {
      if (action === 'accept') await onAccept(booking.id);
      else await onDecline(booking.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl hover:bg-black/[0.02] transition-colors">
      <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
        {booking.user?.avatarUrl
          ? <img src={booking.user.avatarUrl} alt="" className="w-full h-full object-cover" />
          : (booking.user?.fullName?.[0] ?? '?')}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm text-heading truncate">{booking.user?.fullName ?? 'User'}</p>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ color: cfg.color, background: cfg.bg }}>
            {cfg.label}
          </span>
        </div>
        <p className="text-xs text-muted mt-0.5 capitalize">{booking.serviceType.replace('_', ' ')} · {rupees(booking.amountPaisa)}</p>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted">
          <IconClock size={11} />
          <span>{fmtDate(booking.bookedStart)} · {fmtTime(booking.bookedStart)}</span>
        </div>
        {booking.meetingSpotText && (
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted">
            <IconMapPin size={11} />
            <span className="truncate">{booking.meetingSpotText}</span>
          </div>
        )}
      </div>

      {booking.status === 'pending' && (
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button onClick={() => handle('accept')} disabled={busy}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-transform active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
            {busy ? <IconLoader2 size={14} className="animate-spin" /> : <IconCheck size={14} />}
          </button>
          <button onClick={() => handle('decline')} disabled={busy}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 text-red-500 transition-transform active:scale-95 disabled:opacity-60">
            <IconX size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Availability Schedule ──────────────────────────────────────────────────────

function AvailabilitySection({ profileId }: { profileId: string }) {
  const [slots, setSlots] = useState<DaySlot[]>(Array(7).fill(null).map(() => ({ ...DEFAULT_SLOT })));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client.get<CompanionAvailability[]>(`/companions/me/availability`)
      .then((r) => {
        if (r.data.length > 0) {
          const next: DaySlot[] = Array(7).fill(null).map(() => ({ ...DEFAULT_SLOT }));
          r.data.forEach((s) => {
            next[s.dayOfWeek] = { enabled: true, fromTime: s.fromTime.slice(0, 5), toTime: s.toTime.slice(0, 5) };
          });
          setSlots(next);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profileId]);

  const toggle = (i: number) => {
    setSlots((prev) => prev.map((s, idx) => idx === i ? { ...s, enabled: !s.enabled } : s));
  };

  const update = (i: number, field: 'fromTime' | 'toTime', val: string) => {
    setSlots((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = slots
        .map((s, i) => s.enabled ? { dayOfWeek: i, fromTime: s.fromTime, toTime: s.toTime } : null)
        .filter(Boolean);
      await client.put('/companions/me/availability', { slots: payload });
      toast.success('Schedule saved!');
    } catch {
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-2xl border border-white/40 shadow-sm p-5 flex justify-center py-10">
        <IconLoader2 size={22} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-white/40 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-black/[0.05] flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg,#F7FBFA,#F6FAFF)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
            <IconClock size={17} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-heading">Availability Schedule</p>
            <p className="text-[11px] text-muted">Set when you're open to bookings</p>
          </div>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
          {saving ? <IconLoader2 size={12} className="animate-spin" /> : <IconCheck size={12} />}
          Save
        </button>
      </div>

      <div className="divide-y divide-black/[0.04]">
        {DAYS.map((day, i) => {
          const s = slots[i];
          return (
            <div key={day} className={`flex items-center gap-3 px-5 py-3 transition-colors ${s.enabled ? '' : 'opacity-50'}`}>
              {/* Day toggle */}
              <button onClick={() => toggle(i)}
                className="flex items-center gap-2 w-16 shrink-0 group">
                <div className={`w-9 h-5 rounded-full relative transition-colors ${s.enabled ? '' : 'bg-gray-200'}`}
                  style={s.enabled ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-xs font-semibold text-heading w-7">{day}</span>
              </button>

              {/* Time pickers */}
              {s.enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <select value={s.fromTime} onChange={(e) => update(i, 'fromTime', e.target.value)}
                    className="flex-1 text-xs font-medium text-body bg-surface-alt border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-accent-green/50 focus:ring-2 focus:ring-accent-green/10 transition appearance-none cursor-pointer">
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-xs text-muted font-medium shrink-0">to</span>
                  <select value={s.toTime} onChange={(e) => update(i, 'toTime', e.target.value)}
                    className="flex-1 text-xs font-medium text-body bg-surface-alt border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-accent-green/50 focus:ring-2 focus:ring-accent-green/10 transition appearance-none cursor-pointer">
                    {TIME_OPTIONS.filter((t) => t > s.fromTime).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ) : (
                <span className="text-xs text-muted flex-1">Unavailable</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stripe Payout Setup ────────────────────────────────────────────────────────

function PayoutSection({ profile }: { profile: CompanionProfile }) {
  const navigate = useNavigate();

  const header = (
    <div className="px-5 py-4 border-b border-black/[0.05]"
      style={{ background: 'linear-gradient(135deg,#F7FBFA,#F6FAFF)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#635BFF,#0570DE)' }}>
          <IconBrandStripe size={17} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-heading">Payout Account</p>
          <p className="text-[11px] text-muted">Receive earnings via Stripe</p>
        </div>
      </div>
    </div>
  );

  if (profile.stripePayoutsEnabled) {
    return (
      <div className="bg-surface rounded-2xl border border-white/40 shadow-sm overflow-hidden">
        {header}
        <div className="p-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <IconCircleCheck size={20} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-700">Payouts Active</p>
              <p className="text-xs text-emerald-600 mt-0.5">Earnings transfer automatically after each session.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-white/40 shadow-sm overflow-hidden">
      {header}
      <div className="p-5 space-y-4">
        {profile.stripeConnectedAccountId ? (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
            <IconAlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-700">Setup Incomplete</p>
              <p className="text-xs text-amber-600 mt-0.5">Complete your Stripe account to enable payouts.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: IconWallet,        text: 'Direct bank transfers' },
              { icon: IconCheck,         text: 'Auto payouts after sessions' },
              { icon: IconCurrencyRupee, text: 'INR payouts supported' },
              { icon: IconClock,         text: '2-7 business days' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-muted">
                <Icon size={13} className="text-accent-green shrink-0" />{text}
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => navigate('/become-companion')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#635BFF,#0570DE)' }}>
          <IconBrandStripe size={15} />
          {profile.stripeConnectedAccountId ? 'Continue Payout Setup' : 'Set Up Payout Account'}
        </button>
        {!profile.stripeConnectedAccountId && (
          <p className="text-[11px] text-muted text-center">Powered by Stripe · Bank-level security</p>
        )}
      </div>
    </div>
  );
}

// ── Identity Verification ──────────────────────────────────────────────────────

type StripeStatus = {
  payoutsEnabled: boolean;
  identityVerified: boolean;
  requirements: { currentlyDue: string[]; pastDue: string[]; eventuallyDue: string[] };
};

function VerificationSection({ profile }: { profile: CompanionProfile }) {
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile.stripeConnectedAccountId) { setLoading(false); return; }
    client.get<StripeStatus>('/companions/me/stripe-status')
      .then((r) => setStripeStatus(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile.stripeConnectedAccountId]);

  const isVerified =
    (profile.identityVerifiedByStripe ?? false) ||
    (profile.identityVerifiedByVeriff ?? false) ||
    (profile.identityVerifiedByAdmin ?? false);

  const methods = [
    { label: 'Stripe Identity', verified: profile.identityVerifiedByStripe ?? false, desc: 'Automated identity check via Stripe', primary: true },
    { label: 'Veriff',          verified: profile.identityVerifiedByVeriff ?? false,  desc: 'Government ID verification via Veriff', primary: false },
    { label: 'Admin Review',    verified: profile.identityVerifiedByAdmin ?? false,   desc: 'Manual review by Meytle team', primary: false },
  ];

  const urgentReqs = stripeStatus
    ? [
        ...stripeStatus.requirements.pastDue.map((r) => ({ item: r, level: 'past_due' as const })),
        ...stripeStatus.requirements.currentlyDue.map((r) => ({ item: r, level: 'due' as const })),
      ].filter((r, i, arr) => arr.findIndex((x) => x.item === r.item) === i)
    : [];

  return (
    <div className="bg-surface rounded-2xl border border-white/40 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-black/[0.05]"
        style={{ background: 'linear-gradient(135deg,#F7FBFA,#F6FAFF)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: isVerified ? 'linear-gradient(135deg,#00D4AA,#4F8CFF)' : 'linear-gradient(135deg,#F59E0B,#EF9234)' }}>
              {isVerified
                ? <IconCircleCheck size={17} className="text-white" />
                : <IconAlertCircle size={17} className="text-white" />}
            </div>
            <div>
              <p className="text-sm font-bold text-heading">Identity Verification</p>
              <p className="text-[11px] text-muted">{isVerified ? 'Your identity is confirmed' : 'Verification required to go live'}</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={isVerified ? { background: '#D1FAE5', color: '#059669' } : { background: '#FEF3C7', color: '#D97706' }}>
            {isVerified ? 'Verified' : 'Pending'}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {methods.map((m, i) => (
          <div key={m.label} className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
            style={{ background: m.verified ? '#F0FDF4' : '#F8FAFC' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={m.verified ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : { background: '#E2E8F0' }}>
              {m.verified
                ? <IconCheck size={13} className="text-white" />
                : <span className="text-[11px] font-bold text-slate-400">{i + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-heading">{m.label}</p>
                {m.primary && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">Primary</span>
                )}
              </div>
              <p className="text-[10px] text-muted">{m.desc}</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={m.verified ? { background: '#DCFCE7', color: '#16A34A' } : { background: '#F1F5F9', color: '#94A3B8' }}>
              {m.verified ? 'Verified' : 'Pending'}
            </span>
          </div>
        ))}

        {loading && profile.stripeConnectedAccountId && (
          <div className="flex items-center gap-2 text-xs text-muted px-1">
            <IconLoader2 size={12} className="animate-spin" /> Loading Stripe requirements…
          </div>
        )}

        {!loading && urgentReqs.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
              <IconAlertCircle size={12} /> Stripe needs more info
            </p>
            <ul className="space-y-1.5">
              {urgentReqs.map(({ item, level }) => (
                <li key={item} className="flex items-start gap-2 text-[11px]">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${level === 'past_due' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <span className={level === 'past_due' ? 'text-red-600' : 'text-amber-700'}>
                    {item.replace(/_/g, ' ').replace(/\./g, ' › ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isVerified && (
          <p className="text-[11px] text-muted leading-relaxed px-1">
            You'll be verified once any path above is complete. Set up your payout account to trigger Stripe identity verification.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function CompanionDashboard() {
  const user = useAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<CompanionProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'upcoming' | 'past'>('all');

  // Handle Stripe redirect back
  useEffect(() => {
    const stripeParam = searchParams.get('stripe');
    if (stripeParam === 'success') {
      toast.success('Stripe setup complete! Syncing payout status…');
      client.get('/companions/me/stripe-status')
        .then((r) => {
          if (r.data.payoutsEnabled) setProfile((p) => p ? { ...p, stripePayoutsEnabled: true } : p);
        })
        .catch(() => {});
    } else if (stripeParam === 'refresh') {
      toast('Stripe onboarding session expired. Please try again.', { icon: '⚠️' });
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    try {
      const [prof, bkgs] = await Promise.all([
        client.get('/companions/me/profile').then((r) => r.data),
        client.get('/bookings/companion').then((r) => r.data),
      ]);
      setProfile(prof);
      setBookings(bkgs);
      // Sync Stripe payout + identity status in the background
      if (prof.stripeConnectedAccountId) {
        client.get('/companions/me/stripe-status')
          .then((r) => setProfile((p) => p ? {
            ...p,
            stripePayoutsEnabled:    r.data.payoutsEnabled,
            identityVerifiedByStripe: r.data.identityVerified,
          } : p))
          .catch(() => {});
      }
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleAvailability() {
    if (!profile) return;
    setTogglingAvail(true);
    try {
      await client.patch('/companions/me/profile', { isAvailableNow: !profile.isAvailableNow });
      setProfile((p) => p ? { ...p, isAvailableNow: !p.isAvailableNow } : p);
      toast.success(profile.isAvailableNow ? 'You\'re now offline' : 'You\'re now available!');
    } catch {
      toast.error('Failed to update availability');
    } finally {
      setTogglingAvail(false);
    }
  }

  async function handleAccept(id: string) {
    try {
      await client.patch(`/bookings/${id}/accept`);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'confirmed' } : b));
      toast.success('Booking accepted!');
    } catch {
      toast.error('Failed to accept booking');
    }
  }

  async function handleDecline(id: string) {
    try {
      await client.patch(`/bookings/${id}/decline`);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking declined');
    } catch {
      toast.error('Failed to decline booking');
    }
  }

  // ── Derived stats ──────────────────────────────────────────────────────────

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const totalEarned = completedBookings.reduce((sum, b) => sum + b.amountPaisa, 0);
  const upcomingBookings = bookings.filter((b) =>
    ['confirmed', 'in_progress'].includes(b.status) && new Date(b.bookedStart) > new Date(),
  );

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'pending') return b.status === 'pending';
    if (activeTab === 'upcoming') return ['confirmed', 'in_progress'].includes(b.status);
    if (activeTab === 'past') return ['completed', 'cancelled'].includes(b.status);
    return true;
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <IconLoader2 size={32} className="animate-spin text-teal-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="text-5xl mb-4">🌟</div>
        <h2 className="text-xl font-bold text-heading mb-2">No companion profile yet</h2>
        <p className="text-muted text-sm mb-6">Complete the onboarding to start earning.</p>
        <Link to="/become-companion"
          className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
          style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

      {/* ── Header ── */}
      <div className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: 'linear-gradient(135deg,#00D4AA22,#4F8CFF22)' }}>
        <div className="flex items-start gap-4 p-5 md:p-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
            {profile.profilePhotoUrl
              ? <img src={profile.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
              : (profile.displayName?.[0] ?? '?')}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-heading leading-tight">
                  {profile.displayName}
                </h1>
                <p className="text-sm text-muted mt-0.5">{user?.email}</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full capitalize"
                style={profile.profileStatus === 'active'
                  ? { background: '#D1FAE5', color: '#059669' }
                  : profile.profileStatus === 'pending_verification'
                  ? { background: '#FEF3C7', color: '#D97706' }
                  : { background: '#F3F4F6', color: '#6B7280' }}>
                {profile.profileStatus.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="flex items-center gap-1 text-sm font-semibold text-heading">
                <IconCurrencyRupee size={15} />
                {(profile.hourlyRatePaisa / 100).toLocaleString('en-IN')}/hr
              </span>
              {profile.ratingAvg != null && profile.ratingCount != null && (
                <span className="flex items-center gap-1 text-sm text-amber-500 font-semibold">
                  <IconStar size={14} fill="currentColor" />
                  {profile.ratingAvg.toFixed(1)}
                  <span className="text-muted font-normal">({profile.ratingCount})</span>
                </span>
              )}
              <span className="flex items-center gap-1 text-sm text-muted">
                <IconMapPin size={14} />
                {profile.serviceAreaRadiusKm}km radius
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 md:px-6 pb-5 flex-wrap">
          <button onClick={toggleAvailability} disabled={togglingAvail}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
            style={profile.isAvailableNow
              ? { background: '#D1FAE5', color: '#059669' }
              : { background: '#F3F4F6', color: '#6B7280' }}>
            {togglingAvail
              ? <IconLoader2 size={16} className="animate-spin" />
              : profile.isAvailableNow
              ? <IconToggleRight size={18} />
              : <IconToggleLeft size={18} />}
            {profile.isAvailableNow ? 'Available Now' : 'Set Offline'}
          </button>

          <Link to="/companion/profile"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/70 text-heading transition-all active:scale-95 hover:bg-white">
            <IconEdit size={15} />
            Edit Profile
          </Link>

          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
              style={{ background: '#FEF3C7', color: '#D97706' }}>
              <IconBell size={15} />
              {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={IconCurrencyRupee} label="Total Earned" value={rupees(totalEarned)}
          sub={`${completedBookings.length} sessions`} gradient="linear-gradient(135deg,#00D4AA,#00C2D8)" />
        <StatCard icon={IconCalendarEvent} label="Upcoming" value={String(upcomingBookings.length)}
          sub="confirmed bookings" gradient="linear-gradient(135deg,#4F8CFF,#818CF8)" />
        <StatCard icon={IconStar} label="Rating"
          value={profile.ratingAvg != null ? profile.ratingAvg.toFixed(1) : '—'}
          sub={profile.ratingCount ? `${profile.ratingCount} reviews` : 'No reviews yet'}
          gradient="linear-gradient(135deg,#F59E0B,#EF4444)" />
        <StatCard icon={IconChartBar} label="Total Bookings" value={String(bookings.length)}
          sub={`${pendingCount} pending`} gradient="linear-gradient(135deg,#8B5CF6,#EC4899)" />
      </div>

      {/* ── Main content ── */}
      <div className="lg:flex gap-6 items-start">

        {/* Bookings list */}
        <div className="flex-1 min-w-0">
          <div className="bg-surface rounded-2xl shadow-sm border border-white/40 overflow-hidden">
            <div className="flex border-b border-black/[0.06]">
              {(['all', 'pending', 'upcoming', 'past'] as const).map((tab) => {
                const counts = {
                  all: bookings.length,
                  pending: bookings.filter((b) => b.status === 'pending').length,
                  upcoming: bookings.filter((b) => ['confirmed', 'in_progress'].includes(b.status)).length,
                  past: bookings.filter((b) => ['completed', 'cancelled'].includes(b.status)).length,
                };
                const active = activeTab === tab;
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="flex-1 py-3.5 text-xs font-semibold capitalize relative transition-colors"
                    style={{ color: active ? '#00D4AA' : '#9CA3AF' }}>
                    {tab} {counts[tab] > 0 && <span className="ml-0.5 text-[10px]">({counts[tab]})</span>}
                    {active && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                        style={{ background: 'linear-gradient(90deg,#00D4AA,#4F8CFF)' }} />
                    )}
                  </button>
                );
              })}
            </div>

            {filteredBookings.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-3xl mb-3">📭</div>
                <p className="text-sm text-muted">No {activeTab === 'all' ? '' : activeTab} bookings yet</p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {filteredBookings.map((b) => (
                  <BookingRow key={b.id} booking={b} onAccept={handleAccept} onDecline={handleDecline} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0 mt-6 lg:mt-0">

          {/* Services offered */}
          <div className="bg-surface rounded-2xl p-5 shadow-sm border border-white/40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-heading">Services Offered</h3>
              <Link to="/companion/profile" className="text-[11px] text-accent-green font-semibold hover:underline flex items-center gap-0.5">
                Edit <IconArrowRight size={10} />
              </Link>
            </div>
            {profile.services && profile.services.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.services.map((s) => (
                  <span key={s.id} className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                    style={{ background: '#E0F7F4', color: '#00A896' }}>
                    {s.serviceType.replace('_', ' ')}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No services added yet.</p>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-surface rounded-2xl p-5 shadow-sm border border-white/40">
            <h3 className="text-sm font-bold text-heading mb-3">Quick Actions</h3>
            <div className="space-y-1">
              {[
                { label: 'View Public Profile', to: `/browse`, icon: IconUser },
                { label: 'Manage Bookings', to: `/bookings`, icon: IconCalendarEvent },
              ].map(({ label, to, icon: Icon }) => (
                <Link key={label} to={to}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-black/[0.03] transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} className="text-muted" />
                    <span className="text-sm text-heading">{label}</span>
                  </div>
                  <IconArrowRight size={14} className="text-muted group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          {profile.profileStatus === 'pending_verification' && (
            <div className="rounded-2xl p-4 text-sm"
              style={{ background: 'linear-gradient(135deg,#FEF3C7,#FDE68A22)' }}>
              <p className="font-semibold text-amber-700 mb-1">⏳ Under Review</p>
              <p className="text-amber-600 text-xs leading-relaxed">
                Your profile is being reviewed. You'll be notified once it's approved.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Availability + Verification + Payout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AvailabilitySection profileId={profile.id} />
        <div className="space-y-4">
          <VerificationSection profile={profile} />
          <PayoutSection profile={profile} />
        </div>
      </div>
    </div>
  );
}
