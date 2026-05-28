import { type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  label: string
}

export default function Chip({ active = false, label, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'flex-shrink-0 px-3 py-[5px] rounded-[var(--radius-full)]',
        'text-[11px] border transition-all duration-150 cursor-pointer whitespace-nowrap',
        active
          ? 'bg-[var(--color-amber-light)] border-[var(--color-amber)] text-[var(--color-amber-dark)] font-medium'
          : 'bg-white border-[#D8D4CC] text-[#555555] hover:border-[var(--color-amber)]',
        className,
      )}
      {...props}
    >
      {label}
    </button>
  )
}
