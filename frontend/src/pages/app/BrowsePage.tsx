import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  IconSearch, IconStar, IconMapPin, IconLoader2,
  IconX, IconFilter, IconSparkles, IconShieldCheck,
} from '@tabler/icons-react';
import { client } from '../../api/client';
import type { CompanionProfile, ServiceType } from '../../types';

const SERVICE_OPTIONS: { value: ServiceType; label: string; emoji: string }[] = [
  { value: 'coffee',   label: 'Coffee',   emoji: '☕' },
  { value: 'dining',   label: 'Dining',   emoji: '🍽️' },
  { value: 'concert',  label: 'Concerts', emoji: '🎵' },
  { value: 'travel',   label: 'Travel',   emoji: '✈️' },
  { value: 'fitness',  label: 'Fitness',  emoji: '🏃' },
  { value: 'culture',  label: 'Culture',  emoji: '🎭' },
  { value: 'nature',   label: 'Nature',   emoji: '🌿' },
  { value: 'movies',   label: 'Movies',   emoji: '🎬' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'gaming',   label: 'Gaming',   emoji: '🎮' },
];

const SERVICE_LABELS: Record<ServiceType, string> = Object.fromEntries(
  SERVICE_OPTIONS.map(({ value, label }) => [value, label])
) as Record<ServiceType, string>;

// ── Companion card ─────────────────────────────────────────────────────────────

