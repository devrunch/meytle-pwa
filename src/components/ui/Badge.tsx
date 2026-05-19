import { cn } from '../../lib/cn'

type BadgeVariant = 'available' | 'verified' | 'pending' | 'away' | 'success' | 'warning' | 'error' | 'default'

interface BadgeProps {
  variant: BadgeVariant
  label?: string
  className?: string
}

const variantConfig: Record<BadgeVariant, { label: string; classes: string }> = {
  available: { label: 'Available Now',  classes: 'bg-[var(--color-success-bg)] text-[var(--color-success)]' },
  verified:  { label: 'Verified',       classes: 'bg-[var(--color-amber-light)] text-[var(--color-amber-dark)]' },
  pending:   { label: 'Pending Review', classes: 'bg-[#FFF8E1] text-[#795548]' },
  away:      { label: 'Away',           classes: 'bg-[var(--color-gray-light)] text-[var(--color-gray)]' },
  success:   { label: 'Confirmed',      classes: 'bg-[var(--color-success-bg)] text-[var(--color-success)]' },
  warning:   { label: 'Pending',        classes: 'bg-[#FFF8E1] text-[#795548]' },
  error:     { label: 'Cancelled',      classes: 'bg-[var(--color-error-bg)] text-[var(--color-error)]' },
  default:   { label: 'Completed',      classes: 'bg-[var(--color-gray-light)] text-[var(--color-gray)]' },
}

export default function Badge({ variant, label, className }: BadgeProps) {
  const cfg = variantConfig[variant]
  const text = label ?? cfg.label
  return (
    <span className={cn('text-[10px] font-medium px-2 py-[2px] rounded-[var(--radius-full)]', cfg.classes, className)}>
      {text}
    </span>
  )
}
