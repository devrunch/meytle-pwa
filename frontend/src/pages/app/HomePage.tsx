import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconStar, IconLoader2, IconArrowRight,
  IconCalendarEvent, IconMessage2, IconUserStar,
  IconMapPin, IconClock, IconSearch, IconCompass,
  IconSparkles, IconTrendingUp,
} from '@tabler/icons-react';
import { client } from '../../api/client';
import { bookingsApi } from '../../api/bookings';
import { useAuthStore } from '../../store/authStore';
import type { CompanionProfile, Booking, ServiceType } from '../../types';

const SERVICE_LABELS: Record<ServiceType, string> = {
  coffee: 'Coffee', dining: 'Dining', concert: 'Concerts',
  travel: 'Travel', fitness: 'Fitness', culture: 'Culture',
  nature: 'Nature', movies: 'Movies', shopping: 'Shopping', gaming: 'Gaming',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pending',     color: '#F59E0B', bg: '#FEF3C7' },
  confirmed:   { label: 'Confirmed',   color: '#3B82F6', bg: '#DBEAFE' },
  in_progress: { label: 'In progress', color: '#00D4AA', bg: '#D1FAF0' },
  completed:   { label: 'Completed',   color: '#64748B', bg: '#F1F5F9' },
  cancelled:   { label: 'Cancelled',   color: '#EF4444', bg: '#FEE2E2' },
};

const FILTERS: { label: string; value: ServiceType | 'all'; emoji: string }[] = [
  { label: 'All',      value: 'all',      emoji: '✨' },
  { label: 'Coffee',   value: 'coffee',   emoji: '☕' },
  { label: 'Dining',   value: 'dining',   emoji: '🍽️' },
  { label: 'Concerts', value: 'concert',  emoji: '🎵' },
  { label: 'Travel',   value: 'travel',   emoji: '✈️' },
  { label: 'Fitness',  value: 'fitness',  emoji: '🏃' },
  { label: 'Culture',  value: 'culture',  emoji: '🎭' },
  { label: 'Nature',   value: 'nature',   emoji: '🌿' },
  { label: 'Movies',   value: 'movies',   emoji: '🎬' },
  { label: 'Shopping', value: 'shopping', emoji: '🛍️' },
  { label: 'Gaming',   value: 'gaming',   emoji: '🎮' },
];

// ── Companion card ─────────────────────────────────────────────────────────────