function CompanionCard({ companion }: { companion: CompanionProfile }) {
  const rate = Math.round(companion.hourlyRatePaisa / 100);
  const services = companion.services?.map((s) => SERVICE_LABELS[s.serviceType]).filter(Boolean) ?? [];

  return (
    <Link to={`/companions/${companion.id}`}
      className="group bg-surface rounded-2xl border border-border overflow-hidden hover:border-accent-green/50 hover:shadow-xl transition-all duration-300 flex flex-col">
      <div className="relative overflow-hidden bg-surface-alt" style={{ paddingBottom: '75%' }}>
        <div className="absolute inset-0">
          {companion.profilePhotoUrl ? (
            <img src={companion.profilePhotoUrl} alt={companion.displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
              <span className="text-white text-4xl font-bold">{companion.displayName[0]}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {companion.isAvailableNow && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              Available now
            </div>
          )}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {companion.profileStatus === 'active' && (
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md text-[10px] font-semibold px-2 py-1 rounded-full"
                style={{ color: '#00D4AA' }}>
                <IconShieldCheck size={11} />
                Verified
              </div>
            )}
            {companion.ratingAvg && (
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                <IconStar size={10} className="fill-yellow-400 text-yellow-400" />
                {companion.ratingAvg.toFixed(1)}
              </div>
            )}
          </div>
          {/* Name + rate overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white font-semibold truncate">{companion.displayName}</p>
            <p className="text-white font-bold text-sm mt-0.5">
              ₹{rate.toLocaleString('en-IN')}<span className="text-white/60 font-normal text-xs">/hr</span>
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 flex-1 flex flex-col gap-2">
        <p className="text-muted text-xs line-clamp-2">{companion.bio}</p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-wrap gap-1">
            {services.slice(0, 2).map((s) => (
              <span key={s} className="text-[10px] bg-surface-alt text-muted px-2 py-0.5 rounded-full">{s}</span>
            ))}
            {services.length > 2 && (
              <span className="text-[10px] bg-surface-alt text-muted px-2 py-0.5 rounded-full">+{services.length - 2}</span>
            )}
          </div>
          <span className="text-[10px] text-muted flex items-center gap-0.5 shrink-0 ml-2">
            <IconMapPin size={10} />{companion.serviceAreaRadiusKm}km
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Sidebar filter section ─────────────────────────────────────────────────────

function FilterSection({
  service, availableOnly, setParam,
}: {
  service: ServiceType | '';
  availableOnly: boolean;
  setParam: (k: string, v: string) => void;
}) {
  const hasFilters = !!(service || availableOnly);

  return (
    <div className="space-y-6">
      {/* Availability */}
      <div>
        <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Availability</p>
        <button
          onClick={() => setParam('available', availableOnly ? '' : 'true')}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            availableOnly
              ? 'border-accent-green bg-surface-alt text-accent-green'
              : 'border-border text-muted hover:border-accent-green/30 hover:bg-surface-alt'
          }`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${availableOnly ? 'bg-accent-green animate-pulse' : 'bg-border'}`} />
          Available right now
        </button>
      </div>

      {/* Experience type */}
      <div>
        <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Experience type</p>
        <div className="space-y-1">
          <button
            onClick={() => setParam('service', '')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              !service ? 'text-white' : 'text-muted hover:bg-surface-alt hover:text-body'
            }`}
            style={!service ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
            <span className="text-base">✨</span> All experiences
          </button>
          {SERVICE_OPTIONS.map(({ value, label, emoji }) => (
            <button key={value}
              onClick={() => setParam('service', service === value ? '' : value)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                service === value ? 'text-white' : 'text-muted hover:bg-surface-alt hover:text-body'
              }`}
              style={service === value ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
              <span className="text-base">{emoji}</span> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={() => { setParam('service', ''); setParam('available', ''); }}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-xl transition-colors">
          <IconFilter size={12} /> Clear all filters
        </button>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [companions, setCompanions] = useState<CompanionProfile[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);

  const query        = searchParams.get('q') ?? '';
  const service      = (searchParams.get('service') ?? '') as ServiceType | '';
  const availableOnly = searchParams.get('available') === 'true';

  const setParam = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | boolean> = {};
    if (service)      params.service      = service;
    if (availableOnly) params.availableNow = true;
    client.get('/companions', { params })
      .then((r) => { setCompanions(r.data.data ?? []); setTotal(r.data.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [service, availableOnly]);

  useEffect(() => { load(); }, [load]);

  const filtered = companions.filter(c =>
    !query ||
    c.displayName.toLowerCase().includes(query.toLowerCase()) ||
    c.bio?.toLowerCase().includes(query.toLowerCase())
  );

  const activeFilterCount = [service, availableOnly ? 'a' : ''].filter(Boolean).length;

  return (
    <div className="pb-10">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
              <IconSparkles size={15} className="text-white" />
            </span>
            Browse Companions
          </h1>
          <p className="text-sm text-muted mt-1 ml-10">
            {loading ? 'Searching…' : `${total} companion${total !== 1 ? 's' : ''} on Meytle`}
          </p>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* ── Left sidebar: filters (desktop only) ────────────────────── */}
        <aside className="hidden lg:block w-56 xl:w-64 shrink-0 sticky top-[62px]">
          <div className="bg-surface rounded-2xl border border-border p-5">
            <p className="text-sm font-bold text-heading mb-5 flex items-center gap-2">
              <IconFilter size={14} className="text-accent-green" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-auto text-[10px] text-white font-bold w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                  {activeFilterCount}
                </span>
              )}
            </p>
            <FilterSection service={service} availableOnly={availableOnly} setParam={setParam} />
          </div>
        </aside>

        {/* ── Right: search + results ──────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Search bar */}
          <div className="relative mb-4">
            <IconSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder="Search by name, vibe, service…"
              className="w-full pl-11 pr-10 py-3 rounded-2xl border border-border bg-surface text-sm text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/30 focus:border-accent-green/50 transition shadow-sm"
            />
            {query && (
              <button onClick={() => setParam('q', '')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-body p-0.5 rounded-full hover:bg-surface-alt transition">
                <IconX size={14} />
              </button>
            )}
          </div>

          {/* Mobile: horizontal chip filters */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin">
            <button onClick={() => setParam('service', '')}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                !service ? 'text-white border-transparent' : 'bg-surface border-border text-muted'
              }`}
              style={!service ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
              ✨ All
            </button>
            {SERVICE_OPTIONS.map(({ value, label, emoji }) => (
              <button key={value} onClick={() => setParam('service', service === value ? '' : value)}
                className={`shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  service === value ? 'text-white border-transparent' : 'bg-surface border-border text-muted'
                }`}
                style={service === value ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
                {emoji} {label}
              </button>
            ))}
          </div>

          {/* Result count + active filter tags */}
          {!loading && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-muted">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
              {service && (
                <button onClick={() => setParam('service', '')}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full text-white"
                  style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                  {SERVICE_OPTIONS.find(o => o.value === service)?.emoji} {SERVICE_LABELS[service]}
                  <IconX size={11} />
                </button>
              )}
              {availableOnly && (
                <button onClick={() => setParam('available', '')}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-surface-alt text-accent-green border border-accent-green/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                  Available now
                  <IconX size={11} />
                </button>
              )}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <IconLoader2 size={28} className="animate-spin text-muted" />
              <p className="text-sm text-muted">Finding companions…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-surface rounded-2xl border border-dashed border-border">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold text-heading mb-1">No companions found</p>
              <p className="text-sm text-muted mb-4">Try a different search or remove filters</p>
              {(query || service || availableOnly) && (
                <button
                  onClick={() => { setParam('q',''); setParam('service',''); setParam('available',''); }}
                  className="text-sm font-semibold text-white px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                  Clear all
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((c) => <CompanionCard key={c.id} companion={c} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
