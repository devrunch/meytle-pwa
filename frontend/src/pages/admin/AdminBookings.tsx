import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconLoader2, IconSearch, IconChevronRight, IconFilter } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import type { Booking } from '../../types';

interface BookingPage { items: Booking[]; total: number; }

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: '#F59E0B', bg: '#F59E0B18', label: 'Pending' },
  confirmed:   { color: '#10B981', bg: '#10B98118', label: 'Confirmed' },
  in_progress: { color: '#3B82F6', bg: '#3B82F618', label: 'In Progress' },
  completed:   { color: '#6B7280', bg: '#6B728018', label: 'Completed' },
  cancelled:   { color: '#EF4444', bg: '#EF444418', label: 'Cancelled' },
};

function rupees(p: number) {
  return `$${(p / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function AdminBookings() {
  const navigate = useNavigate();
  const [data, setData] = useState<BookingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const qs = statusFilter ? `&status=${statusFilter}` : '';
      const { data: d } = await client.get<BookingPage>(`/admin/bookings?limit=200${qs}`);
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

  const filtered = (data?.items ?? []).filter((b) => {
    const term = search.toLowerCase();
    return !term ||
      (b as any).user?.fullName?.toLowerCase().includes(term) ||
      b.companion?.displayName?.toLowerCase().includes(term) ||
      b.id.includes(term) ||
      b.serviceType.toLowerCase().includes(term);
  });

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-white">Bookings</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {filtered.length} of {data?.total ?? 0} shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconFilter size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs rounded-xl border focus:outline-none"
              style={{ background: '#131E30', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <IconSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="User, companion, service or ID…"
              className="pl-8 pr-4 py-2 text-xs rounded-xl border focus:outline-none w-64"
              style={{ background: '#131E30', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <IconLoader2 size={28} className="animate-spin" style={{ color: '#00D4AA' }} />
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#131E30', borderColor: 'rgba(255,255,255,0.07)' }}>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                {['User → Companion', 'Service', 'Amount', 'Payout', 'Status', 'Date', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.pending;
                return (
                  <tr key={b.id}
                    onClick={() => navigate(`/admin/bookings/${b.id}`)}
                    className="border-b cursor-pointer transition-colors hover:bg-white/3"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {(b as any).user?.fullName ?? '—'}
                        <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 4px' }}>→</span>
                        {b.companion?.displayName ?? '—'}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {b.id.slice(0, 8)}…
                      </p>
                    </td>
                    <td className="px-4 py-3 capitalize" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {b.serviceType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {rupees(b.amountPaisa)}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {(b as any).companionPayoutPaisa != null ? rupees((b as any).companionPayoutPaisa) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {new Date(b.bookedStart).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <IconChevronRight size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  No bookings match your filters
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