function CompanionCard({ companion }: { companion: CompanionProfile }) {
  const rate = Math.round(companion.hourlyRatePaisa / 100);
  const services = companion.services?.map((s) => SERVICE_LABELS[s.serviceType]) ?? [];

  return (
    <Link to={`/companions/${companion.id}`}
      className="group block bg-surface rounded-2xl border border-border overflow-hidden hover:border-accent-green/50 hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-alt">
        {companion.profilePhotoUrl ? (
          <img src={companion.profilePhotoUrl} alt={companion.displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
            <span className="text-white text-3xl font-bold">{companion.displayName[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        {companion.isAvailableNow && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            Available
          </div>
        )}
        {companion.ratingAvg && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-1 rounded-full">
            <IconStar size={10} className="fill-yellow-400 text-yellow-400" />
            {companion.ratingAvg.toFixed(1)}
          </div>
        )}
        {/* Info overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-semibold text-sm truncate">{companion.displayName}</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-white/70 text-xs truncate">{services[0] ?? 'Companion'}</p>
            <p className="text-white font-bold text-sm shrink-0 ml-2">₹{rate.toLocaleString('en-IN')}<span className="text-white/60 font-normal text-xs">/hr</span></p>
          </div>
        </div>
      </div>
      {/* Tags */}
      <div className="px-3 py-2.5 flex items-center gap-1.5 flex-wrap">
        {services.slice(0, 2).map((s) => (
          <span key={s} className="text-[10px] bg-surface-alt text-muted px-2 py-0.5 rounded-full">{s}</span>
        ))}
        {services.length > 2 && (
          <span className="text-[10px] bg-surface-alt text-muted px-2 py-0.5 rounded-full">+{services.length - 2}</span>
        )}
        <span className="ml-auto text-[10px] text-muted flex items-center gap-0.5">
          <IconMapPin size={10} />{companion.serviceAreaRadiusKm}km
        </span>
      </div>
    </Link>
  );
}

// ── Journey card ───────────────────────────────────────────────────────────────

function JourneyCard({ booking }: { booking: Booking }) {
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const companion = booking.companion;
  const date = new Date(booking.bookedStart);
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <Link to={`/bookings/${booking.id}`}
      className="group flex items-center gap-3 bg-surface rounded-xl border border-border px-4 py-3 hover:border-accent-green/40 hover:shadow-md transition-all duration-200">
      <div className="shrink-0 w-11 h-11 rounded-xl overflow-hidden">
        {companion?.profilePhotoUrl ? (
          <img src={companion.profilePhotoUrl} alt={companion.displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
            {companion?.displayName?.[0] ?? '?'}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-heading text-sm truncate">{companion?.displayName ?? 'Companion'}</p>
          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: cfg.color, background: cfg.bg }}>
            {cfg.label}
          </span>
        </div>
        <p className="text-xs text-muted truncate">{SERVICE_LABELS[booking.serviceType]} · {booking.meetingSpotText}</p>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted">
          <span className="flex items-center gap-1"><IconCalendarEvent size={10} />{dateStr}</span>
          <span className="flex items-center gap-1"><IconClock size={10} />{timeStr}</span>
          <span className="flex items-center gap-1"><IconMapPin size={10} />{booking.bookedDurationMinutes / 60}h</span>
        </div>
      </div>
      <IconArrowRight size={14} className="text-border group-hover:text-accent-green transition-colors shrink-0" />
    </Link>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  const isCompanion = useAuthStore((s) => s.isCompanion)();

  const [companions, setCompanions] = useState<CompanionProfile[]>([]);
  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [loadingC,   setLoadingC]   = useState(true);
  const [loadingB,   setLoadingB]   = useState(true);
  const [filter,     setFilter]     = useState<ServiceType | 'all'>('all');
  const [search,     setSearch]     = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filter !== 'all') params.service = filter;
    setLoadingC(true);
    client.get('/companions', { params })
      .then((r) => setCompanions(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingC(false));
  }, [filter]);

  useEffect(() => {
    bookingsApi.myBookings()
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoadingB(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  const filtered = companions.filter(c =>
    !search ||
    c.displayName.toLowerCase().includes(search.toLowerCase()) ||
    c.bio?.toLowerCase().includes(search.toLowerCase())
  );

  const recentBookings  = bookings.slice(0, 4);
  const activeBookings  = bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length;
  const completedCount  = bookings.filter(b => b.status === 'completed').length;

  return (
    <div className="pb-10">

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden mb-8 p-6 md:p-8"
        style={{ background: 'linear-gradient(135deg,#00D4AA 0%,#00C2D8 45%,#4F8CFF 100%)' }}>
        {/* decorative blobs */}
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#fff,transparent)' }} />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#fff,transparent)' }} />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">{greeting} 👋</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
              Hey, {firstName}
            </h1>
            <p className="text-white/80 text-sm max-w-xs">
              Discover companions for every moment — coffee, travel, concerts and more.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-3 md:gap-4 shrink-0">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-white text-2xl font-extrabold">{bookings.length}</p>
              <p className="text-white/70 text-xs mt-0.5">Total</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-white text-2xl font-extrabold">{activeBookings}</p>
              <p className="text-white/70 text-xs mt-0.5">Active</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-white text-2xl font-extrabold">{completedCount}</p>
              <p className="text-white/70 text-xs mt-0.5">Done</p>
            </div>
          </div>
        </div>

        {/* Search bar inside hero */}
        <div className="relative mt-6">
          <IconSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companions by name, vibe or service…"
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-0 bg-white text-sm text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg transition"
          />
        </div>
      </div>

      {/* ── Main two-column layout (desktop) ───────────────────────────── */}
      <div className="flex gap-7 items-start">

        {/* ── Left: companions ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-heading flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                <IconSparkles size={14} className="text-white" />
              </span>
              Find a Companion
            </h2>
            <Link to="/browse" className="text-xs text-accent-green font-semibold flex items-center gap-1 hover:underline">
              Browse all <IconArrowRight size={12} />
            </Link>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-thin">
            {FILTERS.map(({ label, value, emoji }) => (
              <button key={value} onClick={() => setFilter(value)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  filter === value
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-surface border-border text-muted hover:border-accent-green/30 hover:text-body'
                }`}
                style={filter === value ? { background: 'linear-gradient(135deg,#00D4AA,#00C2D8,#4F8CFF)' } : {}}>
                <span>{emoji}</span>{label}
              </button>
            ))}
          </div>

          {loadingC ? (
            <div className="flex justify-center py-16">
              <IconLoader2 size={24} className="animate-spin text-muted" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-border">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm font-semibold text-heading">No companions found</p>
              <p className="text-xs text-muted mt-1">Try a different filter or search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((c) => <CompanionCard key={c.id} companion={c} />)}
            </div>
          )}
        </div>

        {/* ── Right sidebar: journeys + quick links ────────────────────── */}
        <div className="hidden lg:flex flex-col gap-5 w-72 shrink-0">

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link to="/messages"
              className="flex flex-col items-center gap-2 py-4 bg-surface rounded-2xl border border-border hover:border-accent-green/40 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#00D4AA18,#4F8CFF18)' }}>
                <IconMessage2 size={19} className="text-accent-green" />
              </div>
              <span className="text-xs font-semibold text-heading">Messages</span>
            </Link>
            <Link to="/bookings"
              className="flex flex-col items-center gap-2 py-4 bg-surface rounded-2xl border border-border hover:border-accent-blue/40 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#4F8CFF18,#00D4AA18)' }}>
                <IconCalendarEvent size={19} className="text-accent-blue" />
              </div>
              <span className="text-xs font-semibold text-heading">Bookings</span>
            </Link>
            {!isCompanion && (
              <Link to="/become-companion"
                className="col-span-2 flex items-center gap-3 px-4 py-3 rounded-2xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                <IconUserStar size={18} stroke={2} />
                Become a Companion
              </Link>
            )}
          </div>

          {/* Journeys panel */}
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#F7FBFA,#F6FAFF)' }}>
              <h3 className="text-sm font-bold text-heading flex items-center gap-2">
                <IconTrendingUp size={15} className="text-accent-green" />
                Your Journeys
              </h3>
              {bookings.length > 4 && (
                <Link to="/bookings" className="text-xs text-accent-green hover:underline font-semibold">
                  See all
                </Link>
              )}
            </div>

            <div className="p-3">
              {loadingB ? (
                <div className="flex justify-center py-8">
                  <IconLoader2 size={18} className="animate-spin text-muted" />
                </div>
              ) : recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">🗓️</p>
                  <p className="text-xs font-semibold text-heading">No bookings yet</p>
                  <p className="text-[11px] text-muted mt-1">Book a companion to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentBookings.map((b) => <JourneyCard key={b.id} booking={b} />)}
                </div>
              )}
            </div>
          </div>

          {/* Compass promo */}
          <div className="rounded-2xl p-5 text-center"
            style={{ background: 'linear-gradient(135deg,#00D4AA0D,#4F8CFF0D)', border: '1px solid #00D4AA22' }}>
            <div className="w-10 h-10 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
              <IconCompass size={20} className="text-white" />
            </div>
            <p className="text-sm font-bold text-heading mb-1">New experiences</p>
            <p className="text-xs text-muted mb-3">10+ new companions this week</p>
            <Link to="/browse"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
              Explore now <IconArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile: journeys below companions ──────────────────────────── */}
      {(loadingB || recentBookings.length > 0) && (
        <div className="lg:hidden mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-heading flex items-center gap-2">
              <IconCompass size={15} className="text-accent-green" /> Your Journeys
            </h2>
            {bookings.length > 4 && (
              <Link to="/bookings" className="text-xs text-accent-green font-semibold hover:underline flex items-center gap-0.5">
                See all <IconArrowRight size={11} />
              </Link>
            )}
          </div>
          {loadingB ? (
            <div className="flex justify-center py-6">
              <IconLoader2 size={18} className="animate-spin text-muted" />
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentBookings.map((b) => <JourneyCard key={b.id} booking={b} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
