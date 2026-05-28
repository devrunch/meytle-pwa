import { IconHome, IconMap, IconMessageCircle, IconCalendar, IconUser } from '@tabler/icons-react'
import { cn } from '../../lib/cn'
import type { NavTab } from '../../types'

const NAV_ITEMS: Array<{ tab: NavTab; label: string; Icon: React.ComponentType<{ size?: number | string; stroke?: number | string }> }> = [
  { tab: 'home',     label: 'Home',     Icon: IconHome },
  { tab: 'map',      label: 'Map',      Icon: IconMap },
  { tab: 'messages', label: 'Messages', Icon: IconMessageCircle },
  { tab: 'bookings', label: 'Bookings', Icon: IconCalendar },
  { tab: 'profile',  label: 'Profile',  Icon: IconUser },
]

interface BottomNavProps {
  active: NavTab
  onChange: (tab: NavTab) => void
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-[0.5px] border-[var(--color-border)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-[52px]">
        {NAV_ITEMS.map(({ tab, label, Icon }) => {
          const isActive = tab === active
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center gap-[3px] min-w-[52px] py-1 transition-colors duration-150"
            >
              <Icon size={22} stroke={isActive ? 2 : 1.5} />
              <span className={cn('text-[9px]', isActive ? 'text-[var(--color-amber)] font-semibold' : 'text-[#999999]')}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
