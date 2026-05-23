import { useState } from 'react'
import { IconSearch, IconMail } from '@tabler/icons-react'
import {
  Button, Input, Chip, Badge, Avatar, ProgressBar,
  CompanionCard, ExperienceCard, TopBar, BottomNav,
  Modal, ToastDemo, Dropdown, TimePicker, DEFAULT_TIME_SLOTS,
  ScheduleGrid, createEmptySchedule, MapView,
} from '../components/ui'
import type { ScheduleValue } from '../components/ui/ScheduleGrid'
import { MOCK_COMPANIONS, MOCK_EXPERIENCES, FILTER_CHIPS } from '../data/mock'
import type { ExperienceType, NavTab } from '../types'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <div className="text-[10px] font-semibold text-[var(--color-amber)] uppercase tracking-[0.08em] mb-1">Component</div>
      <h2 className="text-[22px] font-semibold text-[var(--color-dark)] mb-6 pb-3 border-b border-[var(--color-border)]">{title}</h2>
      {children}
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-medium text-[var(--color-gray)] uppercase tracking-[0.06em] mb-3">{children}</p>
}

const EXPERIENCE_OPTIONS = [
  { value: 'coffee',  label: 'Coffee Dates',   description: '₹800/hr' },
  { value: 'dining',  label: 'Fine Dining',    description: '₹1,200/hr' },
  { value: 'concert', label: 'Concerts',       description: '₹1,100/hr' },
  { value: 'travel',  label: 'Travel',         description: '₹1,500/hr' },
  { value: 'fitness', label: 'Fitness',        description: '₹950/hr' },
  { value: 'culture', label: 'Cultural Events', description: '₹1,000/hr' },
]

const CITY_OPTIONS = [
  { value: 'mumbai',    label: 'Mumbai' },
  { value: 'delhi',     label: 'Delhi' },
  { value: 'bangalore', label: 'Bangalore' },
  { value: 'pune',      label: 'Pune' },
  { value: 'hyderabad', label: 'Hyderabad' },
]

