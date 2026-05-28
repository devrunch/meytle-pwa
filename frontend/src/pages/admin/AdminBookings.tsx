import { useState, useEffect, useCallback } from 'react';
import {
  IconLoader2, IconSearch, IconX, IconBolt, IconCurrencyRupee,
  IconRefresh, IconAlertCircle, IconEdit,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import type { Booking } from '../../types';

interface BookingPage { items: Booking[]; total: number; }

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  pending:     { color: '#F59E0B', bg: '#F59E0B20' },
  confirmed:   { color: '#10B981', bg: '#10B98120' },
  in_progress: { color: '#3B82F6', bg: '#3B82F620' },
  completed:   { color: '#6B7280', bg: '#6B728020' },
  cancelled:   { color: '#EF4444', bg: '#EF444420' },
};

function rupees(p: number) { return `₹${(p / 100).toLocaleString('en-IN')}`; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

// ── Payment Modal ──────────────────────────────────────────────────────────────

function PaymentModal({ booking, onClose, onDone }: {
  booking: Booking;
  onClose: () => void;
  onDone: (updated: Booking) => void;
}) {
  const [tab, setTab] = useState<'capture' | 'refund' | 'cancel' | 'edit'>('capture');
  const [captureAmount, setCaptureAmount] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [editStatus, setEditStatus] = useState(booking.status);
  const [editPayoutPaisa, setEditPayoutPaisa] = useState(String(booking.companion ? Math.round((booking.amountPaisa || 0) * 0.95) : 0));
  const [editPlatformPaisa, setEditPlatformPaisa] = useState(String(Math.round((booking.amountPaisa || 0) * 0.05)));
  const [loading, setLoading] = useState(false);

  const doCapture = async () => {
    setLoading(true);
    try {
      const body = captureAmount ? { amountPaisa: parseInt(captureAmount) * 100 } : {};
      const { data } = await client.post(`/admin/bookings/${booking.id}/capture`, body);
      toast.success('Payment captured!');
      onDone(data.booking);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Capture failed');
    } finally { setLoading(false); }
  };

  const doRefund = async () => {
    setLoading(true);
    try {
      const body: any = {};
      if (refundAmount) body.amountPaisa = parseInt(refundAmount) * 100;
      if (refundReason) body.reason = refundReason;
      const { data } = await client.post(`/admin/bookings/${booking.id}/refund`, body);
      toast.success(`${data.action === 'cancelled' ? 'Intent cancelled' : 'Refund issued'}!`);
      onDone(data.booking);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Refund failed');
    } finally { setLoading(false); }
  };

  const doCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Enter a reason'); return; }
    setLoading(true);
    try {
      const { data } = await client.post(`/admin/bookings/${booking.id}/cancel`, { reason: cancelReason });
      toast.success('Booking cancelled');
      onDone(data.booking);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Cancel failed');
    } finally { setLoading(false); }
  };

  const doEdit = async () => {
    setLoading(true);
    try {
      const { data } = await client.patch(`/admin/bookings/${booking.id}`, {
        status: editStatus,
        companionPayoutPaisa: parseInt(editPayoutPaisa),
        platformFeePaisa: parseInt(editPlatformPaisa),
      });
      toast.success('Booking updated');
      onDone(data);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Update failed');
    } finally { setLoading(false); }
  };

  const tabs = [
    { key: 'capture', label: 'Capture', icon: IconBolt },
    { key: 'refund', label: 'Refund', icon: IconRefresh },
    { key: 'cancel', label: 'Cancel', icon: IconX },
    { key: 'edit', label: 'Edit', icon: IconEdit },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-white">Booking Actions</p>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition"><IconX size={16} /></button>
        </div>
        <p className="text-[11px] text-white/40 mb-4 truncate">
          {booking.companion?.displayName ?? '—'} · {rupees(booking.amountPaisa)} · {booking.status}
        </p>

        {/* Tabs */}
        <div className="flex bg-white/5 rounded-xl p-1 gap-1 mb-5">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                tab === key ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
              }`}>
              <Icon size={11} />{label}
            </button>
          ))}
        </div>

        {tab === 'capture' && (
          <div className="space-y-4">
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3">
              <p className="text-xs text-teal-300">Capture the held payment from customer. Leave amount empty to capture the full authorized amount ({rupees(booking.amountPaisa)}).</p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-white/50 mb-1.5 block">Custom Amount (₹) — optional</label>
              <input type="number" value={captureAmount} onChange={(e) => setCaptureAmount(e.target.value)}
                placeholder={`Default: ${(booking.amountPaisa / 100).toFixed(0)}`}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-teal-500/50" />
            </div>
            <button onClick={doCapture} disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
              {loading ? 'Processing…' : 'Capture Payment'}
            </button>
          </div>
        )}

        {tab === 'refund' && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-xs text-amber-300">Issue a full or partial refund. For uncaptured holds, this will cancel the authorization instead.</p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-white/50 mb-1.5 block">Refund Amount (₹) — empty = full refund</label>
              <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Leave empty for full refund"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-amber-500/50" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-white/50 mb-1.5 block">Reason (optional)</label>
              <input value={refundReason} onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. companion no-show"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-amber-500/50" />
            </div>
            <button onClick={doRefund} disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 bg-amber-600 hover:bg-amber-500 transition">
              {loading ? 'Processing…' : 'Issue Refund'}
            </button>
          </div>
        )}

        {tab === 'cancel' && (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-xs text-red-300">Cancel the booking and void any held payment. This cannot be undone.</p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-white/50 mb-1.5 block">Cancellation Reason *</label>
              <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-red-500/50" />
            </div>
            <button onClick={doCancel} disabled={loading || !cancelReason.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 bg-red-600 hover:bg-red-500 transition">
              {loading ? 'Cancelling…' : 'Cancel Booking'}
            </button>
          </div>
        )}

        {tab === 'edit' && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-medium text-white/50 mb-1.5 block">Status</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value} className="bg-slate-800">{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-white/50 mb-1.5 block">Companion Payout (paisa)</label>
              <input type="number" value={editPayoutPaisa} onChange={(e) => setEditPayoutPaisa(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500/50" />
              <p className="text-[10px] text-white/30 mt-1">= ₹{(parseInt(editPayoutPaisa || '0') / 100).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-white/50 mb-1.5 block">Platform Fee (paisa)</label>
              <input type="number" value={editPlatformPaisa} onChange={(e) => setEditPlatformPaisa(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500/50" />
              <p className="text-[10px] text-white/30 mt-1">= ₹{(parseInt(editPlatformPaisa || '0') / 100).toLocaleString('en-IN')}</p>
            </div>
            <button onClick={doEdit} disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function AdminBookings() {
  const [data, setData] = useState<BookingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionBooking, setActionBooking] = useState<Booking | null>(null);

  const load = useCallback(async () => {
    try {
      const qs = statusFilter ? `&status=${statusFilter}` : '';
      const { data: d } = await client.get<BookingPage>(`/admin/bookings?limit=100${qs}`);
      setData(d);
    } catch {
      toast.error('Could not load bookings');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleDone = (updated: Booking) => {
    setData((prev) => prev ? {
      ...prev,
      items: prev.items.map((b) => b.id === updated.id ? { ...b, ...updated } : b),
    } : prev);
    setActionBooking(null);
  };

  const filtered = (data?.items ?? []).filter((b) => {
    const term = search.toLowerCase();
    return (
      (b.companion?.displayName ?? '').toLowerCase().includes(term) ||
      (b.user?.fullName ?? '').toLowerCase().includes(term) ||
      b.id.includes(term)
    );
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white">Bookings</h1>
          <p className="text-xs text-white/40 mt-0.5">{data?.total ?? 0} total</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-slate-800">{o.label}</option>
            ))}
          </select>
          <div className="relative">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companion, user, ID…"
              className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none w-56" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><IconLoader2 size={28} className="animate-spin text-teal-400" /></div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-5 py-3 text-white/40 font-medium">Booking</th>
                <th className="text-left px-5 py-3 text-white/40 font-medium">User → Companion</th>
                <th className="text-left px-5 py-3 text-white/40 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-white/40 font-medium">Amount</th>
                <th className="text-left px-5 py-3 text-white/40 font-medium">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.pending;
                return (
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-white/60 font-mono text-[10px]">{b.id.slice(0, 8)}…</p>
                      <p className="text-white/40 text-[10px] capitalize mt-0.5">{b.serviceType.replace('_', ' ')}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-white/80 truncate max-w-[180px]">
                        {(b as any).user?.fullName ?? '—'}
                        <span className="text-white/30 mx-1">→</span>
                        {b.companion?.displayName ?? '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white/60">{rupees(b.amountPaisa)}</td>
                    <td className="px-5 py-3 text-white/40">{fmtDate(b.bookedStart)}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => setActionBooking(b)}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition">
                        <IconBolt size={11} /> Actions
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-white/30">No bookings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {actionBooking && (
        <PaymentModal
          booking={actionBooking}
          onClose={() => setActionBooking(null)}
          onDone={handleDone}
        />
      )}
    </div>
  );
}
