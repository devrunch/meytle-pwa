import { useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  IconArrowLeft, IconCheck, IconCalendar, IconClock, IconCreditCard,
  IconShieldCheck, IconChevronLeft, IconChevronRight, IconMessageCircle,
  IconAlertCircle, IconMapPin, IconX, IconStar, IconUsers,
} from '@tabler/icons-react'
import { Avatar } from '../../components/ui'
import LocationPickerMap from '../../components/ui/LocationPickerMap'
import { MOCK_COMPANIONS } from '../../data/mock'
import type { Service } from '../../types'

interface LngLat { lng: number; lat: number }

const TOTAL_STEPS = 4
const CALENDAR_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DURATION_OPTIONS = [1, 2, 3, 4]
const JS_DAY_TO_KEY = ['sun','mon','tue','wed','thu','fri','sat'] as const

const MOCK_SCHEDULE = {
  days: new Set(['mon','tue','wed','thu','fri','sat'] as const),
  from: '8:00 AM',
  to:   '9:00 PM',
}

function parseHour(timeStr: string): number {
  const [timePart, period] = timeStr.split(' ')
  let [h] = timePart.split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return h
}

function generateSlots(from: string, to: string): string[] {
  const start = parseHour(from)
  const end = parseHour(to)
  const slots: string[] = []
  for (let h = start; h < end; h++) {
    const period = h < 12 ? 'AM' : 'PM'
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h
    slots.push(`${display}:00 ${period}`)
  }
  return slots
}

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate() }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay() }

// ─── Calendar ────────────────────────────────────────────────────────────────

