import { useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  IconHome, IconMap, IconMessageCircle, IconCalendar, IconUser,
  IconUsers, IconBell, IconChevronDown, IconLayoutDashboard,
  IconSettings, IconLogout,
} from '@tabler/icons-react'
import { BottomNav } from '../components/ui'
import type { NavTab } from '../types'

const TAB_ROUTES: Record<NavTab, string> = {
  home:     '/app',
  map:      '/app/map',
  messages: '/app/messages',
  bookings: '/app/bookings',
  profile:  '/app/profile',
}

const NAV_ITEMS: Array<{ tab: NavTab; label: string; Icon: React.ComponentType<{ size?: number | string; stroke?: number | string }> }> = [
  { tab: 'home',     label: 'Discover',  Icon: IconHome },
  { tab: 'map',      label: 'Map',       Icon: IconMap },
  { tab: 'messages', label: 'Messages',  Icon: IconMessageCircle },
  { tab: 'bookings', label: 'Bookings',  Icon: IconCalendar },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)

  const activeTab: NavTab = (() => {
    if (pathname === '/app' || pathname === '/app/') return 'home'
    if (pathname.startsWith('/app/map'))      return 'map'
    if (pathname.startsWith('/app/messages')) return 'messages'
    if (pathname.startsWith('/app/bookings')) return 'bookings'
    if (pathname.startsWith('/app/profile'))  return 'profile'
    return 'home'
  })()

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg)]">

      {/* ── Desktop top nav (hidden on mobile) ─────────────────────── */}
      <header className="hidden md:block sticky top-0 z-50 bg-white border-b border-[var(--color-border)]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-[60px] flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-[8px] bg-[var(--color-amber)] flex items-center justify-center">
              <IconUsers size={14} stroke={1.5} color="white" />
            </div>
            <span className="text-[15px] font-semibold text-[var(--color-dark)]">Meytle</span>
          </Link>

          {/* Centre nav */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ tab, label, Icon }) => {
              const isActive = tab === activeTab
              return (
                <button
                  key={tab}
                  onClick={() => navigate(TAB_ROUTES[tab])}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'text-[var(--color-amber)] bg-[var(--color-amber-light)]'
                      : 'text-[var(--color-gray)] hover:text-[var(--color-dark)] hover:bg-[var(--color-gray-light)]'
                  }`}
                >
                  <Icon size={15} stroke={isActive ? 2 : 1.5} />
                  {label}
                  {tab === 'messages' && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--color-amber)] flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">2</span>
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Notification bell */}
            <button className="relative w-9 h-9 rounded-[8px] hover:bg-[var(--color-gray-light)] flex items-center justify-center transition-colors">
              <IconBell size={18} stroke={1.5} className="text-[var(--color-dark)]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-amber)]" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-[8px] hover:bg-[var(--color-gray-light)] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[var(--color-amber-light)] flex items-center justify-center">
                  <span className="text-[11px] font-bold text-[var(--color-amber-dark)]">Y</span>
                </div>
                <span className="text-[13px] font-medium text-[var(--color-dark)]">You</span>
                <IconChevronDown size={13} stroke={1.5} className={`text-[var(--color-gray)] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  {/* Menu */}
                  <div className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-[12px] border border-[var(--color-border)] shadow-lg py-1.5 z-20">
                    <div className="px-4 py-2.5 border-b border-[var(--color-border)]">
                      <p className="text-[13px] font-semibold text-[var(--color-dark)]">You</p>
                      <p className="text-[11px] text-[var(--color-gray)]">you@example.com</p>
                    </div>

                    {[
                      { icon: <IconUser size={14} stroke={1.5} />, label: 'My Profile', onClick: () => { navigate('/app/profile'); setProfileOpen(false) } },
                      { icon: <IconLayoutDashboard size={14} stroke={1.5} />, label: 'Companion Dashboard', onClick: () => { navigate('/app/companion/dashboard'); setProfileOpen(false) } },
                      { icon: <IconUsers size={14} stroke={1.5} />, label: 'Become a Companion', onClick: () => { navigate('/app/companion/onboarding'); setProfileOpen(false) } },
                      { icon: <IconSettings size={14} stroke={1.5} />, label: 'Settings', onClick: () => { navigate('/app/profile'); setProfileOpen(false) } },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={item.onClick}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[var(--color-dark)] hover:bg-[var(--color-gray-light)] transition-colors text-left"
                      >
                        <span className="text-[var(--color-gray)]">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}

                    <div className="border-t border-[var(--color-border)] mt-1 pt-1">
                      <button
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors text-left"
                      >
                        <IconLogout size={14} stroke={1.5} />
                        Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────────────────── */}
      <main className="flex-1 pb-[52px] md:pb-0 overflow-y-auto">
        <Outlet />
      </main>

      {/* ── Bottom nav — mobile only ──────────────────────────────────── */}
      <div className="md:hidden">
        <BottomNav active={activeTab} onChange={tab => navigate(TAB_ROUTES[tab])} />
      </div>

    </div>
  )
}
