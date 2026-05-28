import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  body: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-[var(--color-gray-light)] flex items-center justify-center mb-4 text-[var(--color-gray)]">
        {icon}
      </div>
      <h3 className="text-[16px] font-semibold text-[var(--color-dark)] mb-1">{title}</h3>
      <p className="text-[13px] text-[var(--color-gray)] max-w-[280px] leading-relaxed mb-5">{body}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 rounded-[10px] bg-[var(--color-amber)] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
