import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import type { ButtonVariant, ButtonSize } from '../../types'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'btn-gradient-gold border-transparent active:scale-[0.98] shadow-[0_2px_12px_rgba(232,160,0,0.45)]',
  ghost:
    'bg-transparent text-[var(--color-gray)] border-[0.5px] border-[#CCCCCC] hover:bg-[var(--color-bg)]',
  outline:
    'bg-transparent text-[var(--color-amber)] border-[1.5px] border-[var(--color-amber)] hover:bg-[var(--color-amber-light)]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12px] gap-1.5',
  md: 'h-10 px-4 text-[13px] gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, iconPosition = 'left', fullWidth = false, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-[var(--radius-md)]',
        'border transition-all duration-150 cursor-pointer select-none',
        'disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
    </button>
  ),
)

Button.displayName = 'Button'
export default Button
