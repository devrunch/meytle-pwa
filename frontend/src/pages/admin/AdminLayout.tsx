import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import {
  IconLayoutDashboard, IconUsers, IconUserStar, IconCalendarEvent,
  IconChevronLeft, IconShieldCheck,
} from '@tabler/icons-react';
import { useAuthStore } from '../../store/authStore';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: IconLayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: IconUsers },
  { to: '/admin/companions', label: 'Companions', icon: IconUserStar },
  { to: '/admin/bookings', label: 'Bookings', icon: IconCalendarEvent },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!user?.roles.includes('admin' as any)) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0B1120' }}>
      {/* Sidebar */}
      <aside
        className="w-52 shrink-0 flex flex-col border-r sticky top-0 h-screen"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0F1929' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
            <IconShieldCheck size={14} className="text-white" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-white tracking-tight leading-none">meytle</span>
            <span className="text-[9px] text-white/30 block leading-none mt-0.5">admin</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`
              }
              style={({ isActive }) =>
                isActive ? { background: 'rgba(0,212,170,0.12)', color: '#00D4AA' } : {}
              }>
              {({ isActive }) => (
                <>
                  <Icon size={15} stroke={isActive ? 2.2 : 1.7} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 border-t pt-3 shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-6 h-6 rounded-lg overflow-hidden bg-linear-to-br from-teal-400 to-blue-500 shrink-0 flex items-center justify-center text-white text-[9px] font-bold">
              {user?.fullName?.[0] ?? '?'}
            </div>
            <p className="text-[11px] text-white/50 truncate">{user?.fullName}</p>
          </div>
          <button onClick={() => navigate('/home')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
            <IconChevronLeft size={12} />
            Back to app
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
