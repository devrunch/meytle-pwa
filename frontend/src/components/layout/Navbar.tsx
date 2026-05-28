import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  IconCompass, IconSearch, IconCalendarEvent, IconMessage2,
  IconUserStar, IconChevronDown, IconLogout,
  IconSettings, IconLayoutDashboard, IconMenu2, IconX, IconUserCircle,
} from '@tabler/icons-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

const NAV_LINKS = [
  { to: '/home',     icon: IconCompass,      label: 'Home' },
  { to: '/browse',   icon: IconSearch,       label: 'Browse' },
  { to: '/bookings', icon: IconCalendarEvent, label: 'Bookings' },
  { to: '/messages', icon: IconMessage2,     label: 'Messages' },
];

function UserDropdown({ onClose }: { onClose: () => void }) {
  const { user, logout, isCompanion } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-52 bg-surface rounded-2xl border border-border shadow-xl overflow-hidden z-50"
      onClick={(e) => e.stopPropagation()}>
      <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-1 ring-border">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
              {user?.fullName?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-heading truncate">{user?.fullName}</p>
          <p className="text-[11px] text-muted truncate">{user?.email}</p>
        </div>
      </div>

      <div className="py-1">
        <Link to="/profile" onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-body hover:bg-surface-alt transition-colors">
          <IconUserCircle size={14} className="text-accent-green shrink-0" />
          Profile
        </Link>
        {isCompanion() && (
          <Link to="/companion/dashboard" onClick={onClose}
            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-body hover:bg-surface-alt transition-colors">
            <IconLayoutDashboard size={14} className="text-accent-green shrink-0" />
            Companion Dashboard
          </Link>
        )}
        <Link to="/settings" onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-body hover:bg-surface-alt transition-colors">
          <IconSettings size={14} className="text-muted shrink-0" />
          Settings
        </Link>
      </div>

      <div className="border-t border-border/60 py-1">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors">
          <IconLogout size={14} className="shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function Navbar() {
  const { user, isCompanion } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initial = user?.fullName ? user.fullName.trim()[0].toUpperCase() : '?';
  const avatarUrl = user?.avatarUrl;

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-2xl border-b border-border/50">
        <div className="max-w-5xl mx-auto px-5 h-[52px] flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/home" className="shrink-0">
            <span className="text-base font-extrabold gradient-primary-text tracking-tight">meytle</span>
          </Link>

          {/* Center pill nav — desktop */}
          <nav className="hidden md:flex items-center bg-surface-alt/80 border border-border/60 rounded-full p-1 gap-0.5">
            {NAV_LINKS.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    isActive ? 'text-white shadow-md' : 'text-muted hover:text-body'
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { background: 'linear-gradient(135deg,#00D4AA 0%,#00C2D8 50%,#4F8CFF 100%)' } : {}
                }>
                <Icon size={13} stroke={2} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            {/* Companion CTA / Dashboard — desktop */}
            <Link
              to={isCompanion() ? '/companion/dashboard' : '/become-companion'}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full text-white whitespace-nowrap shadow-sm hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#00D4AA 0%,#00C2D8 50%,#4F8CFF 100%)' }}>
              {isCompanion()
                ? <><IconLayoutDashboard size={13} stroke={2} /> Dashboard</>
                : <><IconUserStar size={13} stroke={2} /> Become a Companion</>}
            </Link>

            {/* Avatar dropdown */}
            <div ref={dropdownRef} className="relative">
              <button onClick={() => setDropdownOpen((s) => !s)}
                className="flex items-center gap-1.5 hover:opacity-75 transition-opacity">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-border">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user?.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                      {initial}
                    </div>
                  )}
                </div>
                <IconChevronDown size={12}
                  className={`text-muted transition-transform hidden md:block ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && <UserDropdown onClose={() => setDropdownOpen(false)} />}
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden p-1.5 rounded-lg hover:bg-surface-alt transition-colors"
              onClick={() => setMobileOpen((s) => !s)}>
              {mobileOpen
                ? <IconX size={17} className="text-body" />
                : <IconMenu2 size={17} className="text-body" />}
            </button>
          </div>
        </div>

        {/* Mobile slide-down */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/40 bg-surface/95 backdrop-blur-2xl px-3 py-2 space-y-0.5">
            {NAV_LINKS.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'text-accent-green bg-surface-alt' : 'text-body hover:bg-surface-alt'
                  }`
                }>
                <Icon size={16} stroke={1.8} />
                {label}
              </NavLink>
            ))}
            {!isCompanion() && (
              <Link to="/become-companion" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                <IconUserStar size={16} stroke={1.8} />
                Become a Companion
              </Link>
            )}
            {isCompanion() && (
              <Link to="/companion/dashboard" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-accent-green hover:bg-surface-alt transition-colors">
                <IconLayoutDashboard size={16} stroke={1.8} />
                Companion Dashboard
              </Link>
            )}
            <Link to="/settings" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-body hover:bg-surface-alt transition-colors">
              <IconSettings size={16} stroke={1.8} />
              Settings
            </Link>
          </div>
        )}
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-2xl border-t border-border/40">
        <div className="flex">
          {NAV_LINKS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-medium transition-colors ${
                  isActive ? 'text-accent-green' : 'text-muted'
                }`
              }>
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-surface-alt' : ''}`}>
                    <Icon size={17} stroke={isActive ? 2.2 : 1.6} />
                  </div>
                  {label}
                </>
              )}
            </NavLink>
          ))}
          <button onClick={() => setDropdownOpen((s) => !s)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-medium text-muted">
            <div className="p-1">
              <div className="w-[17px] h-[17px] rounded-full overflow-hidden ring-1 ring-border">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user?.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-[8px] font-bold"
                    style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                    {initial}
                  </div>
                )}
              </div>
            </div>
            Me
          </button>
        </div>
      </nav>
    </>
  );
}
