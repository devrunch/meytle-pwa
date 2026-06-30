import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  IconStar, IconArrowRight, IconShieldCheck, IconId, IconMessage,
  IconLock, IconSearch, IconMessages, IconHeart, IconQuote,
  IconCoffee, IconPlane, IconMusic, IconCamera, IconBriefcase,
  IconMapPin, IconBalloon, IconLoader2,
} from '@tabler/icons-react';
import { client } from '../api/client';
import type { CompanionProfile, ServiceType } from '../types';

// ── SVG decoratives (ported from old frontend) ───────────────────────────────

function Ring({ size, stroke = 1, className = '' }: { size: number; stroke?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className={`absolute pointer-events-none select-none ${className}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={size / 2 - stroke} fill="none" stroke="currentColor" strokeWidth={stroke} />
    </svg>
  );
}

function DotGrid({ cols = 6, rows = 4, gap = 18, className = '' }: { cols?: number; rows?: number; gap?: number; className?: string }) {
  const w = (cols - 1) * gap;
  const h = (rows - 1) * gap;
  return (
    <svg width={w} height={h} className={`absolute pointer-events-none select-none ${className}`} aria-hidden>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <circle key={`${r}-${c}`} cx={c * gap} cy={r * gap} r={1.5} fill="currentColor" />
        ))
      )}
    </svg>
  );
}

function Sparkle({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      className={`absolute pointer-events-none select-none ${className}`} aria-hidden>
      <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"
        fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function WaveLine({ width = 200, className = '' }: { width?: number; className?: string }) {
  const segments = Math.floor(width / 30);
  const d = `M0 12 ${Array.from({ length: segments }).map((_, i) =>
    `Q${i * 30 + 15} ${i % 2 === 0 ? 2 : 22} ${(i + 1) * 30} 12`
  ).join(' ')}`;
  return (
    <svg width={width} height={24} viewBox={`0 0 ${width} 24`}
      className={`absolute pointer-events-none select-none ${className}`} aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Diamond({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32"
      className={`absolute pointer-events-none select-none ${className}`} aria-hidden>
      <rect x="4" y="4" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.2"
        transform="rotate(45 16 16)" />
    </svg>
  );
}

function FI({ icon, className = '' }: { icon: React.ReactNode; className?: string }) {
  return <div className={`absolute pointer-events-none select-none ${className}`} aria-hidden>{icon}</div>;
}

// ── Data ─────────────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<ServiceType, string> = {
  coffee: 'Coffee', dining: 'Dining', concert: 'Concerts',
  travel: 'Travel', fitness: 'Fitness', culture: 'Culture',
  nature: 'Nature', movies: 'Movies', shopping: 'Shopping', gaming: 'Gaming',
};

const TRUST_ITEMS = [
  { icon: <IconId size={16} stroke={1.5} />, label: 'ID Verified', sub: 'Every profile verified with government ID' },
  { icon: <IconShieldCheck size={16} stroke={1.5} />, label: 'Secure Payments', sub: 'All payments encrypted and secure' },
  { icon: <IconMessage size={16} stroke={1.5} />, label: 'Private Messaging', sub: 'Chat securely before you meet' },
  { icon: <IconLock size={16} stroke={1.5} />, label: 'Background Checks', sub: 'Companions vetted and approved' },
];

const HOW_STEPS = [
  { n: '1', icon: <IconSearch size={30} stroke={1.5} />, title: 'Discover', body: 'Browse verified companions and experiences that match your vibe.' },
  { n: '2', icon: <IconMessages size={30} stroke={1.5} />, title: 'Connect', body: 'Chat securely, plan the details, and book with confidence.' },
  { n: '3', icon: <IconHeart size={30} stroke={1.5} />, title: 'Meet', body: 'Enjoy amazing real-world experiences and meaningful connections.' },
];

const STATS = [
  { value: '10,000+', label: 'Experiences' },
  { value: '4.9', label: 'Average Rating' },
  { value: '50+', label: 'Cities' },
  { value: '95%', label: 'Positive Reviews' },
];

const TESTIMONIALS = [
  { quote: 'Meytle made exploring a new city feel effortless. I met an amazing coffee companion and had the most genuine conversation in years.', name: 'Jessica M.', loc: 'New York, USA', exp: 'Coffee Date' },
  { quote: 'As a solo traveller, Meytle gave me the confidence to explore Mumbai with a local guide by my side. Completely changed my trip.', name: 'Daniel K.', loc: 'London, UK', exp: 'Travel Companion' },
  { quote: 'The platform is super safe, easy to use, and the companions are exactly who they say they are. Booked three times already.', name: 'Priya S.', loc: 'Dubai, UAE', exp: 'Fine Dining' },
];

const EXPERIENCES = [
  { emoji: '☕', label: 'Coffee', img: 'photo-1554126807-6b10f6f6692a' },
  { emoji: '🍽️', label: 'Dining', img: 'photo-1414235077428-338989a2e8c0' },
  { emoji: '🎵', label: 'Concerts', img: 'photo-1493225457124-a3eb161ffa5f' },
  { emoji: '✈️', label: 'Travel', img: 'photo-1436491865332-7a61a109cc05' },
  { emoji: '🎭', label: 'Culture', img: 'photo-1516450360452-9312f5e86fc7' },
  { emoji: '🌿', label: 'Nature', img: 'photo-1441974231531-c6227db76b6e' },
  { emoji: '🏃', label: 'Fitness', img: 'photo-1571019613454-1cb2f99b2d8b' },
  { emoji: '🎬', label: 'Movies', img: 'photo-1489599849927-2ee91cede3ba' },
  { emoji: '🛍️', label: 'Shopping', img: 'photo-1483985988355-763728e1935b' },
  { emoji: '🎮', label: 'Gaming', img: 'photo-1493711662062-fa541adb3fc8' },
];

// ── Companion card (public — no booking) ────────────────────────────────────

function CompanionCard({ companion }: { companion: CompanionProfile }) {
  const rate = Math.round(companion.hourlyRatePaisa / 100);
  const services = companion.services?.map((s) => SERVICE_LABELS[s.serviceType]) ?? [];
  return (
    <div className="card overflow-hidden group">
      <div className="relative aspect-[3/4] bg-surface-alt overflow-hidden">
        {companion.profilePhotoUrl ? (
          <img src={companion.profilePhotoUrl} alt={companion.displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center gradient-primary">
            <span className="text-white text-4xl font-bold">{companion.displayName[0]}</span>
          </div>
        )}
        {companion.isAvailableNow && (
          <span className="absolute top-2 left-2 bg-accent-green text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Available
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-semibold text-sm">{companion.displayName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <IconStar size={11} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white/80 text-xs">{companion.ratingAvg?.toFixed(1) ?? '—'}</span>
            <span className="text-white/50 text-xs ml-auto">${rate.toLocaleString('en-US')}/hr</span>
          </div>
        </div>
      </div>
      {services.length > 0 && (
        <div className="px-3 py-2 flex gap-1 flex-wrap">
          {services.slice(0, 2).map((s) => (
            <span key={s} className="text-[10px] bg-surface-alt text-muted px-2 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function LandingPage() {
  const [companions, setCompanions] = useState<CompanionProfile[]>([]);
  const [loadingCompanions, setLoadingCompanions] = useState(true);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)();

  const handleBrowse = () => navigate(isAuthenticated ? '/home' : '/login');

  useEffect(() => {
    client.get('/companions', { params: { limit: 6 } })
      .then((r) => setCompanions(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingCompanions(false));
  }, []);

  return (
    <div className="overflow-x-hidden bg-surface-mint">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-[60px] flex items-center justify-between gap-6">
          <span className="text-xl font-extrabold gradient-primary-text tracking-tight shrink-0">Meytle</span>

          {/* Center links */}
          <nav className="hidden md:flex items-center bg-surface-mint border border-border rounded-full px-1.5 py-1 gap-0.5">
            {[
              { href: '#how', label: 'How it works' },
              { href: '#experiences', label: 'Services' },
              { href: '#safety', label: 'Safety' },
            ].map(({ href, label }) => (
              <a key={href} href={href}
                className="px-4 py-1.5 rounded-full text-sm font-medium text-muted hover:text-body hover:bg-surface transition-colors">
                {label}
              </a>
            ))}
            <button onClick={handleBrowse}
              className="px-4 py-1.5 rounded-full text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#00D4AA 0%,#00C2D8 50%,#4F8CFF 100%)' }}>
              Browse
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <Link to="/home" className="btn-primary py-2 px-5 text-sm">Go to app</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost py-2 px-4 text-sm">Sign in</Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm">Join free</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative max-w-5xl mx-auto px-4 pt-16 pb-14 overflow-hidden">
        <Ring size={420} className="text-accent-green opacity-[0.06] -top-20 -right-20 hidden md:block" />
        <Ring size={240} className="text-accent-green opacity-[0.08] -top-4 right-16 hidden md:block" />
        <DotGrid cols={8} rows={6} gap={20} className="text-accent-green opacity-[0.12] top-8 right-0 hidden md:block" />
        <Sparkle size={28} className="text-accent-green opacity-20 top-12 left-[48%] hidden md:block" />
        <FI icon={<IconHeart size={36} stroke={1} className="text-accent-green opacity-10" />} className="top-8 left-10 hidden md:block" />
        <FI icon={<IconCoffee size={26} stroke={1} className="text-accent-green opacity-10" />} className="bottom-16 left-[30%] hidden md:block" />
        <FI icon={<IconPlane size={30} stroke={1} className="text-accent-green opacity-10 -rotate-12" />} className="top-20 left-[38%] hidden md:block" />

        <div className="grid md:grid-cols-2 gap-10 items-center relative z-10">
          {/* Left copy */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-accent-green mb-4">
              Find your companion
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-heading leading-[1.12] mb-5">
              Find Meaningful<br />Company For Every{' '}
              <span className="gradient-primary-text">Experience</span>
            </h1>
            <p className="text-muted text-base leading-relaxed max-w-md mb-8">
              From coffee dates and rooftop dinners to concerts, travel, and city adventures —
              discover verified companions who match your vibe.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              <Link to="/register" className="btn-primary flex items-center gap-2 px-7 py-3">
                <IconSearch size={16} /> Explore Companions
              </Link>
              <Link to="/register" className="btn-ghost px-7 py-3">
                Become a Companion
              </Link>
            </div>
            <p className="text-xs text-muted">Free to browse — No credit card required</p>
            <div className="flex flex-wrap gap-4 mt-6">
              {['Verified Profiles', 'Secure Payments', 'Private Messaging'].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-xs text-muted">
                  <div className="w-4 h-4 rounded-full bg-surface-alt flex items-center justify-center">
                    <IconShieldCheck size={10} stroke={2} className="text-accent-green" />
                  </div>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right hero image */}
          <div className="relative hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1554126807-6b10f6f6692a?w=700&h=500&fit=crop&crop=center"
              alt="Two people enjoying a coffee date"
              className="w-full h-[420px] object-cover rounded-3xl"
            />
            {/* Floating rating badge */}
            <div className="absolute bottom-4 right-4 bg-surface rounded-2xl border border-border px-3 py-2.5 shadow-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex -space-x-1.5">
                  {[11, 12, 13].map((i) => (
                    <img key={i} src={`https://i.pravatar.cc/28?img=${i}`} alt=""
                      className="w-7 h-7 rounded-full border-2 border-white" />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <IconStar size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-heading">4.9</span>
                  </div>
                  <div className="text-[10px] text-muted">Average Rating</div>
                </div>
              </div>
              <div className="flex gap-3 pt-1.5 border-t border-border">
                <span className="flex items-center gap-1 text-[10px] text-muted">
                  <IconShieldCheck size={11} className="text-accent-green" /> Verified
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted">
                  <IconId size={11} className="text-accent-green" /> Real-time Booking
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="border-y border-border bg-surface py-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto scrollbar-hide">
            {TRUST_ITEMS.map(({ icon, label, sub }) => (
              <div key={label} className="flex items-center gap-2.5 shrink-0">
                <div className="text-accent-green">{icon}</div>
                <div>
                  <p className="text-xs font-semibold text-heading">{label}</p>
                  <p className="text-[10px] text-muted">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Experience categories ── */}
      <section id="experiences" className="relative py-14 overflow-hidden">
        <DotGrid cols={5} rows={5} gap={22} className="text-accent-green opacity-[0.1] top-6 left-6" />
        <DotGrid cols={5} rows={5} gap={22} className="text-accent-green opacity-[0.1] bottom-6 right-6" />
        <FI icon={<IconMusic size={34} stroke={1} className="text-accent-green opacity-10" />} className="top-10 right-24 hidden md:block" />
        <FI icon={<IconPlane size={28} stroke={1} className="text-accent-green opacity-10 rotate-12" />} className="bottom-10 left-[18%] hidden md:block" />

        <div className="max-w-5xl mx-auto px-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-accent-green mb-2">Explore by experience</div>
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl font-extrabold text-heading">
              Whatever The Occasion,<br />
              <span className="gradient-primary-text">Never Go Alone</span>
            </h2>
            <Link to="/register" className="text-sm text-accent-green font-medium hidden md:flex items-center gap-1 hover:underline">
              View all <IconArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {EXPERIENCES.map(({ emoji, label, img }) => (
              <Link to="/register" key={label}
                className="group relative overflow-hidden rounded-2xl aspect-[4/5] block">
                <img
                  src={`https://images.unsplash.com/${img}?w=300&h=400&fit=crop&crop=center`}
                  alt={label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="text-xl">{emoji}</span>
                  <p className="text-white text-xs font-semibold mt-0.5">{label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured companions ── */}
      {(companions.length > 0 || loadingCompanions) && (
        <section className="relative bg-surface border-y border-border py-14 overflow-hidden">
          <Ring size={320} className="text-accent-green opacity-[0.04] -bottom-20 -left-20" />
          <Sparkle size={22} className="text-accent-green opacity-15 top-10 right-24 hidden md:block" />
          <FI icon={<IconHeart size={40} stroke={1} className="text-accent-green opacity-10" />} className="top-12 left-[60%] hidden md:block" />
          <FI icon={<IconMapPin size={28} stroke={1} className="text-accent-green opacity-10" />} className="top-16 right-10 hidden md:block" />

          <div className="relative z-10 max-w-5xl mx-auto px-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-accent-green mb-2">Featured companions</div>
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-3xl font-extrabold text-heading">
                Meet <span className="gradient-primary-text">Featured</span> Companions
              </h2>
              <Link to="/register" className="text-sm text-accent-green font-medium hidden md:flex items-center gap-1 hover:underline">
                See all <IconArrowRight size={14} />
              </Link>
            </div>

            {loadingCompanions ? (
              <div className="flex justify-center py-12">
                <IconLoader2 size={28} className="animate-spin text-muted" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {companions.map((c) => (
                  <CompanionCard key={c.id} companion={c} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section id="how" className="relative max-w-5xl mx-auto px-4 py-14 text-center overflow-hidden">
        <span className="absolute left-[8%] top-20 text-[140px] font-black text-accent-green opacity-[0.04] leading-none select-none hidden md:block">1</span>
        <span className="absolute left-[40%] top-20 text-[140px] font-black text-accent-green opacity-[0.04] leading-none select-none hidden md:block">2</span>
        <span className="absolute right-[8%] top-20 text-[140px] font-black text-accent-green opacity-[0.04] leading-none select-none hidden md:block">3</span>
        <WaveLine width={200} className="text-accent-green opacity-10 bottom-2 left-1/2 -translate-x-1/2 hidden md:block" />
        <FI icon={<IconBriefcase size={30} stroke={1} className="text-accent-green opacity-10" />} className="bottom-12 left-16 hidden md:block" />
        <FI icon={<IconCoffee size={26} stroke={1} className="text-accent-green opacity-10" />} className="bottom-8 right-20 hidden md:block" />
        <FI icon={<IconCamera size={24} stroke={1} className="text-accent-green opacity-10" />} className="top-16 left-[52%] hidden md:block" />

        <div className="relative z-10">
          <div className="text-xs font-semibold uppercase tracking-widest text-accent-green mb-2">How Meytle works</div>
          <h2 className="text-3xl font-extrabold text-heading mb-12">
            <span className="gradient-primary-text">Simple, Secure, Seamless</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[22%] right-[22%] border-t border-dashed border-border" />
            {HOW_STEPS.map(({ n, icon, title, body }) => (
              <div key={n} className="flex flex-col items-center gap-3 relative z-10">
                <div className="text-lg font-extrabold gradient-primary-text">{n}</div>
                <div className="w-16 h-16 rounded-2xl bg-surface-alt flex items-center justify-center text-accent-green">
                  {icon}
                </div>
                <p className="text-base font-bold text-heading">{title}</p>
                <p className="text-sm text-muted max-w-[200px]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats / Safety ── */}
      <section id="safety" className="relative py-14 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #00D4AA 0%, #00C2D8 50%, #4F8CFF 100%)' }}>
        <Ring size={500} stroke={1} className="text-white opacity-[0.07] -top-40 -left-40" />
        <Ring size={400} stroke={1} className="text-white opacity-[0.07] -bottom-32 -right-32" />
        <DotGrid cols={10} rows={4} gap={24} className="text-white opacity-[0.08] top-6 right-12 hidden md:block" />
        <Sparkle size={32} className="text-white opacity-15 top-8 left-1/4 hidden md:block" />
        <Diamond size={40} className="text-white opacity-10 top-1/2 left-1/2 hidden md:block" />
        <FI icon={<IconHeart size={36} stroke={1} className="text-white opacity-10" />} className="top-4 left-8 hidden md:block" />
        <FI icon={<IconPlane size={32} stroke={1} className="text-white opacity-10 -rotate-10" />} className="bottom-4 right-10 hidden md:block" />
        <FI icon={<IconMusic size={26} stroke={1} className="text-white opacity-10" />} className="top-6 right-[20%] hidden md:block" />
        <FI icon={<IconBalloon size={28} stroke={1} className="text-white opacity-10" />} className="bottom-4 left-[35%] hidden md:block" />

        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div className="text-4xl font-extrabold">{value}</div>
                <div className="text-sm opacity-75 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="relative max-w-5xl mx-auto px-4 py-14 overflow-hidden">
        <DotGrid cols={4} rows={6} gap={20} className="text-accent-green opacity-[0.08] -top-4 right-0 hidden md:block" />
        <Sparkle size={18} className="text-accent-green opacity-20 top-8 left-1/2 hidden md:block" />

        <div className="relative z-10">
          <div className="text-xs font-semibold uppercase tracking-widest text-accent-green mb-2">Real people</div>
          <h2 className="text-3xl font-extrabold text-heading mb-10">
            Real People. Real Experiences.<br />
            <span className="gradient-primary-text">Real Connections.</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, loc, exp }) => (
              <div key={name} className="card flex flex-col gap-4 p-5">
                <IconQuote size={28} className="text-surface-alt fill-surface-alt" />
                <p className="text-sm text-muted leading-relaxed flex-1">"{quote}"</p>
                <div className="flex items-center gap-2.5 pt-3 border-t border-border mt-auto">
                  <img src={`https://i.pravatar.cc/32?u=${name}`} alt={name}
                    className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="text-xs font-semibold text-heading">{name}</p>
                    <p className="text-[10px] text-muted">{loc} · {exp}</p>
                  </div>
                  <div className="ml-auto flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <IconStar key={i} size={10} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="relative border-t border-border bg-surface py-20 text-center overflow-hidden">
        <Ring size={600} stroke={0.8} className="text-accent-green opacity-[0.06] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <Ring size={400} stroke={0.8} className="text-accent-green opacity-[0.07] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <Ring size={240} stroke={1} className="text-accent-green opacity-[0.09] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <Sparkle size={32} className="text-accent-green opacity-20 top-10 left-16 hidden md:block" />
        <Sparkle size={32} className="text-accent-green opacity-20 top-10 right-16 hidden md:block" />
        <Diamond size={36} className="text-accent-green opacity-10 bottom-12 left-24 hidden md:block" />
        <FI icon={<IconHeart size={48} stroke={1} className="text-accent-green opacity-10" />} className="top-8 left-8 hidden md:block" />
        <FI icon={<IconHeart size={32} stroke={1} className="text-accent-green opacity-10" />} className="top-8 right-10 hidden md:block" />
        <FI icon={<IconPlane size={36} stroke={1} className="text-accent-green opacity-10 rotate-10" />} className="bottom-16 left-20 hidden md:block" />
        <FI icon={<IconBriefcase size={32} stroke={1} className="text-accent-green opacity-10" />} className="bottom-16 right-20 hidden md:block" />

        <div className="relative z-10 max-w-lg mx-auto px-6">
          <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-accent-green/30">
            <IconHeart size={24} stroke={1.5} className="text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-heading mb-3">
            Life Is Better <span className="gradient-primary-text">Shared</span>
          </h2>
          <p className="text-muted mb-8 leading-relaxed">
            Join a modern community built around experiences,<br className="hidden md:block" />
            connection, and meaningful companionship.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary px-8 py-3.5 text-base flex items-center justify-center gap-2">
              Get Started — it's free <IconArrowRight size={16} />
            </Link>
            <a href="#how" className="btn-ghost px-8 py-3.5 text-base">Learn how it works</a>
          </div>
          <Link to="/login" className="block mt-5 text-sm text-accent-green hover:underline">
            Already have an account? <span className="font-semibold">Sign in</span>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-surface py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <span className="text-base font-extrabold gradient-primary-text">Meytle</span>
              <p className="text-xs text-muted mt-2 leading-relaxed">Meaningful companionship for every experience.</p>
            </div>
            {[
              { title: 'Company', links: [{ label: 'About Us', href: '#' }, { label: 'Careers', href: '#' }, { label: 'Press', href: '#' }] },
              { title: 'Safety', links: [{ label: 'Safety Center', href: '#' }, { label: 'Verification', href: '#' }, { label: 'Privacy', href: '/privacy' }, { label: 'Guidelines', href: '#' }] },
              { title: 'Support', links: [{ label: 'Help Center', href: '#' }, { label: 'Contact Us', href: '#' }, { label: 'Trust & Safety', href: '#' }, { label: 'Community', href: '#' }] },
              { title: 'Legal', links: [{ label: 'Terms of Service', href: '/terms' }, { label: 'Privacy Policy', href: '/privacy' }, { label: 'Cookie Policy', href: '#' }, { label: 'Refund Policy', href: '#' }] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="text-[11px] font-bold text-heading uppercase tracking-wider mb-3">{title}</p>
                <div className="flex flex-col gap-2">
                  {links.map(({ label, href }) => (
                    <a key={label} href={href} className="text-xs text-muted hover:text-body transition-colors">{label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-border text-xs text-muted text-center">
            © 2025 Meytle. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
