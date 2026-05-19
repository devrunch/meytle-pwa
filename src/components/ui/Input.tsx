import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, disabled, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-medium text-[var(--color-dark)] uppercase tracking-[0.06em]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 text-[var(--color-gray)] flex items-center pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full h-11 px-3 text-[13px] rounded-[var(--radius-md)]',
              'border-[0.5px] border-[#D8D4CC] bg-[var(--color-bg)]',
              'text-[var(--color-dark)] placeholder:text-[var(--color-gray)]',
              'transition-all duration-150',
              'focus:outline-none focus:border-[var(--color-amber)]',
              'focus:shadow-[0_0_0_3px_rgba(186,117,23,0.15)]',
              error && 'border-[var(--color-error)] bg-[var(--color-error-bg)]',
              disabled && 'opacity-50 bg-[var(--color-gray-light)] cursor-not-allowed',
              icon && 'pl-9',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-[var(--color-error)]" role="alert">{error}</p>}
        {hint && !error && <p className="text-[11px] text-[var(--color-gray)]">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
