import { cn } from '../../lib/cn'

interface TimeSlot {
  time: string   // "09:00"
  label: string  // "9:00 AM"
  available: boolean
}

interface TimePickerProps {
  date?: string           // display label e.g. "Tuesday, May 20"
  slots: TimeSlot[]
  selected?: string       // selected time "09:00"
  onChange: (time: string) => void
  className?: string
}

function generateSlots(startHour = 9, endHour = 21, stepMin = 60): TimeSlot[] {
  const slots: TimeSlot[] = []
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += stepMin) {
      const hour24 = h
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const ampm = hour24 >= 12 ? 'PM' : 'AM'
      const hour12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24
      const label = `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
      // mock: some slots unavailable
      const available = ![11, 14, 15, 18].includes(h)
      slots.push({ time, label, available })
    }
  }
  return slots
}

export const DEFAULT_TIME_SLOTS = generateSlots()

export default function TimePicker({ date, slots, selected, onChange, className }: TimePickerProps) {
  const morningSlots   = slots.filter((s) => parseInt(s.time) < 12)
  const afternoonSlots = slots.filter((s) => parseInt(s.time) >= 12 && parseInt(s.time) < 17)
  const eveningSlots   = slots.filter((s) => parseInt(s.time) >= 17)

  function Group({ label, items }: { label: string; items: TimeSlot[] }) {
    if (items.length === 0) return null
    return (
      <div className="mb-4">
        <div className="text-[10px] font-semibold text-[var(--color-gray)] uppercase tracking-[0.06em] mb-2">
          {label}
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((slot) => (
            <button
              key={slot.time}
              type="button"
              disabled={!slot.available}
              onClick={() => slot.available && onChange(slot.time)}
              className={cn(
                'px-3 py-2 rounded-[var(--radius-md)] text-[12px] font-medium transition-all duration-100 border',
                selected === slot.time
                  ? 'bg-[var(--color-amber)] text-white border-[var(--color-amber)]'
                  : slot.available
                    ? 'bg-white border-[#D8D4CC] text-[var(--color-dark)] hover:border-[var(--color-amber)] hover:text-[var(--color-amber)]'
                    : 'bg-[var(--color-gray-light)] border-[var(--color-border)] text-[#BBBBBB] cursor-not-allowed line-through',
              )}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-[var(--radius-xl)] border-[0.5px] border-[var(--color-border)] p-4', className)}>
      {date && (
        <div className="text-[13px] font-semibold text-[var(--color-dark)] mb-4 pb-3 border-b border-[var(--color-border)]">
          {date}
        </div>
      )}
      <Group label="Morning" items={morningSlots} />
      <Group label="Afternoon" items={afternoonSlots} />
      <Group label="Evening" items={eveningSlots} />
      {selected && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)] text-[12px] text-[var(--color-gray)]">
          Selected: <strong className="text-[var(--color-amber)]">
            {slots.find((s) => s.time === selected)?.label}
          </strong>
        </div>
      )}
    </div>
  )
}
