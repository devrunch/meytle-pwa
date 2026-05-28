import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconLoader2, IconSearch, IconChevronRight, IconFilter } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import type { User } from '../../types';

interface UserPage { items: User[]; total: number; }

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin:     { bg: '#7C3AED20', color: '#C4B5FD' },
  companion: { bg: '#0369A120', color: '#7DD3FC' },
  user:      { bg: '#06472020', color: '#6EE7B7' },
};

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_COLORS[role] ?? { bg: '#ffffff10', color: '#ffffff50' };
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize"
      style={{ background: s.bg, color: s.color }}>{role}</span>
  );
}

export function AdminUsers() {
  const navigate = useNavigate();
  const [data, setData] = useState<UserPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const { data: d } = await client.get<UserPage>('/admin/users?limit=200');
      setData(d);
    } catch {
      toast.error('Could not load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = (data?.items ?? []).filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.id.includes(term);
    const matchesRole = !roleFilter || (u.roles as string[]).includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-white">Users</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {filtered.length} of {data?.total ?? 0} shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Role filter */}
          <div className="relative">
            <IconFilter size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs rounded-xl border focus:outline-none"
              style={{ background: '#131E30', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              <option value="" className="bg-slate-800">All roles</option>
              <option value="user" className="bg-slate-800">User</option>
              <option value="companion" className="bg-slate-800">Companion</option>
              <option value="admin" className="bg-slate-800">Admin</option>
            </select>
          </div>
          {/* Search */}
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
                {['User', 'Email', 'Roles', 'Joined', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}
                  onClick={() => navigate(`/admin/users/${u.id}`)}
                  className="border-b cursor-pointer transition-colors hover:bg-white/3"
                  style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                        {u.avatarUrl
                          ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                          : u.fullName[0]?.toUpperCase()}
                      </div>
                      <span className="text-white font-semibold">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{u.email}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {(u.roles as string[]).map((r) => <RoleBadge key={r} role={r} />)}
                    </div>
                  </td>
                  <td className="px-5 py-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <IconChevronRight size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  No users match your filters
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
