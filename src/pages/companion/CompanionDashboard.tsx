import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconTrendingUp, IconCalendarEvent, IconStar, IconCurrencyRupee,
  IconCheck, IconX, IconClock, IconMapPin,
  IconEdit, IconUsers, IconShieldCheck, IconArrowUpRight,
} from '@tabler/icons-react'
import { Badge } from '../../components/ui'

type RequestStatus = 'pending' | 'confirmed' | 'declined' | 'completed'

interface BookingRequest {
  id: string
  userName: string
  userInitials: string
  service: string
  date: string
  time: string
  duration: number
  location: string
  total: number
  status: RequestStatus
  note?: string
}

const MOCK_REQUESTS: BookingRequest[] = [
  {
    id: 'r1',
    userName: 'Amit S.',
    userInitials: 'AS',
    service: 'Coffee Date',
    date: 'May 17, 2026',
    time: '10:00 AM',
    duration: 2,
    location: 'Bandra West',
    total: 1600,
    status: 'pending',
    note: 'Looking forward to a relaxed morning chat!',
  },
  {
    id: 'r2',
    userName: 'Ritu K.',
    userInitials: 'RK',
    service: 'Cultural Event',
    date: 'May 19, 2026',
    time: '3:00 PM',
    duration: 3,
    location: 'Bandra West',
    total: 3000,
    status: 'pending',
  },
  {
    id: 'r3',
    userName: 'Suresh M.',
    userInitials: 'SM',
    service: 'Coffee Date',
    date: 'May 13, 2026',
    time: '11:00 AM',
    duration: 1,
    location: 'Juhu',
    total: 800,
    status: 'confirmed',
  },
  {
    id: 'r4',
    userName: 'Divya P.',
    userInitials: 'DP',
    service: 'Concert',
    date: 'May 10, 2026',
    time: '6:00 PM',
    duration: 4,
    location: 'Lower Parel',
    total: 4800,
    status: 'completed',
  },
]

const STATS = [
  {
    label: 'This Month',
    value: '₹12,400',
    sub: '+18% vs last month',
    positive: true,
    icon: <IconCurrencyRupee size={20} stroke={1.5} />,
    bg: 'bg-[var(--color-amber-light)]',
    iconColor: 'text-[var(--color-amber)]',
  },
  {
    label: 'Bookings',
    value: '8',
    sub: '3 upcoming',
    positive: true,
    icon: <IconCalendarEvent size={20} stroke={1.5} />,
    bg: 'bg-[var(--color-success-bg)]',
    iconColor: 'text-[var(--color-success)]',
  },
  {
    label: 'Rating',
    value: '4.9',
    sub: '42 reviews',
    positive: true,
    icon: <IconStar size={20} stroke={1.5} />,
    bg: 'bg-[var(--color-amber-light)]',
    iconColor: 'text-[var(--color-amber)]',
  },
  {
    label: 'Response Rate',
    value: '98%',
    sub: 'Avg. 12 min reply',
    positive: true,
    icon: <IconTrendingUp size={20} stroke={1.5} />,
    bg: 'bg-[var(--color-success-bg)]',
    iconColor: 'text-[var(--color-success)]',
  },
]

const CHART_DATA = [
  { day: 'Mon', val: 42 },
  { day: 'Tue', val: 68 },
  { day: 'Wed', val: 53 },
  { day: 'Thu', val: 85 },
  { day: 'Fri', val: 60 },
  { day: 'Sat', val: 92 },
  { day: 'Sun', val: 74 },
]

