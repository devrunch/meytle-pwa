import { useNavigate } from 'react-router-dom'
import { IconShieldCheck, IconLock, IconMessage, IconId, IconSearch, IconMessages, IconHeart, IconQuote, IconStar, IconArrowRight, IconCoffee, IconPlane, IconMusic, IconCamera, IconBriefcase, IconMapPin, IconBalloon } from '@tabler/icons-react'
import { Button, CompanionCard, ExperienceCard } from '../components/ui'
import { MOCK_COMPANIONS, MOCK_EXPERIENCES } from '../data/mock'
import type { ExperienceType } from '../types'

// ── Decorative SVG primitives ─────────────────────────────────────────────────

function Ring({ size, stroke = 1, className = '' }: { size: number; stroke?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={`absolute pointer-events-none select-none ${className}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={size / 2 - stroke} fill="none" stroke="currentColor" strokeWidth={stroke} />
    </svg>
  )
}

function DotGrid({ cols = 6, rows = 4, gap = 18, className = '' }: { cols?: number; rows?: number; gap?: number; className?: string }) {
  const w = (cols - 1) * gap
  const h = (rows - 1) * gap
  return (
    <svg width={w} height={h} className={`absolute pointer-events-none select-none ${className}`} aria-hidden>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <circle key={`${r}-${c}`} cx={c * gap} cy={r * gap} r={1.5} fill="currentColor" />
        ))
      )}
    </svg>
  )
}

function Sparkle({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`absolute pointer-events-none select-none ${className}`} aria-hidden>
      <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function CrossHatch({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={`absolute pointer-events-none select-none ${className}`} aria-hidden>
      <line x1="0" y1="20" x2="40" y2="20" stroke="currentColor" strokeWidth="1" />
      <line x1="20" y1="0" x2="20" y2="40" stroke="currentColor" strokeWidth="1" />
      <circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

function WaveLine({ width = 200, className = '' }: { width?: number; className?: string }) {
  return (
    <svg width={width} height={24} viewBox={`0 0 ${width} 24`} className={`absolute pointer-events-none select-none ${className}`} aria-hidden>
      <path
        d={`M0 12 ${Array.from({ length: Math.floor(width / 30) }).map((_, i) => `Q${i * 30 + 15} ${i % 2 === 0 ? 2 : 22} ${(i + 1) * 30} 12`).join(' ')}`}
        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
    </svg>
  )
}

function Diamond({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={`absolute pointer-events-none select-none ${className}`} aria-hidden>
      <rect x="4" y="4" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.2" transform="rotate(45 16 16)" />
    </svg>
  )
}

function FloatingIcon({ icon, className = '' }: { icon: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute pointer-events-none select-none ${className}`} aria-hidden>
      {icon}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { icon: <IconId size={16} stroke={1.5} color="var(--color-amber)" />,           label: 'ID Verified',        sub: 'Every profile verified with government ID' },
  { icon: <IconShieldCheck size={16} stroke={1.5} color="var(--color-amber)" />,  label: 'Secure Payments',    sub: 'All payments encrypted and secure' },
  { icon: <IconMessage size={16} stroke={1.5} color="var(--color-amber)" />,      label: 'Private Messaging',  sub: 'Chat securely before you meet' },
  { icon: <IconLock size={16} stroke={1.5} color="var(--color-amber)" />,         label: 'Background Checks',  sub: 'Companions vetted and approved' },
]

const HOW_STEPS = [
  { n: '1', icon: <IconSearch size={32} stroke={1.5} color="var(--color-amber)" />,   title: 'Discover',  body: 'Browse verified companions and experiences that match your vibe.' },
  { n: '2', icon: <IconMessages size={32} stroke={1.5} color="var(--color-amber)" />, title: 'Connect',   body: 'Chat securely, plan the details, and book with confidence.' },
  { n: '3', icon: <IconHeart size={32} stroke={1.5} color="var(--color-amber)" />,    title: 'Meet',      body: 'Enjoy amazing real-world experiences and meaningful connections.' },
]

const TESTIMONIALS = [
  { quote: 'Meytle made exploring a new city feel effortless. I met an amazing coffee companion and had the most genuine conversation in years.', name: 'Jessica M.', loc: 'New York, USA', exp: 'Coffee Date' },
  { quote: 'As a solo traveller, Meytle gave me the confidence to explore Mumbai with a local guide by my side. Completely changed my trip.', name: 'Daniel K.', loc: 'London, UK', exp: 'Travel Companion' },
  { quote: 'The platform is super safe, easy to use, and the companions are exactly who they say they are. Booked three times already.', name: 'Priya S.', loc: 'Dubai, UAE', exp: 'Fine Dining' },
]

const STATS = [
  { value: '10,000+', label: 'Experiences' },
  { value: '4.9',     label: 'Average Rating' },
  { value: '50+',     label: 'Cities' },
  { value: '95%',     label: 'Positive Reviews' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20 py-12 md:py-16 overflow-hidden">
        {/* Decorative background elements */}
        <Ring size={420} className="text-[var(--color-amber)] opacity-[0.06] -top-20 -right-20 hidden md:block" />
        <Ring size={240} className="text-[var(--color-amber)] opacity-[0.08] -top-4 right-16 hidden md:block" />
        <DotGrid cols={8} rows={6} gap={20} className="text-[var(--color-amber)] opacity-[0.12] top-8 right-0 hidden md:block" />
        <Sparkle size={28} className="text-[var(--color-amber)] opacity-20 top-12 left-[48%] hidden md:block" />
        <Sparkle size={16} className="text-[var(--color-amber)] opacity-15 bottom-16 left-[42%] hidden md:block" />
        <Diamond size={36} className="text-[var(--color-amber)] opacity-10 bottom-10 right-[38%] hidden md:block" />
        <FloatingIcon icon={<IconHeart size={40} stroke={1} color="var(--color-amber)" />} className="opacity-[0.10] top-8 left-10 hidden md:block" />
        <FloatingIcon icon={<IconCoffee size={28} stroke={1} color="var(--color-amber)" />} className="opacity-[0.09] bottom-20 left-[30%] hidden md:block" />
        <FloatingIcon icon={<IconPlane size={32} stroke={1} color="var(--color-amber)" />} className="opacity-[0.08] top-20 left-[38%] hidden md:block rotate-[-20deg]" />
        <FloatingIcon icon={<IconCamera size={24} stroke={1} color="var(--color-amber)" />} className="opacity-[0.08] bottom-12 right-10 hidden md:block" />

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
          {/* Left */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-amber)] mb-4">
              Find your companion
            </div>
            <h1 className="text-[36px] md:text-[52px] font-semibold text-[var(--color-dark)] leading-[1.15] mb-5">
              Find Meaningful<br />Company For Every{' '}
              <span className="text-gradient-primary">Experience</span>
            </h1>
            <p className="text-[14px] md:text-[15px] text-[var(--color-gray)] leading-[1.65] max-w-[400px] mb-8">
              From coffee dates and rooftop dinners to concerts, travel, and city adventures — discover verified companions who match your vibe.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button size="lg" icon={<IconSearch size={16} stroke={1.5} />} onClick={() => navigate('/app')}>
                Explore Companions
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/register')}>
                Become a Companion
              </Button>
            </div>
            <p className="text-[11px] text-[#999999]">Free to browse — No credit card required</p>
            <div className="flex flex-wrap gap-4 mt-8">
              {['Verified Profiles', 'Secure Payments', 'Private Messaging'].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-[11px] text-[var(--color-gray)]">
                  <div className="w-4 h-4 rounded-full bg-[var(--color-amber-light)] flex items-center justify-center">
                    <IconShieldCheck size={9} stroke={2} color="var(--color-amber)" />
                  </div>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — hero photo */}
          <div className="relative hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1554126807-6b10f6f6692a?w=700&h=500&fit=crop&crop=center"
              alt="Two people enjoying a coffee date"
              className="w-full h-[420px] object-cover rounded-[var(--radius-xl)]"
            />
            <div className="absolute bottom-4 right-4 bg-white rounded-[10px] border-[0.5px] border-[var(--color-border)] px-3 py-2.5 shadow-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex -space-x-1">
                  {[1,2,3].map((i) => (
                    <img key={i} src={`https://i.pravatar.cc/28?img=${i+10}`} alt="" className="w-7 h-7 rounded-full border-2 border-white" />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <IconStar size={12} stroke={0} fill="var(--color-amber)" color="var(--color-amber)" />
                    <span className="text-[13px] font-semibold text-[var(--color-dark)]">4.9</span>
                  </div>
                  <div className="text-[10px] text-[var(--color-gray)]">Average Rating</div>
                </div>
              </div>
              <div className="flex gap-3 pt-1.5 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-1 text-[10px] text-[var(--color-gray)]">
                  <IconShieldCheck size={11} stroke={1.5} color="var(--color-amber)" />
                  Verified Members
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[var(--color-gray)]">
                  <IconId size={11} stroke={1.5} color="var(--color-amber)" />
                  Real-time Booking
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section id="safety" className="border-y-[0.5px] border-[var(--color-border)] bg-[var(--color-bg)] py-4">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            {TRUST_ITEMS.map(({ icon, label, sub }) => (
              <div key={label} className="flex items-center gap-2.5 flex-shrink-0">
                {icon}
                <div>
                  <div className="text-[12px] font-medium text-[var(--color-dark)]">{label}</div>
                  <div className="text-[10px] text-[var(--color-gray)]">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Experience categories — Marquee ──────────────────────────── */}
      <section className="relative py-14 overflow-hidden">
        <DotGrid cols={5} rows={5} gap={22} className="text-[var(--color-amber)] opacity-[0.1] top-6 left-6" />
        <DotGrid cols={5} rows={5} gap={22} className="text-[var(--color-amber)] opacity-[0.1] bottom-6 right-6" />
        <FloatingIcon icon={<IconMusic size={36} stroke={1} color="var(--color-amber)" />} className="opacity-[0.09] top-10 right-24 hidden md:block" />
        <FloatingIcon icon={<IconPlane size={30} stroke={1} color="var(--color-amber)" />} className="opacity-[0.08] bottom-10 left-[18%] hidden md:block rotate-[15deg]" />
        <FloatingIcon icon={<IconBalloon size={28} stroke={1} color="var(--color-amber)" />} className="opacity-[0.09] top-8 left-[55%] hidden md:block" />

        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-amber)] mb-2">Explore by experience</div>
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-[28px] md:text-[32px] font-semibold text-[var(--color-dark)]">
              Whatever The Occasion,<br />
              <span className="text-gradient-primary">Never Go Alone</span>
            </h2>
            <button onClick={() => navigate('/app')} className="text-[12px] text-[var(--color-amber)] font-medium hidden md:flex items-center gap-1 hover:underline">
              View all <IconArrowRight size={13} stroke={1.5} />
            </button>
          </div>
        </div>

        <div className="marquee-wrap">
          <div className="marquee-track gap-4 px-4">
            {[...MOCK_EXPERIENCES, ...MOCK_EXPERIENCES].map(({ type, label }, i) => (
              <ExperienceCard
                key={`${type}-${i}`}
                type={type as ExperienceType}
                label={label}
                onClick={() => navigate('/app')}
                className="w-[180px] h-[140px] md:w-[220px] md:h-[160px]"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured companions ── */}
      <section className="relative bg-white border-y-[0.5px] border-[var(--color-border)] py-14 overflow-hidden">
        <Ring size={320} className="text-[var(--color-amber)] opacity-[0.04] -bottom-20 -left-20" />
        <Ring size={160} className="text-[var(--color-amber)] opacity-[0.06] bottom-10 left-10" />
        <Sparkle size={22} className="text-[var(--color-amber)] opacity-[0.18] top-10 right-24 hidden md:block" />
        <Sparkle size={14} className="text-[var(--color-amber)] opacity-[0.14] bottom-16 right-1/3 hidden md:block" />
        <FloatingIcon icon={<IconHeart size={44} stroke={1} color="var(--color-amber)" />} className="opacity-[0.08] top-12 left-[60%] hidden md:block" />
        <FloatingIcon icon={<IconHeart size={24} stroke={1} color="var(--color-amber)" />} className="opacity-[0.07] bottom-8 left-[42%] hidden md:block" />
        <FloatingIcon icon={<IconMapPin size={30} stroke={1} color="var(--color-amber)" />} className="opacity-[0.09] top-16 right-10 hidden md:block" />

        <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-amber)] mb-2">Featured companions</div>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-[28px] font-semibold text-[var(--color-dark)]">Meet <span className="text-gradient-primary">Featured</span> Companions</h2>
            <button onClick={() => navigate('/app')} className="text-[12px] text-[var(--color-amber)] font-medium hidden md:flex items-center gap-1 hover:underline">
              View all <IconArrowRight size={13} stroke={1.5} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {MOCK_COMPANIONS.map((c) => (
              <CompanionCard key={c.id} companion={c} onClick={() => navigate(`/companions/${c.id}`)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20 py-14 text-center overflow-hidden">
        {/* Large ghost numbers behind steps */}
        <span className="absolute left-[8%] top-24 text-[160px] font-black text-[var(--color-amber)] opacity-[0.04] leading-none select-none hidden md:block">1</span>
        <span className="absolute left-[40%] top-24 text-[160px] font-black text-[var(--color-amber)] opacity-[0.04] leading-none select-none hidden md:block">2</span>
        <span className="absolute right-[8%] top-24 text-[160px] font-black text-[var(--color-amber)] opacity-[0.04] leading-none select-none hidden md:block">3</span>
        <WaveLine width={200} className="text-[var(--color-amber)] opacity-[0.1] -bottom-2 left-1/2 -translate-x-1/2 hidden md:block" />
        <CrossHatch size={44} className="text-[var(--color-amber)] opacity-[0.12] top-8 left-8 hidden md:block" />
        <CrossHatch size={44} className="text-[var(--color-amber)] opacity-[0.12] top-8 right-8 hidden md:block" />
        <FloatingIcon icon={<IconBriefcase size={34} stroke={1} color="var(--color-amber)" />} className="opacity-[0.08] bottom-12 left-16 hidden md:block" />
        <FloatingIcon icon={<IconCoffee size={30} stroke={1} color="var(--color-amber)" />} className="opacity-[0.08] bottom-8 right-20 hidden md:block" />
        <FloatingIcon icon={<IconCamera size={26} stroke={1} color="var(--color-amber)" />} className="opacity-[0.08] top-16 left-[52%] hidden md:block" />

        <div className="relative z-10">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-amber)] mb-2">How Meytle Works</div>
          <h2 className="text-[28px] font-semibold mb-12"><span className="text-gradient-primary">Simple, Secure, Seamless</span></h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-0 relative">
            <div className="hidden md:block absolute top-10 left-[22%] right-[22%] border-t border-dashed border-[var(--color-border)]" />
            {HOW_STEPS.map(({ n, icon, title, body }) => (
              <div key={n} className="flex flex-col items-center gap-3 relative z-10">
                <div className="text-[18px] font-bold text-[var(--color-amber)] font-heading">{n}</div>
                <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--color-amber-light)] flex items-center justify-center">{icon}</div>
                <div className="text-[16px] font-semibold text-[var(--color-dark)]">{title}</div>
                <p className="text-[13px] text-[var(--color-gray)] max-w-[200px]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative py-14 overflow-hidden" style={{ background: 'var(--gradient-gold)' }}>
        <Ring size={500} stroke={1} className="text-white opacity-[0.07] -top-40 -left-40" />
        <Ring size={280} stroke={1} className="text-white opacity-[0.07] -top-10 -left-10" />
        <Ring size={400} stroke={1} className="text-white opacity-[0.07] -bottom-32 -right-32" />
        <DotGrid cols={10} rows={4} gap={24} className="text-white opacity-[0.08] top-6 right-12 hidden md:block" />
        <Sparkle size={32} className="text-white opacity-[0.15] top-8 left-1/4 hidden md:block" />
        <Sparkle size={20} className="text-white opacity-[0.12] bottom-8 right-1/4 hidden md:block" />
        <Diamond size={40} className="text-white opacity-[0.1] top-1/2 left-1/2 hidden md:block" />
        <FloatingIcon icon={<IconHeart size={40} stroke={1} color="white" />} className="opacity-[0.12] top-4 left-8 hidden md:block" />
        <FloatingIcon icon={<IconPlane size={36} stroke={1} color="white" />} className="opacity-[0.10] bottom-4 right-10 hidden md:block rotate-[-10deg]" />
        <FloatingIcon icon={<IconMusic size={28} stroke={1} color="white" />} className="opacity-[0.10] top-6 right-[20%] hidden md:block" />
        <FloatingIcon icon={<IconBalloon size={30} stroke={1} color="white" />} className="opacity-[0.10] bottom-4 left-[35%] hidden md:block" />

        <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div className="text-[40px] font-bold font-heading">{value}</div>
                <div className="text-[12px] opacity-80 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section className="relative max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20 py-14 overflow-hidden">
        <DotGrid cols={4} rows={6} gap={20} className="text-[var(--color-amber)] opacity-[0.08] -top-4 right-0 hidden md:block" />
        <Sparkle size={18} className="text-[var(--color-amber)] opacity-20 top-8 left-1/2 hidden md:block" />

        <div className="relative z-10">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-amber)] mb-2">Real people</div>
          <h2 className="text-[28px] font-semibold text-[var(--color-dark)] mb-10">
            Real People. Real Experiences.<br /><span className="text-gradient-primary">Real Connections.</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, loc, exp }) => (
              <div key={name} className="flex flex-col gap-4 bg-white rounded-[16px] border border-[var(--color-border)] p-5">
                <IconQuote size={28} stroke={0} fill="var(--color-amber-light)" color="var(--color-amber-light)" />
                <p className="text-[13px] text-[var(--color-gray)] leading-[1.75]">"{quote}"</p>
                <div className="flex items-center gap-2.5 mt-auto pt-3 border-t border-[var(--color-border)]">
                  <img src={`https://i.pravatar.cc/32?u=${name}`} alt={name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <div className="text-[12px] font-semibold text-[var(--color-dark)]">{name}</div>
                    <div className="text-[10px] text-[var(--color-gray)]">{loc} · {exp}</div>
                  </div>
                  <div className="ml-auto flex">
                    {[1,2,3,4,5].map(i => <IconStar key={i} size={10} stroke={0} fill="var(--color-amber)" color="var(--color-amber)" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ───────────────────────────────────────────────── */}
      <section className="relative border-t-[0.5px] border-[var(--color-border)] bg-[var(--color-bg)] py-20 text-center overflow-hidden">
        {/* Concentric rings radiating from center */}
        <Ring size={600} stroke={0.8} className="text-[var(--color-amber)] opacity-[0.06] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <Ring size={440} stroke={0.8} className="text-[var(--color-amber)] opacity-[0.07] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <Ring size={290} stroke={1}   className="text-[var(--color-amber)] opacity-[0.09] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <Ring size={160} stroke={1}   className="text-[var(--color-amber)] opacity-[0.10] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        {/* Corner decorations */}
        <Sparkle size={32} className="text-[var(--color-amber)] opacity-20 top-10 left-16 hidden md:block" />
        <Sparkle size={20} className="text-[var(--color-amber)] opacity-14 top-16 left-32 hidden md:block" />
        <Sparkle size={32} className="text-[var(--color-amber)] opacity-20 top-10 right-16 hidden md:block" />
        <Sparkle size={20} className="text-[var(--color-amber)] opacity-14 top-16 right-32 hidden md:block" />
        <Diamond size={36} className="text-[var(--color-amber)] opacity-12 bottom-12 left-24 hidden md:block" />
        <Diamond size={28} className="text-[var(--color-amber)] opacity-10 bottom-8 right-28 hidden md:block" />
        <DotGrid cols={4} rows={3} gap={16} className="text-[var(--color-amber)] opacity-[0.1] bottom-8 left-8 hidden md:block" />
        <DotGrid cols={4} rows={3} gap={16} className="text-[var(--color-amber)] opacity-[0.1] bottom-8 right-8 hidden md:block" />
        <FloatingIcon icon={<IconHeart size={52} stroke={1} color="var(--color-amber)" />} className="opacity-[0.09] top-8 left-8 hidden md:block" />
        <FloatingIcon icon={<IconHeart size={28} stroke={1} color="var(--color-amber)" />} className="opacity-[0.07] top-20 left-28 hidden md:block" />
        <FloatingIcon icon={<IconHeart size={36} stroke={1} color="var(--color-amber)" />} className="opacity-[0.09] top-8 right-10 hidden md:block" />
        <FloatingIcon icon={<IconHeart size={20} stroke={1} color="var(--color-amber)" />} className="opacity-[0.07] top-24 right-32 hidden md:block" />
        <FloatingIcon icon={<IconPlane size={38} stroke={1} color="var(--color-amber)" />} className="opacity-[0.08] bottom-16 left-20 hidden md:block rotate-[10deg]" />
        <FloatingIcon icon={<IconBriefcase size={34} stroke={1} color="var(--color-amber)" />} className="opacity-[0.08] bottom-16 right-20 hidden md:block" />
        <FloatingIcon icon={<IconCoffee size={26} stroke={1} color="var(--color-amber)" />} className="opacity-[0.08] bottom-8 left-[40%] hidden md:block" />
        <FloatingIcon icon={<IconBalloon size={30} stroke={1} color="var(--color-amber)" />} className="opacity-[0.08] top-12 left-[45%] hidden md:block" />

        <div className="relative z-10 max-w-[560px] mx-auto px-6">
          <div className="w-14 h-14 rounded-full bg-[var(--color-amber)] flex items-center justify-center mx-auto mb-5 shadow-[0_4px_20px_rgba(201,146,10,0.4)]">
            <IconHeart size={24} stroke={1.5} color="white" />
          </div>
          <h2 className="text-[28px] md:text-[32px] font-semibold text-[var(--color-dark)] mb-3">
            Life Is Better <span className="text-gradient-primary">Shared</span>
          </h2>
          <p className="text-[14px] text-[var(--color-gray)] mb-8 leading-relaxed">
            Join a modern community built around experiences,<br className="hidden md:block" /> connection, and meaningful companionship.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/register')}>Get Started — it's free</Button>
            <Button size="lg" variant="ghost" onClick={() => navigate('/how-it-works')}>Learn how it works</Button>
          </div>
          <p className="text-[12px] text-[var(--color-amber)] mt-5 cursor-pointer" onClick={() => navigate('/login')}>
            Already have an account? <span className="underline font-medium">Log in</span>
          </p>
        </div>
      </section>

      {/* ── Footer nav ── */}
      <footer className="border-t-[0.5px] border-[var(--color-border)] bg-white py-10">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-[6px] bg-[var(--color-amber)] flex items-center justify-center">
                  <IconHeart size={12} stroke={1.5} color="white" />
                </div>
                <span className="text-[14px] font-semibold text-[var(--color-dark)]">Meytle</span>
              </div>
              <p className="text-[11px] text-[var(--color-gray)] leading-relaxed">Meaningful companionship for every experience.</p>
            </div>
            {[
              { title: 'Company',  links: ['About Us', 'Careers', 'Press'] },
              { title: 'Safety',   links: ['Safety Center', 'Verification', 'Privacy', 'Guidelines'] },
              { title: 'Support',  links: ['Help Center', 'Contact Us', 'Trust & Safety', 'Community'] },
              { title: 'Legal',    links: ['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Refund Policy'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div className="text-[11px] font-semibold text-[var(--color-dark)] uppercase tracking-[0.06em] mb-3">{title}</div>
                <div className="flex flex-col gap-2">
                  {links.map((l) => <a key={l} href="#" className="text-[12px] text-[var(--color-gray)] hover:text-[var(--color-dark)] transition-colors">{l}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-[11px] text-[var(--color-gray)] text-center">
            © 2026 Meytle. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
