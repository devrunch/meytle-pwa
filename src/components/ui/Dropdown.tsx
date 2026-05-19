import { useEffect, useRef, useState } from 'react'
import { IconChevronDown, IconCheck } from '@tabler/icons-react'
import { cn } from '../../lib/cn'

export interface DropdownOption {
  value: string
  label: string
  description?: string
}

interface DropdownProps {
  options: DropdownOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  className?: string
}

export default function Dropdown({ options, value, onChange, placeholder = 'Select…', label, disabled, className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} className={cn('relative w-full', className)}>
      {label && (
        <label className="block text-[11px] font-medium text-[var(--color-dark)] uppercase tracking-[0.06em] mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'w-full flex items-center justify-between gap-2',
          'h-11 px-3 rounded-[var(--radius-md)] text-[13px]',
          'border-[0.5px] border-[#D8D4CC] bg-[var(--color-bg)]',
          'transition-all duration-150',
          open && 'border-[var(--color-amber)] shadow-[0_0_0_3px_rgba(186,117,23,0.15)]',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer hover:border-[var(--color-amber)]',
        )}
      >
        <span className={selected ? 'text-[var(--color-dark)]' : 'text-[var(--color-gray)]'}>
          {selected ? selected.label : placeholder}
        </span>
        <IconChevronDown
          size={14} stroke={1.5}
          color="var(--color-gray)"
          className={cn('flex-shrink-0 transition-transform duration-150', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={cn(
            'absolute top-full mt-1 left-0 right-0 z-50',
            'bg-white border-[0.5px] border-[var(--color-border)]',
            'rounded-[var(--radius-lg)] shadow-[0_8px_32px_rgba(0,0,0,0.10)]',
            'overflow-hidden max-h-56 overflow-y-auto',
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 cursor-pointer text-[13px]',
                  'transition-colors duration-100',
                  isSelected
                    ? 'bg-[var(--color-amber-light)] text-[var(--color-amber-dark)]'
                    : 'text-[var(--color-dark)] hover:bg-[var(--color-bg)]',
                )}
              >
                <span className="flex-1">{opt.label}</span>
                {opt.description && !isSelected && (
                  <span className="text-[11px] text-[var(--color-gray)]">{opt.description}</span>
                )}
                {isSelected && <IconCheck size={13} stroke={2} color="var(--color-amber)" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
