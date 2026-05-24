import { cn } from '../../lib/cn'

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

const DAYS: Array<{ key: DayKey; short: string; label: string }> = [
  { key: 'mon', short: 'Mon', label: 'Monday' },
  { key: 'tue', short: 'Tue', label: 'Tuesday' },
  { key: 'wed', short: 'Wed', label: 'Wednesday' },
  { key: 'thu', short: 'Thu', label: 'Thursday' },
  { key: 'fri', short: 'Fri', label: 'Friday' },
  { key: 'sat', short: 'Sat', label: 'Saturday' },
  { key: 'sun', short: 'Sun', label: 'Sunday' },
]

const TIME_OPTIONS = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM',
]

export type ScheduleValue = {
  days: Set<DayKey>
  from: string
  to: string
}

export function createEmptySchedule(): ScheduleValue {
  return { days: new Set(), from: '9:00 AM', to: '6:00 PM' }
}

interface ScheduleGridProps {
  value: ScheduleValue
  onChange: (next: ScheduleValue) => void
  className?: string
}

export default function ScheduleGrid({ value, onChange, className }: ScheduleGridProps) {
  function toggleDay(day: DayKey) {
    const next = new Set(value.days)
    next.has(day) ? next.delete(day) : next.add(day)
    onChange({ ...value, days: next })
  }

  function setWeekdays() {
    const weekdays: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri']
    onChange({ ...value, days: new Set(weekdays) })
  }

  function setWeekend() {
    onChange({ ...value, days: new Set(['sat', 'sun'] as DayKey[]) })
  }

  function setAllDays() {
    onChange({ ...value, days: new Set(DAYS.map(d => d.key)) })
  }

  const count = value.days.size

  return (
    <div className={cn('flex flex-col gap-5', className)}>

      {/* Day selector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[14px] font-semibold text-[var(--color-dark)]">Available days</p>
          <div className="flex gap-1.5">
            {[
              { label: 'Weekdays', action: setWeekdays },
              { label: 'Weekend',  action: setWeekend  },
              { label: 'Every day', action: setAllDays  },
            ].map(p => (
              <button
                key={p.label}
                onClick={p.action}
                className="text-[10px] font-medium text-[var(--color-amber)] bg-[var(--color-amber-light)] px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {DAYS.map(d => {
            const active = value.days.has(d.key)
            return (
              <button
                key={d.key}
                onClick={() => toggleDay(d.key)}
                className={cn(
                  'flex-1 min-w-[calc(14%-8px)] py-2.5 rounded-[10px] text-[12px] font-semibold transition-all border-2',
                  active
                    ? 'bg-[var(--color-amber)] border-[var(--color-amber)] text-white shadow-sm'
                    : 'bg-white border-[var(--color-border)] text-[var(--color-gray)] hover:border-[var(--color-amber)]/50'
                )}
              >
                {d.short}
              </button>
            )
          })}
        </div>

        {count > 0 && (
          <p className="text-[11px] text-[var(--color-amber)] mt-2">
            {count} day{count !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Time range */}
      <div>
        <p className="text-[14px] font-semibold text-[var(--color-dark)] mb-3">Available hours</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-[var(--color-gray)] block mb-1.5">From</label>
            <select
              value={value.from}
              onChange={e => onChange({ ...value, from: e.target.value })}
              className="w-full h-10 px-3 rounded-[10px] border border-[var(--color-border)] bg-white text-[13px] font-medium text-[var(--color-dark)] focus:outline-none focus:border-[var(--color-amber)] transition-colors appearance-none cursor-pointer"
            >
              {TIME_OPTIONS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-[var(--color-gray)] block mb-1.5">To</label>
            <select
              value={value.to}
              onChange={e => onChange({ ...value, to: e.target.value })}
              className="w-full h-10 px-3 rounded-[10px] border border-[var(--color-border)] bg-white text-[13px] font-medium text-[var(--color-dark)] focus:outline-none focus:border-[var(--color-amber)] transition-colors appearance-none cursor-pointer"
            >
              {TIME_OPTIONS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {value.days.size > 0 && (
          <div className="mt-3 bg-[var(--color-amber-light)] rounded-[10px] px-3 py-2.5">
            <p className="text-[12px] text-[var(--color-amber-dark)] font-medium">
              You'll be available {value.from} – {value.to} on{' '}
              {Array.from(value.days).map(d => DAYS.find(x => x.key === d)?.short).join(', ')}
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
