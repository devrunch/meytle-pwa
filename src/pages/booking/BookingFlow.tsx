import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconCheck, IconCalendar, IconClock, IconCreditCard,
  IconShieldCheck, IconChevronLeft, IconChevronRight,
} from '@tabler/icons-react'
import { ProgressBar, Avatar } from '../../components/ui'
import { MOCK_COMPANIONS } from '../../data/mock'
import type { Service } from '../../types'

const TOTAL_STEPS = 4

// Minimal calendar state
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function MiniCalendar({
  selected,
  onChange,
}: {
  selected: Date | null
  onChange: (d: Date) => void
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

  return (
    <div className="bg-white rounded-[14px] border border-[var(--color-border)] p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="w-7 h-7 rounded-full hover:bg-[var(--color-gray-light)] flex items-center justify-center">
          <IconChevronLeft size={16} stroke={1.5} className="text-[var(--color-dark)]" />
        </button>
        <p className="text-[14px] font-semibold text-[var(--color-dark)]">
          {MONTHS[viewMonth]} {viewYear}
        </p>
        <button onClick={next} className="w-7 h-7 rounded-full hover:bg-[var(--color-gray-light)] flex items-center justify-center">
          <IconChevronRight size={16} stroke={1.5} className="text-[var(--color-dark)]" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-[var(--color-gray)]">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const date = new Date(viewYear, viewMonth, day)
          const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const isSelected = selected &&
            selected.getFullYear() === viewYear &&
            selected.getMonth() === viewMonth &&
            selected.getDate() === day
          const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day

          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => onChange(date)}
              className={`h-8 w-full rounded-[6px] text-[12px] font-medium transition-colors ${
                isSelected
                  ? 'bg-[var(--color-amber)] text-white'
                  : isToday
                  ? 'border border-[var(--color-amber)] text-[var(--color-amber)]'
                  : isPast
                  ? 'text-[var(--color-border)] cursor-not-allowed'
                  : 'text-[var(--color-dark)] hover:bg-[var(--color-amber-light)] hover:text-[var(--color-amber-dark)]'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
]

const DURATION_OPTIONS = [1, 2, 3, 4]

export default function BookingFlow() {
  const { companionId } = useParams<{ companionId: string }>()
  const navigate = useNavigate()
  const companion = MOCK_COMPANIONS.find(c => c.id === companionId)

  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [duration, setDuration] = useState(2)
  const [note, setNote] = useState('')

  if (!companion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[14px] text-[var(--color-gray)]">Companion not found</p>
        <button onClick={() => navigate('/app')} className="mt-2 text-[var(--color-amber)] text-[13px]">Go home</button>
      </div>
    )
  }

  const total = selectedService ? selectedService.pricePerHour * duration : 0

  function canProceed() {
    if (step === 1) return selectedService !== null
    if (step === 2) return selectedDate !== null && selectedTime !== null
    return true
  }

  function next() {
    if (step < TOTAL_STEPS) setStep(s => s + 1)
    else navigate('/app/bookings')
  }

  const stepTitles = ['Choose Service', 'Pick Date & Time', 'Add a Note', 'Confirm & Pay']

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[var(--color-border)] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}>
            <IconArrowLeft size={20} stroke={1.5} className="text-[var(--color-dark)]" />
          </button>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-[var(--color-dark)]">{stepTitles[step - 1]}</p>
            <p className="text-[11px] text-[var(--color-gray)]">Step {step} of {TOTAL_STEPS}</p>
          </div>
          <Avatar
            src={companion.avatarUrl ?? undefined}
            initials={companion.initials}
            size="sm"
          />
        </div>
        <ProgressBar value={(step / TOTAL_STEPS) * 100} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        {/* Step 1: Service selection */}
        {step === 1 && (
          <div>
            <p className="text-[13px] text-[var(--color-gray)] mb-4">
              Select the type of experience you'd like with {companion.name}.
            </p>
            <div className="flex flex-col gap-3">
              {companion.services.map(service => (
                <button
                  key={service.type}
                  onClick={() => setSelectedService(service)}
                  className={`flex items-center justify-between rounded-[12px] border p-4 transition-colors ${
                    selectedService?.type === service.type
                      ? 'border-[var(--color-amber)] bg-[var(--color-amber-light)]'
                      : 'border-[var(--color-border)] bg-white'
                  }`}
                >
                  <div className="text-left">
                    <p className={`text-[14px] font-semibold ${selectedService?.type === service.type ? 'text-[var(--color-amber-dark)]' : 'text-[var(--color-dark)]'}`}>
                      {service.label}
                    </p>
                    <p className="text-[12px] text-[var(--color-gray)] mt-0.5">
                      ₹{service.pricePerHour.toLocaleString()} per hour
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
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

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <MiniCalendar selected={selectedDate} onChange={setSelectedDate} />

            <div className="bg-white rounded-[14px] border border-[var(--color-border)] p-4">
              <p className="text-[13px] font-semibold text-[var(--color-dark)] mb-3">Select time</p>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-2 rounded-[8px] text-[12px] font-medium transition-colors ${
                      selectedTime === slot
                        ? 'bg-[var(--color-amber)] text-white'
                        : 'bg-[var(--color-gray-light)] text-[var(--color-dark)] hover:bg-[var(--color-amber-light)] hover:text-[var(--color-amber-dark)]'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[14px] border border-[var(--color-border)] p-4">
              <p className="text-[13px] font-semibold text-[var(--color-dark)] mb-3">Duration</p>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map(hrs => (
                  <button
                    key={hrs}
                    onClick={() => setDuration(hrs)}
                    className={`flex-1 py-2 rounded-[8px] text-[12px] font-medium transition-colors ${
                      duration === hrs
                        ? 'bg-[var(--color-amber)] text-white'
                        : 'bg-[var(--color-gray-light)] text-[var(--color-dark)]'
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Note */}
        {step === 3 && (
          <div>
            <p className="text-[13px] text-[var(--color-gray)] mb-4">
              Share anything {companion.name} should know — your preferences, location ideas, or anything that would help make the experience great.
            </p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. I love places with good coffee and a quiet vibe..."
              rows={5}
              className="w-full px-4 py-3 rounded-[12px] bg-white border border-[var(--color-border)] text-[13px] text-[var(--color-dark)] placeholder:text-[var(--color-gray)] focus:outline-none focus:border-[var(--color-amber)] resize-none transition-colors"
            />
            <p className="text-[11px] text-[var(--color-gray)] mt-2">This note is optional but helps set expectations.</p>
          </div>
        )}

        {/* Step 4: Summary + Pay */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            {/* Booking summary */}
            <div className="bg-white rounded-[14px] border border-[var(--color-border)] p-4">
              <p className="text-[13px] font-semibold text-[var(--color-dark)] mb-3">Booking Summary</p>

              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--color-border)]">
                <Avatar
                  src={companion.avatarUrl ?? undefined}
                  initials={companion.initials}
                  size="lg"
                />
                <div>
                  <p className="text-[14px] font-semibold text-[var(--color-dark)]">{companion.name}</p>
                  <p className="text-[12px] text-[var(--color-gray)]">{companion.neighbourhood}, {companion.city}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  { icon: <IconClock size={13} stroke={1.5} />, label: 'Service', value: selectedService?.label },
                  { icon: <IconCalendar size={13} stroke={1.5} />, label: 'Date', value: selectedDate?.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) },
                  { icon: <IconClock size={13} stroke={1.5} />, label: 'Time', value: `${selectedTime} · ${duration} ${duration === 1 ? 'hour' : 'hours'}` },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-2">
                    <span className="text-[var(--color-gray)]">{row.icon}</span>
                    <span className="text-[12px] text-[var(--color-gray)] w-16">{row.label}</span>
                    <span className="text-[12px] font-medium text-[var(--color-dark)]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-white rounded-[14px] border border-[var(--color-border)] p-4">
              <p className="text-[13px] font-semibold text-[var(--color-dark)] mb-3">Price Breakdown</p>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--color-gray)]">₹{selectedService?.pricePerHour.toLocaleString()} × {duration} hr{duration > 1 ? 's' : ''}</span>
                  <span className="font-medium text-[var(--color-dark)]">₹{(selectedService?.pricePerHour ?? 0) * duration}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--color-gray)]">Platform fee (5%)</span>
                  <span className="font-medium text-[var(--color-dark)]">₹{Math.round(total * 0.05).toLocaleString()}</span>
                </div>
                <div className="border-t border-[var(--color-border)] pt-2 mt-1 flex justify-between">
                  <span className="text-[14px] font-bold text-[var(--color-dark)]">Total</span>
                  <span className="text-[14px] font-bold text-[var(--color-dark)]">₹{Math.round(total * 1.05).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-[14px] border border-[var(--color-border)] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconCreditCard size={16} stroke={1.5} className="text-[var(--color-gray)]" />
                  <p className="text-[13px] font-medium text-[var(--color-dark)]">Visa ending 4242</p>
                </div>
                <button className="text-[12px] text-[var(--color-amber)]">Change</button>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[var(--color-gray-light)] rounded-[10px] px-3 py-2.5">
              <IconShieldCheck size={14} stroke={1.5} className="text-[var(--color-success)] flex-none" />
              <p className="text-[11px] text-[var(--color-gray)]">
                Payment is held securely. You'll be charged only after {companion.name} accepts your request.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-white border-t border-[var(--color-border)] px-4 py-4">
        {step === 4 && (
          <p className="text-center text-[11px] text-[var(--color-gray)] mb-2">
            By confirming, you agree to our booking terms and cancellation policy.
          </p>
        )}
        <button
          onClick={next}
          disabled={!canProceed()}
          className="w-full h-12 bg-[var(--color-amber)] rounded-[12px] text-white text-[14px] font-semibold disabled:opacity-40 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
        >
          {step === TOTAL_STEPS ? (
            <>
              <IconCheck size={16} stroke={2} />
              Confirm Booking · ₹{Math.round(total * 1.05).toLocaleString()}
            </>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  )
}