export default function UIShowcase() {
  const [activeChips, setActiveChips]   = useState<Set<string>>(new Set(['all']))
  const [activeTab, setActiveTab]       = useState<NavTab>('home')
  const [progressStep, setProgressStep] = useState(2)
  const [modalOpen, setModalOpen]       = useState(false)
  const [confirmOpen, setConfirmOpen]   = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | undefined>()
  const [dropdownExp, setDropdownExp]   = useState<string>()
  const [dropdownCity, setDropdownCity] = useState<string>()
  const [schedule, setSchedule]         = useState<ScheduleValue>(createEmptySchedule)

  function toggleChip(type: string) {
    setActiveChips((prev) => {
      if (type === 'all') return new Set(['all'])
      const next = new Set(prev)
      next.delete('all')
      next.has(type) ? next.delete(type) : next.add(type)
      if (next.size === 0) next.add('all')
      return next
    })
  }

  return (
    <div className="bg-[var(--color-bg)] min-h-screen pb-24">

      {/* Page header */}
      <div className="bg-white border-b border-[var(--color-border)] px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-amber)] mb-2">Meytle Design System v1.0</div>
          <h1 className="text-[36px] font-semibold text-[var(--color-dark)]">UI Component Showcase</h1>
          <p className="text-[14px] text-[var(--color-gray)] mt-2 max-w-lg">Every reusable component. All states. All variants.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-12">

        {/* ── Buttons ── */}
        <Section title="Buttons">
          <div className="flex flex-col gap-8">
            <div>
              <Label>Variants</Label>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary">Explore Companions</Button>
                <Button variant="outline">Become a Companion</Button>
                <Button variant="ghost">Log In</Button>
              </div>
            </div>
            <div>
              <Label>Sizes</Label>
              <div className="flex flex-wrap gap-3 items-center">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div>
              <Label>With icons + states</Label>
              <div className="flex flex-wrap gap-3 items-center">
                <Button icon={<IconSearch size={14} stroke={1.5} />}>Search</Button>
                <Button variant="outline" icon={<IconMail size={14} stroke={1.5} />} iconPosition="right">Get invite</Button>
                <Button disabled>Disabled</Button>
                <Button fullWidth>Full width</Button>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Inputs ── */}
        <Section title="Inputs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl">
            <Input label="Email address" placeholder="you@example.com" type="email" />
            <Input label="Search" placeholder="City, neighbourhood…" icon={<IconSearch size={14} stroke={1.5} />} />
            <Input label="Error state" placeholder="you@example.com" error="Please enter a valid email" />
            <Input label="Disabled" placeholder="Not editable" disabled />
            <Input label="With hint" placeholder="₹800" hint="Set a competitive rate to get more bookings" />
          </div>
        </Section>

        {/* ── Dropdowns ── */}
        <Section title="Dropdowns">
          <div className="flex flex-col gap-4 max-w-xs">
            <Dropdown
              label="Experience type"
              options={EXPERIENCE_OPTIONS}
              value={dropdownExp}
              onChange={setDropdownExp}
              placeholder="Select an experience…"
            />
            <Dropdown
              label="City"
              options={CITY_OPTIONS}
              value={dropdownCity}
              onChange={setDropdownCity}
              placeholder="Select your city…"
            />
            <Dropdown
              label="Disabled dropdown"
              options={CITY_OPTIONS}
              value={undefined}
              onChange={() => {}}
              placeholder="Not available"
              disabled
            />
          </div>
        </Section>

        {/* ── Chips ── */}
        <Section title="Filter Chips">
          <div className="flex flex-wrap gap-2 mb-3">
            {FILTER_CHIPS.map(({ type, label }) => (
              <Chip key={type} label={label} active={activeChips.has(type)} onClick={() => toggleChip(type)} />
            ))}
          </div>
          <p className="text-[11px] text-[var(--color-gray)]">Active: {[...activeChips].join(', ')}</p>
        </Section>

        {/* ── Badges ── */}
        <Section title="Badges">
          <div className="flex flex-wrap gap-3 items-center">
            <Badge variant="available" />
            <Badge variant="verified" />
            <Badge variant="pending" />
            <Badge variant="away" />
          </div>
        </Section>

        {/* ── Avatars ── */}
        <Section title="Avatars">
          <div className="flex flex-wrap gap-5 items-end">
            {(['sm','md','lg','xl'] as const).map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <Avatar initials="AK" size={size} />
                <span className="text-[10px] text-[var(--color-gray)]">{size}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2">
              <Avatar initials="JD" size="xl"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
                alt="Jane Doe" />
              <span className="text-[10px] text-[var(--color-gray)]">photo</span>
            </div>
          </div>
        </Section>

        {/* ── Progress bar ── */}
        <Section title="Onboarding Progress Bar">
          <div className="max-w-sm">
            <ProgressBar total={6} current={progressStep} className="mb-4" />
            <p className="text-[12px] text-[var(--color-gray)] mb-4">Step {progressStep} of 6</p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setProgressStep((s) => Math.max(1, s - 1))}>Back</Button>
              <Button size="sm" onClick={() => setProgressStep((s) => Math.min(6, s + 1))}>Next step</Button>
            </div>
          </div>
        </Section>

        {/* ── Modals ── */}
        <Section title="Modals / Popups">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setModalOpen(true)}>Open booking modal</Button>
            <Button variant="outline" onClick={() => setConfirmOpen(true)}>Open confirm dialog</Button>
          </div>

          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Book Aanya for Coffee Dates"
            footer={
              <>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setModalOpen(false)}>Confirm Booking</Button>
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 bg-[var(--color-bg)] rounded-[var(--radius-lg)]">
                <Avatar initials="A" size="md"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" />
                <div>
                  <div className="text-[13px] font-medium text-[var(--color-dark)]">Aanya, 26 · Bandra West</div>
                  <div className="text-[12px] text-[var(--color-gray)]">Coffee Dates · ₹800/hr</div>
                </div>
              </div>
              <Input label="Date" type="date" />
              <Dropdown label="Duration" options={[
                { value: '1', label: '1 hour — ₹800' },
                { value: '2', label: '2 hours — ₹1,600' },
                { value: '3', label: '3 hours — ₹2,400' },
              ]} value="1" onChange={() => {}} />
              <p className="text-[11px] text-[var(--color-gray)]">
                Your companion will confirm within 1 hour. Payment is only charged after confirmation.
              </p>
            </div>
          </Modal>

          <Modal
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title="Cancel this booking?"
            size="sm"
            footer={
              <>
                <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Keep booking</Button>
                <Button variant="outline" onClick={() => setConfirmOpen(false)} className="!border-[var(--color-error)] !text-[var(--color-error)]">
                  Yes, cancel
                </Button>
              </>
            }
          >
            <p className="text-[13px] text-[var(--color-gray)] leading-relaxed">
              Cancellations less than 24 hours before the experience are non-refundable. Are you sure?
            </p>
          </Modal>
        </Section>

        {/* ── Toasts ── */}
        <Section title="Toast Notifications">
          <ToastDemo />
        </Section>

        {/* ── Time Picker ── */}
        <Section title="Time Picker">
          <div className="max-w-md">
            <TimePicker
              date="Tuesday, May 20, 2026"
              slots={DEFAULT_TIME_SLOTS}
              selected={selectedTime}
              onChange={setSelectedTime}
            />
          </div>
        </Section>

        {/* ── Schedule Grid ── */}
        <Section title="Availability Schedule">
          <ScheduleGrid value={schedule} onChange={setSchedule} />
          {Object.keys(schedule).length > 0 && (
            <div className="mt-3 text-[11px] text-[var(--color-gray)]">
              Active days: {Object.keys(schedule).join(', ')}
            </div>
          )}
        </Section>

        {/* ── Map — Browse ── */}
        <Section title="Map View — Browse Companions">
          <MapView height={380} />
          <p className="text-[11px] text-[var(--color-gray)] mt-2">Click a price pin to see the companion bottom sheet.</p>
        </Section>

        {/* ── Map — Draw mode ── */}
        <Section title="Map View — Draw Service Areas (Companion Onboarding)">
          <MapView height={340} drawMode />
          <p className="text-[11px] text-[var(--color-gray)] mt-2">Click anywhere on the map to place a service area circle.</p>
        </Section>

        {/* ── Companion Cards ── */}
        <Section title="Companion Cards">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MOCK_COMPANIONS.map((c) => <CompanionCard key={c.id} companion={c} />)}
          </div>
        </Section>

        {/* ── Experience Cards ── */}
        <Section title="Experience Category Cards">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {MOCK_EXPERIENCES.map(({ type, label }) => (
              <ExperienceCard key={type} type={type as ExperienceType} label={label} />
            ))}
          </div>
        </Section>

        {/* ── Top Bar ── */}
        <Section title="Top Bar — Mobile">
          <div className="max-w-sm border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
            <TopBar location="Bandra West" hasNotification />
          </div>
        </Section>

        {/* ── Bottom Nav ── */}
        <Section title="Bottom Navigation — Mobile">
          <div className="max-w-sm border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
            <BottomNav active={activeTab} onChange={setActiveTab} />
          </div>
          <p className="text-[11px] text-[var(--color-gray)] mt-2">Active: <strong>{activeTab}</strong></p>
        </Section>

        {/* ── Color Tokens ── */}
        <Section title="Color Tokens">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: '--color-amber',       hex: '#BA7517' },
              { name: '--color-amber-light', hex: '#FAEEDA' },
              { name: '--color-amber-dark',  hex: '#633806' },
              { name: '--color-dark',        hex: '#1A1A1A' },
              { name: '--color-gray',        hex: '#666666' },
              { name: '--color-gray-light',  hex: '#F5F2EC' },
              { name: '--color-border',      hex: '#E8E4DC' },
              { name: '--color-bg',          hex: '#FAF9F7' },
              { name: '--color-success',     hex: '#0F6E56' },
              { name: '--color-success-bg',  hex: '#E1F5EE' },
              { name: '--color-error',       hex: '#A32D2D' },
              { name: '--color-error-bg',    hex: '#FCEBEB' },
            ].map(({ name, hex }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <div className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)]" style={{ background: hex }} />
                <div className="text-[10px] text-[var(--color-gray)] leading-tight">{name}</div>
                <div className="text-[10px] font-medium text-[var(--color-dark)]">{hex}</div>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  )
}
