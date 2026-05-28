import { IconSearch, IconBell, IconChevronDown, IconMapPin } from '@tabler/icons-react'

interface TopBarProps {
  location: string
  onLocationClick?: () => void
  onSearchFocus?: () => void
  hasNotification?: boolean
}

export default function TopBar({ location, onLocationClick, onSearchFocus, hasNotification = false }: TopBarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b-[0.5px] border-[var(--color-border)]">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button type="button" className="flex flex-col items-start" onClick={onLocationClick} aria-label="Change location">
          <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--color-amber)]">Your area</span>
          <span className="flex items-center gap-1 text-[13px] font-semibold text-[var(--color-dark)]">
            <IconMapPin size={13} stroke={1.5} color="var(--color-amber)" />
            {location}
            <IconChevronDown size={13} stroke={1.5} color="var(--color-amber)" />
          </span>
        </button>
        <button
          type="button"
          className="relative w-8 h-8 rounded-full bg-[var(--color-bg)] border-[0.5px] border-[var(--color-border)] flex items-center justify-center"
          aria-label={hasNotification ? 'Notifications — new alerts' : 'Notifications'}
        >
          <IconBell size={16} stroke={1.5} color="var(--color-gray)" />
          {hasNotification && (
            <span className="absolute top-1 right-1 w-[7px] h-[7px] rounded-full bg-[var(--color-amber)] border-[1.5px] border-white" />
          )}
        </button>
      </div>
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={onSearchFocus}
          className="w-full flex items-center gap-2 h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-bg)] border-[0.5px] border-[var(--color-border)] text-left"
          aria-label="Search companions and experiences"
        >
          <IconSearch size={14} stroke={1.5} color="#BBBBBB" />
          <span className="text-[12px] text-[var(--color-gray)]">Search companions, experiences…</span>
        </button>
      </div>
    </header>
  )
}
