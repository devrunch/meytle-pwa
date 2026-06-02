import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconLoader2, IconMessage2, IconChevronRight } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import type { Booking } from '../../types';

const CHAT_STATUSES = ['confirmed', 'in_progress'] as const;

function isChatOpen(booking: Booking): boolean {
  const now = Date.now();
  const start = new Date(booking.bookedStart).getTime();
  const end = new Date(booking.bookedEnd).getTime();
  return now >= start - 3 * 60 * 60 * 1000 && now <= end;
}

const STATUS_CFG = {
  confirmed:   { label: 'Confirmed',   color: '#059669' },
  in_progress: { label: 'In Progress', color: '#2563EB' },
  completed:   { label: 'Completed',   color: '#6B7280' },
} as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export function MessagesPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get<Booking[]>('/bookings');
      setBookings(
        data.filter((b) => (CHAT_STATUSES as readonly string[]).includes(b.status) && isChatOpen(b)),
      );
    } catch {
      toast.error('Could not load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sorted = [...bookings].sort(
    (a, b) => new Date(b.bookedStart).getTime() - new Date(a.bookedStart).getTime(),
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-heading">Messages</h1>
        <p className="text-xs text-muted mt-0.5">Chat with your companions</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <IconLoader2 size={28} className="animate-spin text-teal-500" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <IconMessage2 size={48} className="text-border mb-4" stroke={1} />
          <p className="text-base font-semibold text-heading mb-1">No conversations yet</p>
          <p className="text-sm text-muted mb-6">
            Chat opens 3 hours before your booking starts
          </p>
          <button
            onClick={() => navigate('/browse')}
            className="px-6 py-3 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}
          >
            Browse Companions
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((b) => {
            const cfg = STATUS_CFG[b.status as keyof typeof STATUS_CFG];
            const companion = b.companion;
            return (
              <button
                key={b.id}
                onClick={() => navigate(`/bookings/${b.id}/chat`)}
                className="w-full flex items-center gap-3 bg-white rounded-2xl border border-black/5 shadow-sm px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {companion?.profilePhotoUrl ? (
                    <img src={companion.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    companion?.displayName?.[0] ?? '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-heading truncate">
                      {companion?.displayName ?? 'Companion'}
                    </p>
                    <span className="text-[10px] text-muted shrink-0">{fmtDate(b.bookedStart)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: cfg?.color ?? '#9CA3AF' }}
                    />
                    <p className="text-xs text-muted truncate">
                      {cfg?.label ?? b.status} · {b.serviceType.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <IconChevronRight size={14} className="text-muted shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
