import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconLoader2, IconSearch, IconChevronRight, IconCheck, IconX, IconFilter } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import type { CompanionProfile } from '../../types';

interface Page { items: CompanionProfile[]; total: number; }

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending_verification', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  pending_verification: { color: '#F59E0B', bg: '#F59E0B18', label: 'Pending' },
  active:               { color: '#10B981', bg: '#10B98118', label: 'Active' },
  inactive:             { color: '#6B7280', bg: '#6B728018', label: 'Inactive' },
  rejected:             { color: '#EF4444', bg: '#EF444418', label: 'Rejected' },
};

export function AdminCompanions() {
  const navigate = useNavigate();
  const [data, setData] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const qs = statusFilter ? `&status=${statusFilter}` : '';
      const { data: d } = await client.get<Page>(`/admin/companions?limit=200${qs}`);
      setData(d);
    } catch {
      toast.error('Could not load companions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const quickStatus = async (id: string, profileStatus: string) => {
    await client.patch(`/admin/companions/${id}`, { profileStatus });
    setData((prev) => prev
      ? { ...prev, items: prev.items.map((c) => c.id === id ? { ...c, profileStatus: profileStatus as any } : c) }
      : prev);
    toast.success(profileStatus === 'active' ? 'Approved' : 'Rejected');
  };

  const filtered = (data?.items ?? []).filter((c) => {
    const term = search.toLowerCase();
    return !term ||
      c.displayName.toLowerCase().includes(term) ||
      (c as any).user?.email?.toLowerCase().includes(term) ||
      c.id.includes(term);
  });

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-white">Companions</h1>
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
              placeholder="Name, email or ID…"
              className="pl-8 pr-4 py-2 text-xs rounded-xl border focus:outline-none w-60"
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
                {['Companion', 'Status', 'Rate / hr', 'ID Verified', 'Available', 'Actions', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const cfg = STATUS_CFG[c.profileStatus] ?? STATUS_CFG.inactive;
                return (
                  <tr key={c.id} className="border-b transition-colors hover:bg-white/3 cursor-pointer"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button')) return;
                      navigate(`/admin/companions/${c.id}`);
                    }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-white font-bold text-xs"
                          style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                          {c.profilePhotoUrl
                            ? <img src={c.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                            : c.displayName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{c.displayName}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {(c as any).user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      ₹{(c.hourlyRatePaisa / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      {c.identityVerifiedByAdmin
                        ? <IconCheck size={13} style={{ color: '#10B981' }} />
                        : <IconX size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.isAvailableNow ? '#10B981' : 'rgba(255,255,255,0.2)' }} />
                    </td>
                    <td className="px-4 py-3">
                      {c.profileStatus === 'pending_verification' && (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => quickStatus(c.id, 'active')}
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                            style={{ background: 'rgba(16,185,129,0.15)', color: '#6EE7B7' }}>
                            Approve
                          </button>
                          <button onClick={() => quickStatus(c.id, 'rejected')}
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }}>
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <IconChevronRight size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  No companions match your filters
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
