import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { IconCheck, IconX, IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react'
import { cn } from '../../lib/cn'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  variant: ToastVariant
  title: string
  message?: string
}

interface ToastContextValue {
  toast: (variant: ToastVariant, title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const iconMap: Record<ToastVariant, ReactNode> = {
  success: <IconCheck size={16} stroke={2} color="var(--color-success)" />,
  error:   <IconX size={16} stroke={2} color="var(--color-error)" />,
  info:    <IconInfoCircle size={16} stroke={1.5} color="var(--color-amber)" />,
  warning: <IconAlertTriangle size={16} stroke={1.5} color="#B45309" />,
}

const styleMap: Record<ToastVariant, string> = {
  success: 'border-l-[3px] border-l-[var(--color-success)]',
  error:   'border-l-[3px] border-l-[var(--color-error)]',
  info:    'border-l-[3px] border-l-[var(--color-amber)]',
  warning: 'border-l-[3px] border-l-[#B45309]',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((variant: ToastVariant, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, variant, title, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Container */}
      <div
        className="fixed top-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 bg-white rounded-[var(--radius-lg)]',
              'shadow-[0_4px_24px_rgba(0,0,0,0.12)] px-4 py-3 min-w-[280px] max-w-[340px]',
              'pointer-events-auto',
              'animate-[toastIn_200ms_ease-out]',
              styleMap[t.variant],
            )}
          >
            <span className="mt-0.5 flex-shrink-0">{iconMap[t.variant]}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-[var(--color-dark)]">{t.title}</div>
              {t.message && <div className="text-[11px] text-[var(--color-gray)] mt-0.5">{t.message}</div>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 text-[var(--color-gray)] hover:text-[var(--color-dark)] mt-0.5"
              aria-label="Dismiss"
            >
              <IconX size={13} stroke={1.5} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx.toast
}

// Standalone demo trigger — used in showcase only
export function ToastDemo() {
  const toast = useToast()
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => toast('success', 'Booking confirmed!', 'Your companion will meet you at 3:00 PM.')}
        className="px-3 py-2 text-[12px] rounded-[var(--radius-md)] bg-[var(--color-success-bg)] text-[var(--color-success)] font-medium border border-[var(--color-success)]/20">
        Success toast
      </button>
      <button type="button" onClick={() => toast('error', 'Payment failed', 'Please check your card details and try again.')}
        className="px-3 py-2 text-[12px] rounded-[var(--radius-md)] bg-[var(--color-error-bg)] text-[var(--color-error)] font-medium border border-[var(--color-error)]/20">
        Error toast
      </button>
      <button type="button" onClick={() => toast('info', 'New message from Aanya', 'Looking forward to our coffee date!')}
        className="px-3 py-2 text-[12px] rounded-[var(--radius-md)] bg-[var(--color-amber-light)] text-[var(--color-amber-dark)] font-medium border border-[var(--color-amber)]/20">
        Info toast
      </button>
      <button type="button" onClick={() => toast('warning', 'Availability not set', 'Update your schedule to keep getting bookings.')}
        className="px-3 py-2 text-[12px] rounded-[var(--radius-md)] bg-[#FEF3C7] text-[#92400E] font-medium border border-[#FDE68A]">
        Warning toast
      </button>
    </div>
  )
}