function RequestCard({
  request,
  onAccept,
  onDecline,
}: {
  request: BookingRequest
  onAccept: () => void
  onDecline: () => void
}) {
  const isPending = request.status === 'pending'
  const statusVariant =
    request.status === 'pending'   ? 'warning' :
    request.status === 'confirmed' ? 'success' :
    request.status === 'completed' ? 'default' : 'error'

  return (
    <div className="bg-white rounded-[14px] border border-[var(--color-border)] p-4 hover:border-[var(--color-amber)] hover:shadow-[0_4px_16px_rgba(201,146,10,0.08)] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-amber-light)] flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-[var(--color-amber-dark)]">{request.userInitials}</span>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[var(--color-dark)]">{request.userName}</p>
            <p className="text-[12px] text-[var(--color-amber)] font-medium">{request.service}</p>
          </div>
        </div>
        <Badge variant={statusVariant} label={request.status.charAt(0).toUpperCase() + request.status.slice(1)} />
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-gray)]">
          <IconCalendarEvent size={12} stroke={1.5} className="text-[var(--color-amber)]" />
          <span>{request.date}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-gray)]">
          <IconClock size={12} stroke={1.5} className="text-[var(--color-amber)]" />
          <span>{request.time} · {request.duration}h</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-gray)] col-span-2">
          <IconMapPin size={12} stroke={1.5} className="text-[var(--color-amber)]" />
          <span>{request.location}</span>
        </div>
      </div>

      {request.note && (
        <div className="bg-[var(--color-gray-light)] rounded-[8px] px-3 py-2 mb-3">
          <p className="text-[11px] text-[var(--color-gray)] italic">"{request.note}"</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
        <p className="text-[14px] font-bold text-[var(--color-dark)]">₹{request.total.toLocaleString()}</p>
        {isPending && (
          <div className="flex items-center gap-2">
            <button
              onClick={onDecline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[var(--color-border)] text-[12px] font-medium text-[var(--color-gray)] hover:border-[var(--color-error)] hover:text-[var(--color-error)] transition-colors"
            >
              <IconX size={12} stroke={2} /> Decline
            </button>
            <button
              onClick={onAccept}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--color-amber)] text-[12px] font-medium text-white hover:opacity-90 transition-opacity"
            >
              <IconCheck size={12} stroke={2} /> Accept
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CompanionDashboard() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState(MOCK_REQUESTS)
  const [tab, setTab] = useState<'requests' | 'upcoming' | 'completed'>('requests')

  function accept(id: string) {
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'confirmed' as const } : r))
  }
  function decline(id: string) {
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'declined' as const } : r))
  }

  const pending   = requests.filter(r => r.status === 'pending')
  const tabList   =
    tab === 'requests'  ? requests.filter(r => r.status === 'pending') :
    tab === 'upcoming'  ? requests.filter(r => r.status === 'confirmed') :
                          requests.filter(r => r.status === 'completed')

  return (
    <div className="min-h-full bg-[var(--color-bg)]">

      {/* ── Header — gold on desktop, white on mobile ── */}
      <div className="relative overflow-hidden md:mb-0" style={{ background: 'var(--gradient-gold)' }}>
        {/* Decorative rings inside banner */}
        <div className="absolute -right-10 -top-10 w-[180px] h-[180px] rounded-full border border-white/20 hidden md:block" />
        <div className="absolute right-20 -bottom-8 w-[100px] h-[100px] rounded-full border border-white/15 hidden md:block" />
        <div className="absolute left-1/3 -top-6 w-[80px] h-[80px] rounded-full border border-white/10 hidden md:block" />

        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 py-4 md:py-5">
          <div className="flex items-center justify-between gap-4">
            {/* Avatar + info */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-[52px] h-[52px] md:w-[64px] md:h-[64px] rounded-full border-[3px] border-white/60 md:border-white shadow overflow-hidden bg-white/20 flex items-center justify-center">
                  <span className="text-[22px] md:text-[26px] font-bold text-white">A</span>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-[#4ade80] border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[17px] md:text-[21px] font-semibold text-white leading-none">Aanya's Dashboard</h1>
                  <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                    <span className="text-[10px] text-white font-semibold">Active</span>
                  </div>
                  {pending.length > 0 && (
                    <div className="hidden md:flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                      <span className="text-[10px] text-white font-semibold">{pending.length} new requests</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-white/70 mt-1 flex items-center gap-1">
                  <IconMapPin size={10} stroke={1.5} /> Bandra West · Mumbai
                </p>
              </div>
            </div>

            {/* Quick actions — white ghost buttons on desktop */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {[
                { label: 'Edit Profile',  icon: <IconEdit size={13} stroke={1.5} />,          onClick: () => {} },
                { label: 'Availability',  icon: <IconCalendarEvent size={13} stroke={1.5} />, onClick: () => navigate('/app/companion/onboarding') },
                { label: 'Service Area',  icon: <IconMapPin size={13} stroke={1.5} />,        onClick: () => {} },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={a.onClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/15 border border-white/30 text-[12px] font-medium text-white hover:bg-white/25 transition-colors backdrop-blur-sm"
                >
                  {a.icon}{a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10">

        {/* Mobile quick actions */}
        <div className="flex gap-2 my-3 md:hidden">
          {[
            { label: 'Edit Profile',  icon: <IconEdit size={13} stroke={1.5} />,          onClick: () => {} },
            { label: 'Availability',  icon: <IconCalendarEvent size={13} stroke={1.5} />, onClick: () => {} },
            { label: 'Service Area',  icon: <IconMapPin size={13} stroke={1.5} />,        onClick: () => {} },
          ].map(a => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="flex-1 flex items-center justify-center gap-1 h-8 rounded-[8px] bg-white border border-[var(--color-border)] text-[11px] font-medium text-[var(--color-dark)]"
            >
              {a.icon}{a.label}
            </button>
          ))}
        </div>

        {/* ── Two-column body ── */}
        <div className="grid md:grid-cols-[340px,1fr] lg:grid-cols-[380px,1fr] gap-6 pb-10">

          {/* ── Left: stats + earnings ── */}
          <div className="flex flex-col gap-4">

            {/* Stats 2×2 */}
            <div className="grid grid-cols-2 gap-3">
              {STATS.map(stat => (
                <div key={stat.label} className="bg-white rounded-[14px] border border-[var(--color-border)] p-4">
                  <div className={`w-9 h-9 rounded-[10px] ${stat.bg} flex items-center justify-center mb-3`}>
                    <span className={stat.iconColor}>{stat.icon}</span>
                  </div>
                  <p className="text-[20px] font-bold text-[var(--color-dark)] leading-none">{stat.value}</p>
                  <p className="text-[11px] text-[var(--color-gray)] mt-1">{stat.label}</p>
                  <p className={`text-[10px] mt-1 font-medium ${stat.positive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                    {stat.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Earnings chart */}
            <div className="bg-white rounded-[14px] border border-[var(--color-border)] p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold text-[var(--color-dark)]">Earnings Overview</h3>
                <span className="text-[11px] text-[var(--color-amber)] font-medium">This Week</span>
              </div>

              {/* Bar chart */}
              <div className="flex items-end gap-1.5 h-[80px] mb-3">
                {CHART_DATA.map(({ day, val }, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-[4px] transition-all"
                      style={{
                        height: `${val}%`,
                        background: i === 5 ? 'var(--gradient-gold)' : 'var(--color-amber-light)',
                      }}
                    />
                    <span className="text-[9px] text-[var(--color-gray)]">{day.slice(0, 1)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                <div>
                  <p className="text-[10px] text-[var(--color-gray)]">Total earned</p>
                  <p className="text-[16px] font-bold text-[var(--color-dark)]">₹12,400</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[var(--color-gray)]">Pending payout</p>
                  <p className="text-[16px] font-bold text-[var(--color-dark)]">₹4,800</p>
                </div>
              </div>
            </div>

            {/* Profile strength card */}
            <div className="bg-white rounded-[14px] border border-[var(--color-border)] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[var(--color-dark)]">Profile Strength</h3>
                <span className="text-[11px] text-[var(--color-amber)] font-medium">72%</span>
              </div>
              <div className="h-1.5 bg-[var(--color-gray-light)] rounded-full mb-3 overflow-hidden">
                <div className="h-full rounded-full w-[72%]" style={{ background: 'var(--gradient-gold)' }} />
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Add more photos',    done: false, icon: <IconUsers size={12} stroke={1.5} /> },
                  { label: 'Verify your ID',     done: false, icon: <IconShieldCheck size={12} stroke={1.5} /> },
                  { label: 'Set your schedule',  done: true,  icon: <IconCalendarEvent size={12} stroke={1.5} /> },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.done ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' : 'bg-[var(--color-gray-light)] text-[var(--color-gray)]'
                    }`}>
                      {item.done ? <IconCheck size={10} stroke={2.5} /> : item.icon}
                    </div>
                    <span className={`text-[12px] ${item.done ? 'line-through text-[var(--color-gray)]' : 'text-[var(--color-dark)]'}`}>
                      {item.label}
                    </span>
                    {!item.done && (
                      <IconArrowUpRight size={12} stroke={1.5} className="text-[var(--color-amber)] ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right: booking requests ── */}
          <div className="flex flex-col gap-4">

            {/* Tabs */}
            <div className="bg-white rounded-[14px] border border-[var(--color-border)] overflow-hidden">
              <div className="flex border-b border-[var(--color-border)]">
                {([
                  { key: 'requests',  label: 'Requests',  count: requests.filter(r => r.status === 'pending').length },
                  { key: 'upcoming',  label: 'Upcoming',  count: requests.filter(r => r.status === 'confirmed').length },
                  { key: 'completed', label: 'Completed', count: requests.filter(r => r.status === 'completed').length },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex-1 py-3.5 text-[13px] font-medium border-b-2 transition-colors ${
                      tab === t.key
                        ? 'text-[var(--color-amber)] border-[var(--color-amber)]'
                        : 'text-[var(--color-gray)] border-transparent hover:text-[var(--color-dark)]'
                    }`}
                  >
                    {t.label}
                    {t.count > 0 && (
                      <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                        tab === t.key ? 'bg-[var(--color-amber)] text-white' : 'bg-[var(--color-gray-light)] text-[var(--color-gray)]'
                      }`}>
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Request list */}
              <div className="p-4">
                {tabList.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="w-14 h-14 rounded-full bg-[var(--color-gray-light)] flex items-center justify-center mx-auto mb-3">
                      <IconCalendarEvent size={24} stroke={1.2} className="text-[var(--color-gray)]" />
                    </div>
                    <p className="text-[14px] font-medium text-[var(--color-dark)]">No {tab}</p>
                    <p className="text-[12px] text-[var(--color-gray)] mt-1">
                      {tab === 'requests' ? 'New booking requests will appear here' : 'Your bookings will appear here'}
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-1 xl:grid-cols-2 gap-3">
                    {tabList.map(request => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        onAccept={() => accept(request.id)}
                        onDecline={() => decline(request.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
