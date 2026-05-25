import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconEdit, IconStar, IconCalendarEvent, IconHeart, IconShield,
  IconBell, IconCreditCard, IconHelp, IconLogout, IconChevronRight,
  IconUsers, IconMapPin, IconCamera,
} from '@tabler/icons-react'
import { useAuthStore } from '../../store/auth'
import { api } from '../../lib/api'

interface SettingRow {
  icon: React.ReactNode
  label: string
  value?: string
  danger?: boolean
  onClick: () => void
}

function SettingsSection({ title, rows }: { title: string; rows: SettingRow[] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-[var(--color-gray)] uppercase tracking-wider mb-2">{title}</p>
      <div className="bg-white border border-[var(--color-border)] rounded-[14px] overflow-hidden">
        {rows.map((row, i) => (
          <button
            key={i}
            onClick={row.onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[var(--color-gray-light)] transition-colors ${
              i < rows.length - 1 ? 'border-b border-[var(--color-border)]' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 ${
              row.danger ? 'bg-[var(--color-error-bg)]' : 'bg-[var(--color-gray-light)]'
            }`}>
              <span className={row.danger ? 'text-[var(--color-error)]' : 'text-[var(--color-dark)]'}>{row.icon}</span>
            </div>
            <div className="flex-1">
              <p className={`text-[13px] font-medium ${row.danger ? 'text-[var(--color-error)]' : 'text-[var(--color-dark)]'}`}>
                {row.label}
              </p>
              {row.value && <p className="text-[11px] text-[var(--color-gray)] mt-0.5">{row.value}</p>}
            </div>
            <IconChevronRight size={14} stroke={1.5} className="text-[var(--color-gray)]" />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const [bookingCount, setBookingCount] = useState<number | null>(null)
  const [completedCount, setCompletedCount] = useState<number>(0)

  useEffect(() => {
    api.get<Array<{ status: string }>>('/bookings')
      .then(res => {
        setBookingCount(res.data.length)
        setCompletedCount(res.data.filter(b => b.status === 'completed').length)
      })
      .catch(() => setBookingCount(0))
  }, [])

  const initials = user?.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-full bg-[var(--color-bg)]">

      {/* ── Header — gold strip ── */}
      <div className="relative overflow-hidden" style={{ background: 'var(--gradient-gold)' }}>
        <div className="absolute -right-10 -top-10 w-[180px] h-[180px] rounded-full border border-white/20 hidden md:block" />
        <div className="absolute right-24 bottom-0 w-[90px] h-[90px] rounded-full border border-white/10 hidden md:block" />
        <div className="absolute left-[40%] -top-4 w-[70px] h-[70px] rounded-full border border-white/10 hidden md:block" />

        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 py-4 md:py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-[52px] h-[52px] md:w-[64px] md:h-[64px] rounded-full border-[3px] border-white/60 md:border-white shadow overflow-hidden bg-white/20 flex items-center justify-center">
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                    : <span className="text-[22px] md:text-[26px] font-bold text-white">{initials}</span>
                  }
                </div>
                <button className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow">
                  <IconCamera size={10} stroke={2} color="var(--color-amber)" />
                </button>
              </div>
              {/* Info */}
              <div>
                <h1 className="text-[17px] md:text-[20px] font-semibold text-white leading-none">{user?.fullName ?? 'You'}</h1>
                <p className="text-[11px] text-white/70 mt-0.5">{user?.email ?? ''}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-white/60 flex items-center gap-1">
                    <IconMapPin size={10} stroke={1.5} />Delhi NCR
                  </span>
                </div>
              </div>
            </div>
            {/* Edit button */}
            <button className="flex items-center gap-1.5 text-[12px] text-white font-medium bg-white/15 border border-white/30 px-3 py-1.5 rounded-[8px] hover:bg-white/25 transition-colors flex-shrink-0">
              <IconEdit size={13} stroke={1.5} />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10">
        {/* ── Two-column body ── */}
        <div className="grid md:grid-cols-[300px,1fr] lg:grid-cols-[320px,1fr] gap-6 pb-10">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-4">

            {/* Activity stats */}
            <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
              <p className="text-[11px] font-semibold text-[var(--color-gray)] uppercase tracking-wider mb-3">Activity</p>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Bookings', value: bookingCount ?? '—', icon: <IconCalendarEvent size={15} stroke={1.5} color="var(--color-amber)" /> },
                  { label: 'Completed', value: completedCount, icon: <IconStar size={15} stroke={1.5} color="var(--color-amber)" /> },
                  { label: 'Reviews',  value: 0,               icon: <IconHeart size={15} stroke={1.5} color="var(--color-amber)" /> },
                ].map(stat => (
                  <div key={stat.label} className="flex flex-col items-center gap-1.5 bg-[var(--color-gray-light)] rounded-[10px] py-3">
                    {stat.icon}
                    <p className="text-[18px] font-bold text-[var(--color-dark)] leading-none">{stat.value}</p>
                    <p className="text-[10px] text-[var(--color-gray)]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Become a Companion CTA */}
            <button
              onClick={() => navigate('/app/companion/onboarding')}
              className="w-full bg-[var(--color-amber-light)] border border-[var(--color-amber)] rounded-[14px] p-4 flex items-center justify-between hover:bg-[#fdedb0] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[var(--color-amber)] flex items-center justify-center flex-shrink-0">
                  <IconUsers size={20} stroke={1.5} color="white" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-[var(--color-amber-dark)]">Become a Companion</p>
                  <p className="text-[11px] text-[var(--color-amber)]">Earn on your schedule</p>
                </div>
              </div>
              <IconChevronRight size={16} stroke={1.5} className="text-[var(--color-amber)]" />
            </button>

            {/* Verification card */}
            <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <IconShield size={15} stroke={1.5} color="var(--color-amber)" />
                <p className="text-[12px] font-semibold text-[var(--color-dark)]">Verification Status</p>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Email',         done: true  },
                  { label: 'Phone',         done: false },
                  { label: 'Government ID', done: false },
                ].map(v => (
                  <div key={v.label} className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--color-gray)]">{v.label}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      v.done
                        ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                        : 'bg-[var(--color-gray-light)] text-[var(--color-gray)]'
                    }`}>
                      {v.done ? 'Verified' : 'Not verified'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right column ── */}
          <div className="flex flex-col gap-5">
            <SettingsSection
              title="Account"
              rows={[
                { icon: <IconEdit size={16} stroke={1.5} />,       label: 'Edit Profile',           onClick: () => {} },
                { icon: <IconShield size={16} stroke={1.5} />,     label: 'Identity Verification',  value: 'Not verified', onClick: () => {} },
                { icon: <IconCreditCard size={16} stroke={1.5} />, label: 'Payment Methods',        onClick: () => {} },
              ]}
            />
            <SettingsSection
              title="Preferences"
              rows={[
                { icon: <IconBell size={16} stroke={1.5} />,  label: 'Notifications',    onClick: () => {} },
                { icon: <IconHeart size={16} stroke={1.5} />, label: 'Saved Companions', onClick: () => {} },
              ]}
            />
            <SettingsSection
              title="Support"
              rows={[
                { icon: <IconHelp size={16} stroke={1.5} />,   label: 'Help & Support', onClick: () => {} },
                { icon: <IconLogout size={16} stroke={1.5} />, label: 'Log Out', danger: true, onClick: handleLogout },
              ]}
            />
            <p className="text-center text-[11px] text-[var(--color-gray)]">Meytle v1.0.0</p>
          </div>

        </div>
      </div>
    </div>
  )
}
