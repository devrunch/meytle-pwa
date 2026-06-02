import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IconArrowLeft, IconLoader2, IconDeviceFloppy,
  IconCurrencyRupee, IconBan, IconRefresh, IconAlertCircle,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import type { Booking } from '../../types';

const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: '#F59E0B', bg: '#F59E0B18', label: 'Pending' },
  confirmed:   { color: '#10B981', bg: '#10B98118', label: 'Confirmed' },
  in_progress: { color: '#3B82F6', bg: '#3B82F618', label: 'In Progress' },
  completed:   { color: '#6B7280', bg: '#6B728018', label: 'Completed' },
  cancelled:   { color: '#EF4444', bg: '#EF444418', label: 'Cancelled' },
};

const STATUS_OPTIONS = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const INPUT = "w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-teal-500/40 transition";
const INPUT_STYLE = { background: '#0B1120', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' };

function rupees(p: number) {
  return `$${(p / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-6" style={{ background: '#131E30', borderColor: 'rgba(255,255,255,0.07)' }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>{title}</p>
      {children}
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{value ?? '—'}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</label>
      {children}
    </div>
  );
}

export function AdminBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Payment action states
  const [capturing, setCapturing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [captureAmount, setCaptureAmount] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  // Edit fields
  const [status, setStatus] = useState('');
  const [companionPayoutPaisa, setCompanionPayoutPaisa] = useState('');
  const [platformFeePaisa, setPlatformFeePaisa] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    if (!id) return;
    client.get<Booking>(`/admin/bookings/${id}`)
      .then(({ data: b }) => {
        setBooking(b);
        setStatus(b.status);
        setCompanionPayoutPaisa((b as any).companionPayoutPaisa != null ? String((b as any).companionPayoutPaisa / 100) : '');
        setPlatformFeePaisa((b as any).platformFeePaisa != null ? String((b as any).platformFeePaisa / 100) : '');
        setCancellationReason((b as any).cancellationReason ?? '');
      })
      .catch(() => { toast.error('Booking not found'); navigate('/admin/bookings'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await client.patch<Booking>(`/admin/bookings/${id}`, {
        status,
        companionPayoutPaisa: companionPayoutPaisa ? Math.round(parseFloat(companionPayoutPaisa) * 100) : undefined,
        platformFeePaisa: platformFeePaisa ? Math.round(parseFloat(platformFeePaisa) * 100) : undefined,
        cancellationReason: cancellationReason || null,
      });
      setBooking((prev) => ({ ...prev!, ...data }));
      toast.success('Booking saved');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Save failed');
    } finally { setSaving(false); }
  };

  const handleCapture = async () => {
    setCapturing(true);
    try {
      await client.post(`/admin/bookings/${id}/capture`, {
        amountPaisa: captureAmount ? Math.round(parseFloat(captureAmount) * 100) : undefined,
      });
      toast.success('Payment captured');
      const { data } = await client.get<Booking>(`/admin/bookings/${id}`);
      setBooking(data);
      setStatus(data.status);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Capture failed');
    } finally { setCapturing(false); }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Enter a reason before cancelling'); return; }
    setCancelling(true);
    try {
      await client.post(`/admin/bookings/${id}/cancel`, { reason: cancelReason });
      toast.success('Booking cancelled');
      const { data } = await client.get<Booking>(`/admin/bookings/${id}`);
      setBooking(data);
      setStatus(data.status);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Cancel failed');
    } finally { setCancelling(false); }
  };

  const handleRefund = async () => {
    setRefunding(true);
    try {
      await client.post(`/admin/bookings/${id}/refund`, {
        amountPaisa: refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined,
      });
      toast.success('Refund issued');
      const { data } = await client.get<Booking>(`/admin/bookings/${id}`);
      setBooking(data);
      setStatus(data.status);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Refund failed');
    } finally { setRefunding(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader2 size={28} className="animate-spin" style={{ color: '#00D4AA' }} />
      </div>
    );
  }
  if (!booking) return null;

  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.pending;
  const isCancelled = booking.status === 'cancelled';
  const isCompleted = booking.status === 'completed';
  const isActive = !isCancelled && !isCompleted;

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate('/admin/bookings')}
          className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors hover:bg-white/5"
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          <IconArrowLeft size={15} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-white">Booking Detail</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            ID: {booking.id.slice(0, 8)}… · {(booking as any).user?.fullName ?? '—'}
            <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 4px' }}>→</span>
            {booking.companion?.displayName ?? '—'}
          </p>
        </div>
        <span className="text-[11px] font-bold px-3 py-1 rounded-full"
          style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      <div className="space-y-4">
        {/* Summary */}
        <Section title="Summary">
          <div className="grid grid-cols-3 gap-4">
            <ReadonlyField label="Service" value={<span className="capitalize">{booking.serviceType.replace(/_/g, ' ')}</span>} />
            <ReadonlyField label="Amount" value={rupees(booking.amountPaisa)} />
            <ReadonlyField label="Duration"
              value={`${booking.bookedDurationMinutes / 60}h`} />
            <ReadonlyField label="Start"
              value={new Date(booking.bookedStart).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} />
            <ReadonlyField label="End"
              value={new Date(booking.bookedEnd).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} />
            <ReadonlyField label="Stripe PI"
              value={(booking as any).stripePaymentIntentId
                ? <span className="font-mono text-[11px]">{(booking as any).stripePaymentIntentId}</span>
                : 'None'} />
          </div>
        </Section>

        {/* Edit */}
        <Section title="Edit">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <select className={INPUT} style={INPUT_STYLE} value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-slate-900 capitalize">{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </Field>
              <Field label="Cancellation Reason">
                <input className={INPUT} style={INPUT_STYLE}
                  value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Only relevant if cancelled" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Companion Payout ($)">
                <input type="number" className={INPUT} style={INPUT_STYLE}
                  value={companionPayoutPaisa} onChange={(e) => setCompanionPayoutPaisa(e.target.value)} />
              </Field>
              <Field label="Platform Fee ($)">
                <input type="number" className={INPUT} style={INPUT_STYLE}
                  value={platformFeePaisa} onChange={(e) => setPlatformFeePaisa(e.target.value)} />
              </Field>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
              <IconDeviceFloppy size={15} />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </Section>

        {/* Payment Actions */}
        <Section title="Payment Actions">
          {isCancelled && (
            <div className="flex items-center gap-2 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <IconAlertCircle size={14} style={{ color: '#F87171' }} />
              <p className="text-xs" style={{ color: '#F87171' }}>
                This booking is cancelled. No payment actions are available.
              </p>
            </div>
          )}

          {isCompleted && (
            <div className="space-y-4">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Booking is completed. You can issue a partial or full refund.
              </p>
              <div className="p-4 rounded-xl border space-y-3" style={{ background: '#0B1120', borderColor: 'rgba(239,68,68,0.2)' }}>
                <p className="text-xs font-semibold" style={{ color: '#FCA5A5' }}>Issue Refund</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder={`Full amount: ${rupees(booking.amountPaisa)}`}
                    className="flex-1 px-3 py-2 rounded-xl text-sm border focus:outline-none"
                    style={INPUT_STYLE}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                  <button onClick={handleRefund} disabled={refunding}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap disabled:opacity-50"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <IconRefresh size={13} />
                    {refunding ? 'Refunding…' : 'Refund'}
                  </button>
                </div>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Leave amount blank to refund the full amount.
                </p>
              </div>
            </div>
          )}

          {isActive && (
            <div className="space-y-4">
              {/* Capture */}
              <div className="p-4 rounded-xl border space-y-3" style={{ background: '#0B1120', borderColor: 'rgba(0,212,170,0.2)' }}>
                <p className="text-xs font-semibold" style={{ color: '#5EEAD4' }}>Capture Payment</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder={`Full amount: ${rupees(booking.amountPaisa)}`}
                    className="flex-1 px-3 py-2 rounded-xl text-sm border focus:outline-none"
                    style={INPUT_STYLE}
                    value={captureAmount}
                    onChange={(e) => setCaptureAmount(e.target.value)}
                  />
                  <button onClick={handleCapture} disabled={capturing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap disabled:opacity-50"
                    style={{ background: 'rgba(0,212,170,0.15)', color: '#5EEAD4', border: '1px solid rgba(0,212,170,0.25)' }}>
                    <IconCurrencyRupee size={13} />
                    {capturing ? 'Capturing…' : 'Capture'}
                  </button>
                </div>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Leave amount blank to capture the full authorised amount.
                </p>
              </div>

              {/* Cancel / void */}
              <div className="p-4 rounded-xl border space-y-3" style={{ background: '#0B1120', borderColor: 'rgba(239,68,68,0.2)' }}>
                <p className="text-xs font-semibold" style={{ color: '#FCA5A5' }}>Cancel & Void</p>
                <div className="flex items-center gap-3">
                  <input
                    placeholder="Reason (required)"
                    className="flex-1 px-3 py-2 rounded-xl text-sm border focus:outline-none"
                    style={INPUT_STYLE}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <button onClick={handleCancel} disabled={cancelling}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap disabled:opacity-50"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <IconBan size={13} />
                    {cancelling ? 'Cancelling…' : 'Cancel & Void'}
                  </button>
                </div>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Voids the Stripe payment intent and marks the booking cancelled.
                </p>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
