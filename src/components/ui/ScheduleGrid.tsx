import { cn } from '../../lib/cn'

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
type PeriodKey = 'morning' | 'afternoon' | 'evening' | 'night'

const DAYS: Array<{ key: DayKey; short: string; label: string }> = [
  { key: 'mon', short: 'Mo', label: 'Monday' },
  { key: 'tue', short: 'Tu', label: 'Tuesday' },
  { key: 'wed', short: 'We', label: 'Wednesday' },
  { key: 'thu', short: 'Th', label: 'Thursday' },
  { key: 'fri', short: 'Fr', label: 'Friday' },
  { key: 'sat', short: 'Sa', label: 'Saturday' },
  { key: 'sun', short: 'Su', label: 'Sunday' },
]

const PERIODS: Array<{ key: PeriodKey; label: string; time: string }> = [
  { key: 'morning',   label: 'Morning',   time: '6 AM – 12 PM' },
  { key: 'afternoon', label: 'Afternoon', time: '12 – 6 PM' },
  { key: 'evening',   label: 'Evening',   time: '6 – 10 PM' },
  { key: 'night',     label: 'Night',     time: '10 PM+' },
]

export type ScheduleValue = Partial<Record<DayKey, Set<PeriodKey>>>

interface ScheduleGridProps {
  value: ScheduleValue
  onChange: (next: ScheduleValue) => void
  className?: string
}

export function createEmptySchedule(): ScheduleValue {
  return {}
}

export default function ScheduleGrid({ value, onChange, className }: ScheduleGridProps) {
  function toggle(day: DayKey, period: PeriodKey) {
    const next: ScheduleValue = {}
    for (const d of Object.keys(value) as DayKey[]) {
      next[d] = new Set(value[d])
    }
    if (!next[day]) next[day] = new Set()
    const daySet = next[day]!
    daySet.has(period) ? daySet.delete(period) : daySet.add(period)
    if (daySet.size === 0) delete next[day]
    onChange(next)
  }

  function toggleDay(day: DayKey) {
    const next: ScheduleValue = {}
    for (const d of Object.keys(value) as DayKey[]) {
      next[d] = new Set(value[d])
    }
    const allActive = PERIODS.every((p) => next[day]?.has(p.key))
    if (allActive) {
      delete next[day]
    } else {
      next[day] = new Set(PERIODS.map((p) => p.key))
    }
    onChange(next)
  }

  const totalSlots = Object.values(value).reduce((acc, s) => acc + (s?.size ?? 0), 0)

  return (
    <div className={cn('bg-white rounded-[var(--radius-xl)] border-[0.5px] border-[var(--color-border)]', className)}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold text-[var(--color-dark)]">Weekly Availability</div>
            <div className="text-[11px] text-[var(--color-gray)] mt-0.5">Tap a cell to toggle. Tap a day header to select all.</div>
          </div>
          {totalSlots > 0 && (
            <div className="text-[11px] font-medium text-[var(--color-amber)] bg-[var(--color-amber-light)] px-2.5 py-1 rounded-full">
              {totalSlots} slot{totalSlots !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px]">
          <thead>
            <tr>
              <th className="w-[80px]" />
              {DAYS.map((d) => {
                const allActive = PERIODS.every((p) => value[d.key]?.has(p.key))
                return (
                  <th key={d.key} className="pb-0 pt-0">
                    <button
                      type="button"
                      onClick={() => toggleDay(d.key)}
                      title={`Toggle all of ${d.label}`}
                      className={cn(
                        'w-full py-3 text-[11px] font-semibold transition-colors',
                        allActive ? 'text-[var(--color-amber)]' : 'text-[var(--color-gray)]',
                      )}
                    >
                      {d.short}
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period, pi) => (
              <tr key={period.key} className={pi < PERIODS.length - 1 ? 'border-b border-[var(--color-border)]' : ''}>
                {/* Period label */}
                <td className="px-3 py-2.5">
                  <div className="text-[11px] font-medium text-[var(--color-dark)] leading-tight">{period.label}</div>
                  <div className="text-[9px] text-[var(--color-gray)] mt-0.5">{period.time}</div>
                </td>

                {DAYS.map((d) => {
                  const active = !!value[d.key]?.has(period.key)
                  return (
                    <td key={d.key} className="px-1 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(d.key, period.key)}
                        aria-label={`${active ? 'Remove' : 'Add'} ${period.label} on ${d.label}`}
                        aria-pressed={active}
                        className={cn(
                          'w-7 h-7 rounded-[var(--radius-sm)] transition-all duration-100 mx-auto block border',
                          active
                            ? 'bg-[var(--color-amber)] border-[var(--color-amber)] shadow-sm'
                            : 'bg-[var(--color-bg)] border-[var(--color-border)] hover:border-[var(--color-amber)]',
                        )}
                      >
                        {active && (
                          <svg viewBox="0 0 10 10" className="w-3 h-3 mx-auto" fill="none">
                            <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reminder */}
      <div className="mx-4 mb-4 mt-3 px-3 py-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-[var(--radius-md)]">
        <div className="text-[11px] text-[#92400E] leading-relaxed">
          Keep your availability up to date — companions with stale schedules get fewer bookings.
        </div>
      </div>
    </div>
  )
}