function MiniCalendar({
  selected, onChange, schedule,
}: {
  selected: Date | null
  onChange: (d: Date, available: boolean) => void
  schedule: typeof MOCK_SCHEDULE
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const cells: (number | null)[] = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  function prev() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function next() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }
  function isAvailable(day: number) {
    const date = new Date(viewYear, viewMonth, day)
    return schedule.days.has(JS_DAY_TO_KEY[date.getDay()] as never)
  }

  return (
    <div className="bg-white rounded-[16px] border border-[var(--color-border)] overflow-hidden">
      {/* Month nav */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
        <button
          onClick={prev}
          className="w-8 h-8 rounded-[8px] hover:bg-[var(--color-gray-light)] flex items-center justify-center transition-colors"
        >
          <IconChevronLeft size={16} stroke={2} className="text-[var(--color-dark)]" />
        </button>
        <p className="text-[15px] font-bold text-[var(--color-dark)]">
          {MONTHS[viewMonth]} {viewYear}
        </p>
        <button
          onClick={next}
          className="w-8 h-8 rounded-[8px] hover:bg-[var(--color-gray-light)] flex items-center justify-center transition-colors"
        >
          <IconChevronRight size={16} stroke={2} className="text-[var(--color-dark)]" />
        </button>
      </div>

      <div className="px-4 py-3">
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[4px] bg-[var(--color-amber-light)] border border-[var(--color-amber)]/30 inline-block" />
            <span className="text-[11px] text-[var(--color-gray)]">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[4px] bg-[var(--color-gray-light)] inline-block" />
            <span className="text-[11px] text-[var(--color-gray)]">Custom request</span>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {CALENDAR_DAYS.map(d => (
            <div key={d} className="text-center text-[11px] font-semibold text-[var(--color-gray)] py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const date = new Date(viewYear, viewMonth, day)
            const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const available = !isPast && isAvailable(day)
            const customable = !isPast && !available
            const isSelected = selected &&
              selected.getFullYear() === viewYear &&
              selected.getMonth() === viewMonth &&
              selected.getDate() === day
            const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day

            let cellClass = 'relative h-10 w-full rounded-[8px] text-[13px] font-medium transition-all flex items-center justify-center '

            if (isSelected) {
              cellClass += 'bg-[var(--color-amber)] text-white font-bold shadow-[0_2px_8px_rgba(232,160,0,0.4)]'
            } else if (isPast) {
              cellClass += 'text-[var(--color-border)] cursor-not-allowed'
            } else if (available) {
              cellClass += isToday
                ? 'bg-[var(--color-amber-light)] text-[var(--color-amber-dark)] ring-2 ring-[var(--color-amber)] font-bold'
                : 'bg-[var(--color-amber-light)] text-[var(--color-amber-dark)] hover:bg-[#FFE066] hover:shadow-sm cursor-pointer'
            } else if (customable) {
              cellClass += 'bg-[var(--color-gray-light)] text-[var(--color-gray)] hover:bg-[#E8E4DC] cursor-pointer'
            }

            return (
              <button
                key={i}
                disabled={isPast}
                onClick={() => onChange(date, available)}
                className={cellClass}
              >
                {day}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-amber)]" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Custom booking panel ─────────────────────────────────────────────────────

const CUSTOM_TIME_OPTIONS = [
  '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
  '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM',
]
interface CustomRequest { from: string; to: string; note: string; tip: number; tipCustom: string }
const TIP_PRESETS = [100, 200, 500]

function CustomBookingPanel({ value, onChange }: { value: CustomRequest; onChange: (v: CustomRequest) => void }) {
  const [showCustomInput, setShowCustomInput] = useState(false)

  function selectPreset(amount: number) {
    setShowCustomInput(false)
    onChange({ ...value, tip: amount, tipCustom: '' })
  }
  function openCustom() {
    setShowCustomInput(true)
    onChange({ ...value, tip: 0, tipCustom: '' })
  }
  function handleCustomTipChange(raw: string) {
    const num = parseInt(raw.replace(/\D/g, ''), 10)
    onChange({ ...value, tipCustom: raw, tip: isNaN(num) ? 0 : num })
  }

  return (
    <div className="bg-white rounded-[16px] border border-[var(--color-amber)]/40 p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3 bg-[var(--color-amber-light)] rounded-[10px] p-3">
        <IconAlertCircle size={16} stroke={1.5} className="text-[var(--color-amber)] flex-none mt-0.5" />
        <p className="text-[12px] text-[var(--color-amber-dark)] leading-relaxed">
          This date isn't in the companion's regular schedule. A tip is required to send a custom request — they'll confirm if available.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Start time', key: 'from' as const },
          { label: 'End time',   key: 'to'   as const },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="text-[11px] font-semibold text-[var(--color-gray)] block mb-1.5 uppercase tracking-wide">{label}</label>
            <select
              value={value[key]}
              onChange={e => onChange({ ...value, [key]: e.target.value })}
              className="w-full h-10 px-3 rounded-[10px] border border-[var(--color-border)] bg-white text-[13px] font-medium text-[var(--color-dark)] focus:outline-none focus:border-[var(--color-amber)] appearance-none"
            >
              {CUSTOM_TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-semibold text-[var(--color-gray)] uppercase tracking-wide">
            Tip for companion <span className="text-[var(--color-error)]">*</span>
          </label>
          {value.tip > 0 && (
            <span className="text-[12px] font-bold text-[var(--color-amber)]">₹{value.tip.toLocaleString()} added</span>
          )}
        </div>
        <div className="flex gap-2 mb-2">
          {TIP_PRESETS.map(amt => (
            <button key={amt} type="button" onClick={() => selectPreset(amt)}
              className={`flex-1 h-10 rounded-[10px] border text-[13px] font-semibold transition-colors ${
                !showCustomInput && value.tip === amt
                  ? 'border-[var(--color-amber)] bg-[var(--color-amber-light)] text-[var(--color-amber-dark)]'
                  : 'border-[var(--color-border)] text-[var(--color-gray)] hover:border-[var(--color-amber)]'
              }`}
            >₹{amt}</button>
          ))}
          <button type="button" onClick={openCustom}
            className={`flex-1 h-10 rounded-[10px] border text-[13px] font-semibold transition-colors ${
              showCustomInput
                ? 'border-[var(--color-amber)] bg-[var(--color-amber-light)] text-[var(--color-amber-dark)]'
                : 'border-[var(--color-border)] text-[var(--color-gray)] hover:border-[var(--color-amber)]'
            }`}
          >Custom</button>
        </div>
        {showCustomInput && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--color-gray)]">₹</span>
            <input autoFocus type="text" inputMode="numeric" value={value.tipCustom}
              onChange={e => handleCustomTipChange(e.target.value)}
              placeholder="Enter amount"
              className="w-full h-10 pl-7 pr-3 rounded-[10px] border border-[var(--color-amber)] bg-white text-[13px] font-medium text-[var(--color-dark)] placeholder:text-[var(--color-gray)] focus:outline-none"
            />
          </div>
        )}
        <p className="text-[11px] text-[var(--color-gray)] mt-1.5">Tip goes directly to the companion for accommodating your request.</p>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-[var(--color-gray)] block mb-1.5 uppercase tracking-wide">Note for companion</label>
        <textarea value={value.note} onChange={e => onChange({ ...value, note: e.target.value })}
          placeholder="e.g. I'm free after 8 PM on this date..." rows={3}
          className="w-full px-3 py-2.5 rounded-[10px] border border-[var(--color-border)] text-[13px] text-[var(--color-dark)] placeholder:text-[var(--color-gray)] focus:outline-none focus:border-[var(--color-amber)] resize-none"
        />
      </div>
    </div>
  )
}

// ─── Companion sidebar (desktop) ──────────────────────────────────────────────

function CompanionSidebar({
  companion, step, selectedService, selectedDate, selectedTime, duration, location, total,
}: {
  companion: (typeof MOCK_COMPANIONS)[0]
  step: number
  selectedService: Service | null
  selectedDate: Date | null
  selectedTime: string | null
  duration: number
  location: string
  total: number
}) {
  const steps = ['Choose Service', 'Date & Time', 'Meeting Spot', 'Confirm & Pay']
  return (
    <div className="flex flex-col gap-4 sticky top-6">
      {/* Companion card */}
      <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--color-border)]">
          <Avatar src={companion.avatarUrl ?? undefined} initials={companion.initials} size="xl" />
          <div>
            <p className="text-[16px] font-bold text-[var(--color-dark)]">{companion.name}</p>
            <p className="text-[12px] text-[var(--color-gray)]">{companion.neighbourhood}, {companion.city}</p>
            <div className="flex items-center gap-1 mt-1">
              <IconStar size={11} stroke={1.5} className="text-[var(--color-amber)] fill-[var(--color-amber)]" />
              <span className="text-[12px] font-semibold text-[var(--color-dark)]">{companion.rating}</span>
              <span className="text-[11px] text-[var(--color-gray)] ml-0.5">({companion.reviewCount})</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {selectedService && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[var(--color-gray)]">Service</span>
              <span className="font-semibold text-[var(--color-dark)]">{selectedService.label}</span>
            </div>
          )}
          {selectedDate && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[var(--color-gray)]">Date</span>
              <span className="font-semibold text-[var(--color-dark)]">
                {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}
          {selectedTime && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[var(--color-gray)]">Time</span>
              <span className="font-semibold text-[var(--color-dark)]">{selectedTime} · {duration}h</span>
            </div>
          )}
          {location && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[var(--color-gray)]">Meet at</span>
              <span className="font-semibold text-[var(--color-dark)] text-right max-w-[140px] truncate">{location}</span>
            </div>
          )}
          {step >= 2 && selectedTime && (
            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
              <span className="text-[13px] text-[var(--color-gray)]">Rate</span>
              <span className="text-[13px] font-semibold text-[var(--color-dark)]">₹{companion.priceFrom.toLocaleString()}/hr</span>
            </div>
          )}
          {step >= 2 && selectedTime && (
            <div className="flex items-center justify-between bg-[var(--color-amber-light)] rounded-[10px] px-3 py-2">
              <span className="text-[13px] font-bold text-[var(--color-amber-dark)]">Est. Total</span>
              <span className="text-[15px] font-bold text-[var(--color-amber-dark)]">₹{Math.round(total * 1.05).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Step list */}
      <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-4">
        {steps.map((label, i) => {
          const s = i + 1
          const done = step > s
          const active = step === s
          return (
            <div key={s} className="flex items-center gap-3 py-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold transition-colors ${
                done ? 'bg-[var(--color-success)] text-white' :
                active ? 'bg-[var(--color-amber)] text-white' :
                'bg-[var(--color-gray-light)] text-[var(--color-gray)]'
              }`}>
                {done ? <IconCheck size={12} stroke={2.5} /> : s}
              </div>
              <span className={`text-[13px] ${active ? 'font-bold text-[var(--color-dark)]' : done ? 'text-[var(--color-gray)] line-through' : 'text-[var(--color-gray)]'}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingFlow() {
  const { companionId } = useParams<{ companionId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const companion = MOCK_COMPANIONS.find(c => c.id === companionId)

  const preselectedService = useMemo(() => {
    const param = searchParams.get('service')
    return companion?.services.find(s => s.type === param) ?? null
  }, [])

  const [step, setStep] = useState(() => preselectedService ? 2 : 1)
  const [selectedService, setSelectedService] = useState<Service | null>(preselectedService)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dateAvailable, setDateAvailable] = useState(true)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [duration, setDuration] = useState(2)
  const [location, setLocation] = useState('')
  const [locationCoords, setLocationCoords] = useState<LngLat | null>(null)
const [customRequest, setCustomRequest] = useState<CustomRequest>({ from: '10:00 AM', to: '12:00 PM', note: '', tip: 0, tipCustom: '' })

  const timeSlots = useMemo(() => generateSlots(MOCK_SCHEDULE.from, MOCK_SCHEDULE.to), [])

  if (!companion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[14px] text-[var(--color-gray)]">Companion not found</p>
        <button onClick={() => navigate('/app')} className="mt-2 text-[var(--color-amber)] text-[13px]">Go home</button>
      </div>
    )
  }

  const hourlyRate = companion.priceFrom
  const total = hourlyRate * duration

  function handleDateSelect(date: Date, available: boolean) {
    setSelectedDate(date)
    setDateAvailable(available)
    setSelectedTime(null)
  }

  function canProceed() {
    if (step === 1) return selectedService !== null
    if (step === 2) {
      if (!selectedDate) return false
      if (!dateAvailable) return customRequest.from !== customRequest.to && customRequest.tip > 0
      return selectedTime !== null
    }
    if (step === 3) return location.trim().length > 0
    return true
  }

  function next() {
    if (step < TOTAL_STEPS) setStep(s => s + 1)
    else navigate('/app/bookings')
  }
  function back() {
    if (step > 1) setStep(s => s - 1)
    else navigate(-1)
  }

  const stepTitles = ['Choose Service', 'Pick Date & Time', 'Meeting Spot', 'Confirm & Pay']
  const summaryTime = dateAvailable
    ? `${selectedTime} · ${duration} ${duration === 1 ? 'hour' : 'hours'}`
    : `${customRequest.from} – ${customRequest.to} (custom request)`

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">

      {/* ── Header ── */}
      <div className="bg-white border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-[1060px] mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3 h-[56px]">
            <button
              onClick={back}
              className="w-8 h-8 rounded-[8px] hover:bg-[var(--color-gray-light)] flex items-center justify-center transition-colors flex-shrink-0"
            >
              <IconArrowLeft size={18} stroke={1.5} className="text-[var(--color-dark)]" />
            </button>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-[var(--color-dark)] leading-none">{stepTitles[step - 1]}</p>
              <p className="text-[11px] text-[var(--color-gray)] mt-0.5">Step {step} of {TOTAL_STEPS}</p>
            </div>
            {/* Progress dots */}
            <div className="hidden md:flex items-center gap-1.5">
              {[1,2,3,4].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all ${
                  s < step ? 'w-5 bg-[var(--color-success)]' :
                  s === step ? 'w-8 bg-[var(--color-amber)]' :
                  'w-5 bg-[var(--color-border)]'
                }`} />
              ))}
            </div>
            <Avatar src={companion.avatarUrl ?? undefined} initials={companion.initials} size="sm" />
          </div>
          {/* Mobile progress bar */}
          <div className="md:hidden h-1 bg-[var(--color-border)] rounded-full mb-1 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%`, background: 'var(--gradient-gold)' }}
            />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1060px] mx-auto px-4 md:px-8 py-5 md:py-8 md:grid md:grid-cols-[280px,1fr] lg:grid-cols-[300px,1fr] md:gap-8 md:items-start">

          {/* Desktop sidebar */}
          <div className="hidden md:block">
            <CompanionSidebar
              companion={companion}
              step={step}
              selectedService={selectedService}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              duration={duration}
              location={location}
              total={total}
            />
          </div>

          {/* Step content */}
          <div className="flex flex-col gap-4">

            {/* ── Step 1: Service ── */}
            {step === 1 && (
              <div>
                <div className="mb-5">
                  <h2 className="text-[18px] font-bold text-[var(--color-dark)]">Choose an experience</h2>
                  <p className="text-[13px] text-[var(--color-gray)] mt-1">
                    All services with {companion.name} are billed at{' '}
                    <span className="font-semibold text-[var(--color-amber)]">₹{hourlyRate.toLocaleString()}/hr</span>
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {companion.services.map(service => (
                    <button
                      key={service.type}
                      onClick={() => setSelectedService(service)}
                      className={`flex items-center justify-between rounded-[14px] border-2 p-4 transition-all text-left ${
                        selectedService?.type === service.type
                          ? 'border-[var(--color-amber)] bg-[var(--color-amber-light)] shadow-[0_2px_12px_rgba(232,160,0,0.15)]'
                          : 'border-[var(--color-border)] bg-white hover:border-[var(--color-amber)]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                          selectedService?.type === service.type ? 'bg-[var(--color-amber)]/20' : 'bg-[var(--color-gray-light)]'
                        }`}>
                          <IconUsers size={18} stroke={1.5} className={selectedService?.type === service.type ? 'text-[var(--color-amber-dark)]' : 'text-[var(--color-gray)]'} />
                        </div>
                        <div>
                          <p className={`text-[14px] font-semibold ${selectedService?.type === service.type ? 'text-[var(--color-amber-dark)]' : 'text-[var(--color-dark)]'}`}>
                            {service.label}
                          </p>
                          <p className="text-[11px] text-[var(--color-gray)] mt-0.5">₹{hourlyRate.toLocaleString()} / hour</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        selectedService?.type === service.type
                          ? 'bg-[var(--color-amber)] border-[var(--color-amber)]'
                          : 'border-[var(--color-border)]'
                      }`}>
                        {selectedService?.type === service.type && <IconCheck size={11} stroke={2.5} color="white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 2: Date & Time ── */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="mb-1">
                  <h2 className="text-[18px] font-bold text-[var(--color-dark)]">When would you like to meet?</h2>
                  <p className="text-[13px] text-[var(--color-gray)] mt-1">
                    Available {[...MOCK_SCHEDULE.days].join(', ')} · {MOCK_SCHEDULE.from}–{MOCK_SCHEDULE.to}
                  </p>
                </div>

                <MiniCalendar selected={selectedDate} onChange={handleDateSelect} schedule={MOCK_SCHEDULE} />

                {selectedDate && !dateAvailable && (
                  <CustomBookingPanel value={customRequest} onChange={setCustomRequest} />
                )}

                {selectedDate && dateAvailable && (
                  <>
                    <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <IconClock size={15} stroke={1.5} className="text-[var(--color-amber)]" />
                          <p className="text-[14px] font-bold text-[var(--color-dark)]">Available slots</p>
                        </div>
                        <span className="text-[11px] text-[var(--color-gray)] bg-[var(--color-gray-light)] px-2 py-0.5 rounded-full">
                          {MOCK_SCHEDULE.from} – {MOCK_SCHEDULE.to}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                        {timeSlots.map(slot => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2.5 rounded-[10px] text-[12px] font-semibold transition-all ${
                              selectedTime === slot
                                ? 'bg-[var(--color-amber)] text-white shadow-[0_2px_8px_rgba(232,160,0,0.35)]'
                                : 'bg-[var(--color-gray-light)] text-[var(--color-dark)] hover:bg-[var(--color-amber-light)] hover:text-[var(--color-amber-dark)]'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
                      <p className="text-[14px] font-bold text-[var(--color-dark)] mb-3">Duration</p>
                      <div className="grid grid-cols-4 gap-2">
                        {DURATION_OPTIONS.map(hrs => (
                          <button
                            key={hrs}
                            onClick={() => setDuration(hrs)}
                            className={`py-3 rounded-[10px] text-[13px] font-semibold transition-all flex flex-col items-center gap-0.5 ${
                              duration === hrs
                                ? 'bg-[var(--color-amber)] text-white shadow-[0_2px_8px_rgba(232,160,0,0.35)]'
                                : 'bg-[var(--color-gray-light)] text-[var(--color-dark)] hover:bg-[var(--color-amber-light)]'
                            }`}
                          >
                            <span className="text-[15px] font-bold">{hrs}h</span>
                            {selectedTime && (
                              <span className={`text-[10px] ${duration === hrs ? 'text-white/80' : 'text-[var(--color-gray)]'}`}>
                                ₹{(hourlyRate * hrs).toLocaleString()}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {!selectedDate && (
                  <div className="flex items-center gap-3 bg-[var(--color-amber-light)] rounded-[12px] px-4 py-3">
                    <IconCalendar size={16} stroke={1.5} className="text-[var(--color-amber)] flex-none" />
                    <p className="text-[13px] text-[var(--color-amber-dark)] font-medium">Select a date above to see available time slots</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Meeting Spot ── */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-[18px] font-bold text-[var(--color-dark)]">Where should you meet?</h2>
                  <p className="text-[13px] text-[var(--color-gray)] mt-1">
                    Tap the map to pin a spot within {companion.name}'s area. Shared after confirmation.
                  </p>
                </div>

                <LocationPickerMap
                  centerLng={72.829}
                  centerLat={19.057}
                  radiusKm={3}
                  selected={locationCoords}
                  onSelect={(label, coords) => { setLocationCoords(coords); setLocation(label) }}
                />

                <div className="relative">
                  <IconMapPin size={15} stroke={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-amber)]" />
                  <input
                    type="text"
                    value={location}
                    onChange={e => { setLocation(e.target.value); setLocationCoords(null) }}
                    placeholder="Or type a place name / address…"
                    className="w-full h-12 pl-10 pr-10 rounded-[12px] bg-white border border-[var(--color-border)] text-[13px] text-[var(--color-dark)] placeholder:text-[var(--color-gray)] focus:outline-none focus:border-[var(--color-amber)] transition-colors"
                  />
                  {location && (
                    <button onClick={() => { setLocation(''); setLocationCoords(null) }} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <IconX size={14} stroke={1.5} className="text-[var(--color-gray)]" />
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* ── Step 4: Summary + Pay ── */}
            {step === 4 && (
              <div className="flex flex-col gap-4">
                {!dateAvailable && (
                  <div className="flex items-center gap-2 bg-[var(--color-amber-light)] rounded-[12px] px-4 py-3">
                    <IconMessageCircle size={14} stroke={1.5} className="text-[var(--color-amber)] flex-none" />
                    <p className="text-[12px] text-[var(--color-amber-dark)] font-medium">
                      Custom request — {companion.name} will confirm within 24 hours.
                    </p>
                  </div>
                )}

                <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
                  <p className="text-[14px] font-bold text-[var(--color-dark)] mb-4">Booking Summary</p>
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--color-border)]">
                    <Avatar src={companion.avatarUrl ?? undefined} initials={companion.initials} size="lg" />
                    <div>
                      <p className="text-[15px] font-bold text-[var(--color-dark)]">{companion.name}</p>
                      <p className="text-[12px] text-[var(--color-gray)]">{companion.neighbourhood}, {companion.city}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { icon: <IconCheck size={13} stroke={1.5} />,    label: 'Service', value: selectedService?.label },
                      { icon: <IconCalendar size={13} stroke={1.5} />, label: 'Date',    value: selectedDate?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) },
                      { icon: <IconClock size={13} stroke={1.5} />,    label: 'Time',    value: summaryTime },
                      { icon: <IconMapPin size={13} stroke={1.5} />,   label: 'Meet at', value: location || '—' },
                    ].map(row => (
                      <div key={row.label} className="flex items-start gap-2.5 bg-[var(--color-bg)] rounded-[10px] px-3 py-2.5">
                        <span className="text-[var(--color-amber)] flex-none mt-0.5">{row.icon}</span>
                        <div className="min-w-0">
                          <p className="text-[10px] text-[var(--color-gray)] uppercase tracking-wide">{row.label}</p>
                          <p className="text-[13px] font-semibold text-[var(--color-dark)] truncate">{row.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {dateAvailable && (
                  <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
                    <p className="text-[14px] font-bold text-[var(--color-dark)] mb-3">Price Breakdown</p>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-[var(--color-gray)]">₹{hourlyRate.toLocaleString()} × {duration} hr{duration > 1 ? 's' : ''}</span>
                        <span className="font-semibold text-[var(--color-dark)]">₹{total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-[var(--color-gray)]">Platform fee (5%)</span>
                        <span className="font-semibold text-[var(--color-dark)]">₹{Math.round(total * 0.05).toLocaleString()}</span>
                      </div>
                      <div className="border-t border-[var(--color-border)] pt-2.5 flex justify-between items-center">
                        <span className="text-[15px] font-bold text-[var(--color-dark)]">Total</span>
                        <span className="text-[18px] font-bold text-[var(--color-amber-dark)]">₹{Math.round(total * 1.05).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {!dateAvailable && (
                  <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
                    <p className="text-[14px] font-bold text-[var(--color-dark)] mb-3">Tip Breakdown</p>
                    <div className="flex justify-between text-[13px] mb-1.5">
                      <span className="text-[var(--color-gray)]">Companion tip</span>
                      <span className="font-semibold text-[var(--color-dark)]">₹{customRequest.tip.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-gray)]">Charged upfront. Session price agreed after confirmation.</p>
                  </div>
                )}

                <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconCreditCard size={16} stroke={1.5} className="text-[var(--color-gray)]" />
                      <p className="text-[13px] font-medium text-[var(--color-dark)]">Visa ending 4242</p>
                    </div>
                    <button className="text-[12px] text-[var(--color-amber)] font-medium">Change</button>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-[var(--color-gray-light)] rounded-[12px] px-3.5 py-3">
                  <IconShieldCheck size={14} stroke={1.5} className="text-[var(--color-success)] flex-none mt-0.5" />
                  <p className="text-[11px] text-[var(--color-gray)] leading-relaxed">
                    {dateAvailable
                      ? `Payment is held securely. You'll only be charged after ${companion.name} accepts.`
                      : `Only the tip (₹${customRequest.tip.toLocaleString()}) is charged now. Session payment is settled after ${companion.name} confirms.`}
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="bg-white border-t border-[var(--color-border)]">
        <div className="max-w-[1060px] mx-auto px-4 md:px-8 py-4 md:pl-[calc(300px+64px)]">
          {step === 4 && (
            <p className="text-center text-[11px] text-[var(--color-gray)] mb-2">
              By confirming you agree to our booking terms and cancellation policy.
            </p>
          )}
          <button
            onClick={next}
            disabled={!canProceed()}
            className="w-full py-3.5 bg-[var(--color-amber)] rounded-[14px] text-white text-[15px] font-bold disabled:opacity-40 transition-all hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(232,160,0,0.35)]"
          >
            {step === TOTAL_STEPS ? (
              <>
                <IconCheck size={17} stroke={2.5} />
                {dateAvailable
                  ? `Confirm Booking · ₹${Math.round(total * 1.05).toLocaleString()}`
                  : `Send Custom Request · ₹${customRequest.tip.toLocaleString()} tip`}
              </>
            ) : 'Continue'}
          </button>
        </div>
      </div>

    </div>
  )
}
