import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconLoader2, IconMessage2, IconChevronRight,
  IconLock, IconMessageCircle,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { Booking } from '../../types';

function isChatOpen(booking: Booking): boolean {
  const now = Date.now();
  const start = new Date(booking.bookedStart).getTime();
  const end = new Date(booking.bookedEnd).getTime();
  return now >= start - 3 * 60 * 60 * 1000 && now <= end;
}

function chatOpensIn(booking: Booking): string {
  const opensAt = new Date(booking.bookedStart).getTime() - 3 * 60 * 60 * 1000;
  const diff = opensAt - Date.now();
  if (diff <= 0) return '';
  const h = Math.floor(diff / (60 * 60 * 1000));
  const m = Math.floor((diff % (60 * 60 * 1000)) / 60000);
  if (h >= 24) return `in ${Math.ceil(h / 24)}d`;
  if (h > 0) return `in ${h}h`;
  return `in ${m}m`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const STATUS_COLOR: Record<string, string> = {
  confirmed:   '#059669',
  in_progress: '#2563EB',
};

export function MessagesPage() {
  const navigate    = useNavigate();
  const isCompanion = useAuthStore((s) => s.isCompanion)();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [client.get<Booking[]>('/bookings')];
      if (isCompanion) requests.push(client.get<Booking[]>('/bookings/companion'));
      const results = await Promise.all(requests);

      // Merge + deduplicate by id, keep only active statuses
      const all = results.flatMap((r) => r.data);
      const seen = new Set<string>();
      const active = all.filter((b) => {
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return b.status === 'confirmed' || b.status === 'in_progress';
      });

      // Sort: open chats first, then by soonest start
      active.sort((a, b) => {
        const aOpen = isChatOpen(a) ? 0 : 1;
        const bOpen = isChatOpen(b) ? 0 : 1;
        if (aOpen !== bOpen) return aOpen - bOpen;
        return new Date(a.bookedStart).getTime() - new Date(b.bookedStart).getTime();
      });

      setBookings(active);
    } catch {
      toast.error('Could not load messages');
    } finally {
      setLoading(false);
    }
  }, [isCompanion]);

  useEffect(() => { load(); }, [load]);

  // Determine the other person's name/photo from the booking
  function getOther(b: Booking) {
    const myId = useAuthStore.getState().user?.id;
    // If I am the companion in this booking, show the user (client)
    if (b.companion && b.companion.userId === myId) {
      return {
        name: b.user?.fullName ?? 'Client',
        photo: b.user?.avatarUrl ?? null,
        initial: b.user?.fullName?.[0] ?? '?',
      };
    }
    return {
      name: b.companion?.displayName ?? 'Companion',
      photo: b.companion?.profilePhotoUrl ?? null,
      initial: b.companion?.displayName?.[0] ?? '?',
    };
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-heading">Messages</h1>
        <p className="text-xs text-muted mt-0.5">Active bookings you can message</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <IconLoader2 size={28} className="animate-spin text-teal-500" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <IconMessage2 size={48} className="text-border mb-4" stroke={1} />
          <p className="text-base font-semibold text-heading mb-1">No active bookings</p>
          <p className="text-sm text-muted mb-6">
            Confirmed bookings will appear here so you can message
          </p>
          <button
            onClick={() => navigate('/browse')}
            className="px-6 py-3 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
            Browse Companions
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => {
            const open  = isChatOpen(b);
            const other = getOther(b);
            const opensIn = !open ? chatOpensIn(b) : '';

            return (
              <button
                key={b.id}
                onClick={() => navigate(`/bookings/${b.id}/chat`)}
                className="w-full flex items-center gap-3 bg-white rounded-2xl border border-black/5 shadow-sm px-4 py-3.5 hover:bg-gray-50 active:scale-[0.99] transition-all text-left"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-linear-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {other.photo
                      ? <img src={other.photo} alt="" className="w-full h-full object-cover" />
                      : other.initial}
                  </div>
                  {open && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent-green border-2 border-white" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-bold text-heading truncate">{other.name}</p>
                    <span className="text-[10px] text-muted shrink-0">{fmtDate(b.bookedStart)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: STATUS_COLOR[b.status] ?? '#9CA3AF' }} />
                    <p className="text-xs text-muted truncate capitalize">
                      {b.status.replace('_', ' ')} · {b.serviceType.replace('_', ' ')} · {fmtTime(b.bookedStart)}
                    </p>
                  </div>
                </div>

                {/* Right: open/locked indicator */}
                <div className="shrink-0 flex items-center gap-1.5">
                  {open ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-accent-green bg-teal-50 px-2 py-1 rounded-full">
                      <IconMessageCircle size={10} /> Open
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-muted bg-surface-alt px-2 py-1 rounded-full">
                      <IconLock size={10} /> {opensIn}
                    </span>
                  )}
                  <IconChevronRight size={14} className="text-muted" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
