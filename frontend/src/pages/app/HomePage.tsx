import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconSearch, IconBell, IconMapPin, IconStar, IconChevronRight, IconAdjustmentsHorizontal,
} from '@tabler/icons-react'
import { Avatar, Badge, Chip, CompanionCard } from '../../components/ui'
import { MOCK_COMPANIONS, FILTER_CHIPS } from '../../data/mock'
import type { Companion } from '../../types'

const GREETING = (() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})()

export default function HomePage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered: Companion[] = MOCK_COMPANIONS.filter(c => {
    if (activeFilter !== 'all' && !c.services.some(s => s.type === activeFilter)) return false
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-full bg-[var(--color-bg)]">

      {/* ── Mobile-only top bar (desktop has the AppLayout header) ─── */}
      <div className="md:hidden bg-white border-b border-[var(--color-border)] px-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar initials="Y" size="md" />
            <div>
              <p className="text-[12px] text-[var(--color-gray)]">{GREETING}</p>
              <p className="text-[15px] font-semibold text-[var(--color-dark)]">Hey, You!</p>
            </div>
          </div>
          <button className="w-9 h-9 rounded-full bg-[var(--color-gray-light)] flex items-center justify-center relative">
            <IconBell size={18} stroke={1.5} className="text-[var(--color-dark)]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-amber)]" />
          </button>
        </div>
        <div className="relative">
          <IconSearch size={16} stroke={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray)]" />
          <input
            type="text"
            placeholder="Search companions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-[10px] bg-[var(--color-gray-light)] border border-[var(--color-border)] text-[13px] text-[var(--color-dark)] placeholder:text-[var(--color-gray)] focus:outline-none focus:border-[var(--color-amber)] transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 mt-2">
          <IconMapPin size={13} stroke={1.5} className="text-[var(--color-amber)]" />
          <span className="text-[12px] text-[var(--color-gray)]">Mumbai, Maharashtra</span>
          <button className="text-[12px] text-[var(--color-amber)] ml-1 hover:underline">Change</button>
        </div>
      </div>

      {/* ── Desktop hero bar ─────────────────────────────────────────── */}
      <div className="hidden md:block bg-white border-b border-[var(--color-border)]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] text-[var(--color-gray)]">{GREETING} — here's what's near you</p>
              <h1 className="text-[22px] font-bold mt-0.5">
              Find a companion in <span className="text-gradient-gold">Mumbai</span>
            </h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <IconSearch size={15} stroke={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray)]" />
                <input
                  type="text"
                  placeholder="Search companions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-[260px] h-10 pl-9 pr-4 rounded-[10px] bg-[var(--color-gray-light)] border border-[var(--color-border)] text-[13px] text-[var(--color-dark)] placeholder:text-[var(--color-gray)] focus:outline-none focus:border-[var(--color-amber)] transition-colors"
                />
              </div>
              <button className="flex items-center gap-2 h-10 px-3 rounded-[10px] border border-[var(--color-border)] bg-white text-[13px] text-[var(--color-gray)] hover:border-[var(--color-amber)] hover:text-[var(--color-dark)] transition-colors">
                <IconAdjustmentsHorizontal size={15} stroke={1.5} />
                Filters
              </button>
              <div className="flex items-center gap-1.5 h-10 px-3 rounded-[10px] border border-[var(--color-border)] bg-white cursor-pointer hover:border-[var(--color-amber)] transition-colors">
                <IconMapPin size={14} stroke={1.5} className="text-[var(--color-amber)]" />
                <span className="text-[13px] text-[var(--color-gray)]">Mumbai</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter chips ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-none">
            {FILTER_CHIPS.map(chip => (
              <Chip
                key={chip.type}
                label={chip.label}
                active={activeFilter === chip.type}
                onClick={() => setActiveFilter(chip.type)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 py-5">

        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-[var(--color-dark)]">
              {activeFilter === 'all' ? 'Companions Near You' : FILTER_CHIPS.find(c => c.type === activeFilter)?.label}
            </h2>
            <Badge variant="success" label={`${filtered.filter(c => c.isAvailableNow).length} online`} />
          </div>
          <button
            onClick={() => navigate('/app/map')}
            className="flex items-center gap-1 text-[12px] text-[var(--color-amber)] hover:underline"
          >
            View on map <IconChevronRight size={12} stroke={2} />
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[14px] text-[var(--color-gray)]">No companions found</p>
            <button
              onClick={() => { setActiveFilter('all'); setSearchQuery('') }}
              className="mt-2 text-[13px] text-[var(--color-amber)] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map(companion => (
              <CompanionCard
                key={companion.id}
                companion={companion}
                onClick={() => navigate(`/companions/${companion.id}`)}
              />
            ))}
          </div>
        )}

        {/* ── Bottom strips ─────────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Become a companion CTA */}
          <div
            onClick={() => navigate('/app/companion/onboarding')}
            className="md:col-span-2 rounded-[16px] p-5 cursor-pointer hover:opacity-95 transition-opacity"
            style={{ background: 'var(--gradient-gold)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-bold text-white mb-1">Want to become a companion?</p>
                <p className="text-[12px] text-white/80 leading-relaxed max-w-[320px]">
                  Earn on your own schedule. Set your services, hours, and service area.
                </p>
              </div>
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-4 py-2 flex-none">
                <span className="text-[13px] text-white font-semibold">Get started</span>
                <IconChevronRight size={14} stroke={2} color="white" />
              </div>
            </div>
          </div>

          {/* Top rated */}
          <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-4">
            <p className="text-[13px] font-semibold text-[var(--color-dark)] mb-3">Top Rated</p>
            <div className="flex flex-col gap-3">
              {MOCK_COMPANIONS.filter(c => c.rating >= 4.8).slice(0, 4).map(c => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/companions/${c.id}`)}
                  className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                >
                  <Avatar src={c.avatarUrl ?? undefined} initials={c.initials} size="sm" online={c.isAvailableNow} />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[12px] font-medium text-[var(--color-dark)] truncate">{c.name}, {c.age}</p>
                    <p className="text-[11px] text-[var(--color-gray)] truncate">{c.neighbourhood}</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <IconStar size={10} stroke={1.5} className="text-[var(--color-amber)]" />
                    <span className="text-[11px] text-[var(--color-gray)]">{c.rating}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
