import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconUsers, IconUserStar, IconCalendarEvent, IconCurrencyRupee,
  IconLoader2, IconActivity, IconClock, IconTrendingUp, IconChevronRight,
} from '@tabler/icons-react';
import { client } from '../../api/client';
import type { Booking } from '../../types';

interface Stats {
  totalUsers: number;
  totalCompanions: number;
  totalBookings: number;
  completedBookings: number;
  pendingCompanions: number;
  pendingBookings: number;
  activeBookings: number;
  totalRevenuePaisa: number;
  totalGmvPaisa: number;
}
interface DayRevenue { date: string; revenuePaisa: number; count: number; }

const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: '#F59E0B', bg: '#F59E0B22', label: 'Pending' },
  confirmed:   { color: '#10B981', bg: '#10B98122', label: 'Confirmed' },
  in_progress: { color: '#3B82F6', bg: '#3B82F622', label: 'In Progress' },
  completed:   { color: '#6B7280', bg: '#6B728022', label: 'Completed' },
  cancelled:   { color: '#EF4444', bg: '#EF444422', label: 'Cancelled' },
};

function rupees(p: number) {
  return `₹${(p / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Pure-CSS bar chart — no external library
function RevenueChart({ data }: { data: DayRevenue[] }) {
  const max = Math.max(...data.map((d) => d.revenuePaisa), 1);
  return (
    <div className="flex items-end gap-1 h-28 w-full">
      {data.map((d) => {
        const pct = (d.revenuePaisa / max) * 100;
        const hasRevenue = d.revenuePaisa > 0;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group relative">
            {/* Tooltip */}
            {hasRevenue && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[9px] font-semibold px-1.5 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {rupees(d.revenuePaisa)}
              </div>
            )}
            {/* Bar */}
            <div className="w-full flex-1 flex items-end rounded-sm overflow-hidden">
              <div
                className="w-full rounded-sm transition-all duration-300"
                style={{
                  height: `${Math.max(pct, hasRevenue ? 4 : 0)}%`,
                  background: hasRevenue
                    ? 'linear-gradient(to top, #00D4AA, #4F8CFF)'
                    : 'rgba(255,255,255,0.06)',
                  minHeight: hasRevenue ? '3px' : '2px',
                }}
              />
            </div>
            {/* Label */}
            <span className="text-[8px] text-white/25 font-medium leading-none">
              {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; stroke?: number }>;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl p-5 border" style={{ background: '#131E30', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}18` }}>
          <Icon size={15} style={{ color: accent }} stroke={2} />
        </div>
        <p className="text-[11px] font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
      </div>
      <p className="text-2xl font-extrabold text-white leading-none">{value}</p>
      {sub && <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>}
    </div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<DayRevenue[]>([]);
  const [recent, setRecent] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get<Stats>('/admin/stats'),
      client.get<DayRevenue[]>('/admin/stats/daily-revenue?days=14'),
      client.get<Booking[]>('/admin/stats/recent-bookings?limit=8'),
    ]).then(([{ data: s }, { data: r }, { data: rb }]) => {
      setStats(s);
      setRevenue(r);
      setRecent(rb);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader2 size={32} className="animate-spin" style={{ color: '#00D4AA' }} />
      </div>
    );
  }

  const totalRevenue14d = revenue.reduce((s, d) => s + d.revenuePaisa, 0);
  const totalBookings14d = revenue.reduce((s, d) => s + d.count, 0);

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Platform overview — all time
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={IconUsers} label="Total Users" value={stats!.totalUsers} accent="#00D4AA" />
        <StatCard icon={IconUserStar} label="Companions" value={stats!.totalCompanions}
          sub={`${stats!.pendingCompanions} pending review`} accent="#4F8CFF" />
        <StatCard icon={IconCalendarEvent} label="Total Bookings" value={stats!.totalBookings}
          sub={`${stats!.completedBookings} completed`} accent="#A78BFA" />
        <StatCard
          icon={IconCurrencyRupee}
          label="Platform Revenue"
          value={rupees(stats!.totalRevenuePaisa)}
          sub={`GMV ${rupees(stats!.totalGmvPaisa)}`}
          accent="#F59E0B"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={IconActivity} label="Active Sessions" value={stats!.activeBookings} accent="#10B981" />
        <StatCard icon={IconClock} label="Pending Bookings" value={stats!.pendingBookings} accent="#EF4444" />
        <StatCard icon={IconTrendingUp} label="Revenue (14d)" value={rupees(totalRevenue14d)}
          sub={`${totalBookings14d} completed bookings`} accent="#00C2D8" />
      </div>

      {/* Revenue chart + Recent bookings */}
      <div className="grid grid-cols-5 gap-4">
        {/* Revenue chart */}
        <div className="col-span-3 rounded-2xl p-5 border" style={{ background: '#131E30', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-white">Revenue — last 14 days</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Platform fee collected per day
              </p>
            </div>
            <p className="text-sm font-extrabold" style={{ color: '#00D4AA' }}>
              {rupees(totalRevenue14d)}
            </p>
          </div>
          {revenue.length > 0 ? (
            <RevenueChart data={revenue} />
          ) : (
            <div className="h-28 flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              No completed bookings yet
            </div>
          )}
        </div>

        {/* Booking status distribution */}
        <div className="col-span-2 rounded-2xl p-5 border" style={{ background: '#131E30', borderColor: 'rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-bold text-white mb-4">Booking Status</p>
          <div className="space-y-2.5">
            {[
              { key: 'pending', count: stats!.pendingBookings },
              { key: 'in_progress', count: stats!.activeBookings },
              { key: 'completed', count: stats!.completedBookings },
              { key: 'cancelled', count: stats!.totalBookings - stats!.pendingBookings - stats!.activeBookings - stats!.completedBookings },
            ].map(({ key, count }) => {
              const cfg = STATUS_CFG[key];
              const pct = stats!.totalBookings > 0 ? (count / stats!.totalBookings) * 100 : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                      <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{cfg.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-white">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="mt-4 rounded-2xl border overflow-hidden" style={{ background: '#131E30', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-bold text-white">Recent Bookings</p>
          <button onClick={() => navigate('/admin/bookings')}
            className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
            style={{ color: '#00D4AA' }}>
            View all <IconChevronRight size={11} />
          </button>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {['User → Companion', 'Service', 'Amount', 'Status', 'Date'].map((h) => (
                <th key={h} className="text-left px-5 py-2.5 text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((b) => {
              const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.pending;
              return (
                <tr key={b.id}
                  className="border-b cursor-pointer transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  onClick={() => navigate(`/admin/bookings/${b.id}`)}>
                  <td className="px-5 py-3 text-white/70">
                    {(b as any).user?.fullName ?? '—'}
                    <span className="text-white/25 mx-1">→</span>
                    {b.companion?.displayName ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-white/50 capitalize">{b.serviceType.replace('_', ' ')}</td>
                  <td className="px-5 py-3 text-white/70">{rupees(b.amountPaisa)}</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/35">{shortDate(b.bookedStart)}</td>
                </tr>
              );
            })}
            {recent.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>No bookings yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React from 'react';
