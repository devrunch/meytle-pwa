import { cn } from '../../lib/cn'

interface ProgressBarProps {
  // Segmented mode
  total?: number
  current?: number
  // Continuous mode (0–100)
  value?: number
  className?: string
}

export default function ProgressBar({ total, current, value, className }: ProgressBarProps) {
  // Continuous bar when value is provided
  if (value !== undefined) {
    return (
      <div
        className={cn('w-full h-[3px] rounded-full bg-[#EEEBE4] overflow-hidden', className)}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-[var(--color-amber)] rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    )
  }

  // Segmented mode
  const t = total ?? 1
  const c = current ?? 0
  return (
    <div
      className={cn('flex gap-1', className)}
      role="progressbar"
      aria-valuenow={c}
      aria-valuemin={1}
      aria-valuemax={t}
      aria-label={`Step ${c} of ${t}`}
    >
      {Array.from({ length: t }, (_, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 h-[3px] rounded-full transition-all duration-300',
            i < c ? 'bg-[var(--color-amber)]' : 'bg-[#EEEBE4]',
          )}
        />
      ))}
    </div>
  )
}
