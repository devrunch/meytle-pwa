import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconTrendingUp, IconCalendarEvent, IconStar, IconCurrencyRupee,
  IconCheck, IconX, IconClock, IconMapPin,
  IconEdit, IconUsers, IconShieldCheck, IconArrowUpRight,
} from '@tabler/icons-react'
import { Badge } from '../../components/ui'
import { api } from '../../lib/api'

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

interface ApiBooking {
  id: string
  serviceType: string
  status: BookingStatus
  bookedStart: string
  bookedEnd: string
  bookedDurationMinutes: number
  meetingSpotText: string | null
  amountPaisa: number
  customNote: string | null
  isCustomRequest: boolean
  user: { id: string; fullName: string; avatarUrl: string | null }
}

interface BookingRequest {
  id: string
  userName: string
  userInitials: string
  service: string
  date: string
  time: string
  endTime: string
  duration: number
  location: string
  status: BookingStatus
  total: number
  note: string | null
  isCustom: boolean
}

const SERVICE_LABELS: Record<string, string> = {
  coffee: 'Coffee Dates', dining: 'Fine Dining', concert: 'Concerts',
  travel: 'Travel', fitness: 'Fitness', culture: 'Cultural Events',
  nature: 'Nature Walks', movies: 'Movies', shopping: 'Shopping', gaming: 'Gaming',
}

function toRequest(b: ApiBooking): BookingRequest {
  const start = new Date(b.bookedStart)
  const end = new Date(b.bookedEnd)
  const name = b.user?.fullName ?? 'User'
  return {
    id: b.id,
    userName: name,
    userInitials: name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
    service: SERVICE_LABELS[b.serviceType] ?? b.serviceType,
    date: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    endTime: end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    duration: Math.round(b.bookedDurationMinutes / 60),
    location: b.meetingSpotText ?? '—',
    status: b.status,
    total: Math.round(b.amountPaisa / 100),
    note: b.customNote,
    isCustom: b.isCustomRequest,
  }
}

const STATS_CONFIG = [
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

// ── Mobile Tinder-style swipeable card (pending only) ───────────────────────

function SwipeCard({
  request,
  stackSize,
  onAccept,
  onDecline,
  onView,
}: {
  request: BookingRequest
  stackSize: number
  onAccept: () => void
  onDecline: () => void
  onView: () => void
}) {
  const [dragX, setDragX] = useState(0)
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null)
  const dragging = useRef(false)
  const startX = useRef(0)

  function touchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    dragging.current = true
  }
  function touchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    setDragX(e.touches[0].clientX - startX.current)
  }
  function touchEnd() {
    dragging.current = false
    if (dragX > 80) triggerAccept()
    else if (dragX < -80) triggerDecline()
    else setDragX(0)
  }

  function triggerAccept() {
    setExiting('right')
    setTimeout(() => { onAccept(); setDragX(0); setExiting(null) }, 280)
  }
  function triggerDecline() {
    setExiting('left')
    setTimeout(() => { onDecline(); setDragX(0); setExiting(null) }, 280)
  }

  const dx = exiting === 'right' ? 420 : exiting === 'left' ? -420 : dragX
  const rotate = dx * 0.055
  const acceptAlpha = Math.max(0, Math.min(dx / 70, 1))
  const declineAlpha = Math.max(0, Math.min(-dx / 70, 1))
  const isMoving = dragging.current || !!exiting

  return (
    <div className="relative w-full" style={{ minHeight: 340 }}>
      {stackSize > 2 && (
        <div className="absolute inset-x-3 bottom-0 h-full rounded-[22px] bg-[var(--color-border)] scale-[0.93] origin-bottom" style={{ zIndex: 0 }} />
      )}
      {stackSize > 1 && (
        <div className="absolute inset-x-1.5 bottom-0 h-full rounded-[22px] bg-white border border-[var(--color-border)] scale-[0.96] origin-bottom shadow-sm" style={{ zIndex: 1 }} />
      )}

      <div
        className="relative w-full rounded-[22px] bg-white border border-[var(--color-border)] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.1)] select-none"
        style={{
          zIndex: 2,
          transform: `translateX(${dx}px) rotate(${rotate}deg)`,
          transition: isMoving ? (exiting ? 'transform 0.28s ease' : 'none') : 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
          transformOrigin: '50% 90%',
        }}
        onTouchStart={touchStart}
        onTouchMove={touchMove}
        onTouchEnd={touchEnd}
      >
        <div
          className="absolute inset-0 z-10 flex items-start justify-start p-5 pointer-events-none rounded-[22px]"
          style={{ opacity: acceptAlpha, background: 'rgba(34,197,94,0.12)' }}
        >
          <div className="border-4 border-[#22c55e] rounded-[10px] px-3 py-1.5 -rotate-12">
            <span className="text-[#22c55e] font-black text-[18px] tracking-widest">ACCEPT</span>
          </div>
        </div>
        <div
          className="absolute inset-0 z-10 flex items-start justify-end p-5 pointer-events-none rounded-[22px]"
          style={{ opacity: declineAlpha, background: 'rgba(239,68,68,0.12)' }}
        >
          <div className="border-4 border-[#ef4444] rounded-[10px] px-3 py-1.5 rotate-12">
            <span className="text-[#ef4444] font-black text-[18px] tracking-widest">DECLINE</span>
          </div>
        </div>

        <div className="h-[88px] relative" style={{ background: 'linear-gradient(135deg, #FFF3CC 0%, #FFE066 100%)' }}>
          <div className="absolute -bottom-8 left-4 w-[64px] h-[64px] rounded-full bg-white shadow-[0_4px_16px_rgba(0,212,170,0.25)] border-4 border-white flex items-center justify-center">
            <span className="text-[20px] font-black text-[var(--color-amber-dark)]">{request.userInitials}</span>
          </div>
        </div>

        <div className="pt-12 px-4 pb-3">
          <div className="flex items-start justify-between mb-1">
            <p className="text-[20px] font-bold text-[var(--color-dark)] leading-tight">{request.userName}</p>
            <div className="text-right flex-shrink-0 ml-2">
              <p className="text-[19px] font-bold text-[var(--color-dark)]">₹{request.total.toLocaleString()}</p>
              <p className="text-[10px] text-[var(--color-gray)]">{request.duration}h session</p>
            </div>
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--color-amber-light)] text-[11px] font-semibold text-[var(--color-amber-dark)] mb-3">
            {request.service}
          </span>

          <div className="flex flex-col gap-1.5 mb-3">
            <div className="flex items-center gap-2 text-[13px] text-[var(--color-gray)]">
              <IconCalendarEvent size={13} stroke={1.5} className="text-[var(--color-amber)] flex-none" />
              <span>{request.date} · {request.time}–{request.endTime}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[var(--color-gray)]">
              <IconMapPin size={13} stroke={1.5} className="text-[var(--color-amber)] flex-none" />
              <span className="truncate">{request.location}</span>
            </div>
          </div>

          {request.note && (
            <div className="bg-[var(--color-gray-light)] rounded-[10px] px-3 py-2 mb-3">
              <p className="text-[12px] text-[var(--color-gray)] italic">"{request.note}"</p>
            </div>
          )}

          <button onClick={onView} className="w-full text-center text-[12px] text-[var(--color-amber)] font-medium py-1 mb-1">
            View full details →
          </button>

          <div className="flex gap-3 pt-2 border-t border-[var(--color-border)]">
            <button
              onClick={triggerDecline}
              className="flex-1 h-13 rounded-[14px] border-2 border-red-200 bg-red-50 text-red-500 text-[14px] font-bold flex items-center justify-center gap-2"
              style={{ height: 52 }}
            >
              <IconX size={18} stroke={2.5} /> Decline
            </button>
            <button
              onClick={triggerAccept}
              className="flex-1 h-13 rounded-[14px] bg-[var(--color-amber)] text-white text-[14px] font-bold flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,212,170,0.4)]"
              style={{ height: 52 }}
            >
              <IconCheck size={18} stroke={2.5} /> Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Desktop / non-pending list card ─────────────────────────────────────────

const STATUS_VARIANT: Record<BookingStatus, 'warning' | 'success' | 'default' | 'error'> = {
  pending: 'warning',
  confirmed: 'success',
  in_progress: 'success',
  completed: 'default',
  cancelled: 'error',
}

function RequestCard({
  request,
  onAccept,
  onDecline,
  onView,
}: {
  request: BookingRequest
  onAccept: () => void
  onDecline: () => void
  onView: () => void
}) {
  const isPending = request.status === 'pending'
  const statusLabel = request.status === 'in_progress' ? 'In Progress'
    : request.status.charAt(0).toUpperCase() + request.status.slice(1)

  return (
    <div
      onClick={onView}
      className="group bg-white rounded-[16px] border border-[var(--color-border)] overflow-hidden hover:border-[var(--color-amber)] hover:shadow-[0_4px_20px_rgba(201,146,10,0.1)] transition-all cursor-pointer"
    >
      <div className="h-1.5 w-full" style={{ background: isPending ? 'var(--gradient-gold)' : 'var(--color-gray-light)' }} />

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-[var(--color-amber-light)] flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
            <span className="text-[13px] font-black text-[var(--color-amber-dark)]">{request.userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[var(--color-dark)] leading-tight">{request.userName}</p>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-[var(--color-amber-light)] text-[10px] font-semibold text-[var(--color-amber-dark)]">
              {request.service}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={STATUS_VARIANT[request.status]} label={statusLabel} />
            <p className="text-[14px] font-bold text-[var(--color-dark)]">₹{request.total.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mb-3">
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-gray)]">
            <IconCalendarEvent size={12} stroke={1.5} className="text-[var(--color-amber)] flex-none" />
            <span>{request.date} · {request.time}–{request.endTime}</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-gray)]">
            <IconClock size={12} stroke={1.5} className="text-[var(--color-amber)] flex-none" />
            <span>{request.duration} hour{request.duration > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-gray)]">
            <IconMapPin size={12} stroke={1.5} className="text-[var(--color-amber)] flex-none" />
            <span className="truncate">{request.location}</span>
          </div>
        </div>

        {request.note && (
          <div className="bg-[var(--color-gray-light)] rounded-[8px] px-3 py-2 mb-3">
            <p className="text-[11px] text-[var(--color-gray)] italic">"{request.note}"</p>
          </div>
        )}

        {isPending && (
          <div className="flex gap-2 pt-3 border-t border-[var(--color-border)]" onClick={e => e.stopPropagation()}>
            <button
              onClick={onDecline}
              className="flex-1 h-9 rounded-[10px] border border-red-200 bg-red-50 text-red-500 text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-red-100 transition-colors"
            >
              <IconX size={13} stroke={2.5} /> Decline
            </button>
            <button
              onClick={onAccept}
              className="flex-1 h-9 rounded-[10px] bg-[var(--color-amber)] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity shadow-[0_2px_8px_rgba(0,212,170,0.35)]"
            >
              <IconCheck size={13} stroke={2.5} /> Accept
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CompanionDashboard() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [companionName, setCompanionName] = useState('')
  const [companionAvatar, setCompanionAvatar] = useState<string | null>(null)
  const [tab, setTab] = useState<'requests' | 'upcoming' | 'completed'>('requests')

  useEffect(() => {
    Promise.all([
      api.get<ApiBooking[]>('/bookings/companion'),
      api.get<{ displayName: string; profilePhotoUrl: string | null }>('/companions/me/profile'),
    ]).then(([bookingsRes, profileRes]) => {
      setRequests(bookingsRes.data.map(toRequest))
      setCompanionName(profileRes.data.displayName)
      setCompanionAvatar(profileRes.data.profilePhotoUrl)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function accept(id: string) {
    try {
      await api.patch(`/bookings/${id}/accept`)
      setRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'confirmed' as const } : r))
    } catch {}
  }

  async function decline(id: string) {
    try {
      await api.patch(`/bookings/${id}/decline`)
      setRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'cancelled' as const } : r))
    } catch {}
  }

  const pending = requests.filter(r => r.status === 'pending')
  const tabList =
    tab === 'requests'  ? requests.filter(r => r.status === 'pending') :
    tab === 'upcoming'  ? requests.filter(r => r.status === 'confirmed' || r.status === 'in_progress') :
                          requests.filter(r => r.status === 'completed')

  const nameInitial = companionName ? companionName[0].toUpperCase() : '?'
  const displayName = companionName ? `${companionName}'s Dashboard` : 'Dashboard'

  const bookingsCount = requests.filter(r => r.status === 'confirmed' || r.status === 'in_progress').length
  const statsWithCounts = [
    ...STATS_CONFIG.slice(0, 1),
    {
      label: 'Bookings',
      value: String(requests.length || '—'),
      sub: `${bookingsCount} upcoming`,
      positive: true,
      icon: <IconCalendarEvent size={20} stroke={1.5} />,
      bg: 'bg-[var(--color-success-bg)]',
      iconColor: 'text-[var(--color-success)]',
    },
    ...STATS_CONFIG.slice(1),
  ]

  return (
    <div className="min-h-full bg-[var(--color-bg)]">

      {/* ── Header ── */}
      <div className="relative overflow-hidden md:mb-0" style={{ background: 'var(--gradient-gold)' }}>
        <div className="absolute -right-10 -top-10 w-[180px] h-[180px] rounded-full border border-white/20 hidden md:block" />
        <div className="absolute right-20 -bottom-8 w-[100px] h-[100px] rounded-full border border-white/15 hidden md:block" />
        <div className="absolute left-1/3 -top-6 w-[80px] h-[80px] rounded-full border border-white/10 hidden md:block" />

        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 py-4 md:py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-[52px] h-[52px] md:w-[64px] md:h-[64px] rounded-full border-[3px] border-white/60 md:border-white shadow overflow-hidden bg-white/20 flex items-center justify-center">
                  {companionAvatar
                    ? <img src={companionAvatar} alt={companionName} className="w-full h-full object-cover" />
                    : <span className="text-[22px] md:text-[26px] font-bold text-white">{nameInitial}</span>
                  }
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-[#4ade80] border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[17px] md:text-[21px] font-semibold text-white leading-none">{displayName}</h1>
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
                  <IconMapPin size={10} stroke={1.5} /> Delhi NCR
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {[
                { label: 'Edit Profile',  icon: <IconEdit size={13} stroke={1.5} />,          onClick: () => navigate('/app/companion/account') },
                { label: 'Availability',  icon: <IconCalendarEvent size={13} stroke={1.5} />, onClick: () => navigate('/app/companion/account') },
                { label: 'Payouts',       icon: <IconCurrencyRupee size={13} stroke={1.5} />, onClick: () => navigate('/app/companion/account#payouts') },
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

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 py-4">

        <div className="flex gap-2 my-3 md:hidden">
          {[
            { label: 'Edit Profile',  icon: <IconEdit size={13} stroke={1.5} />,          onClick: () => navigate('/app/companion/account') },
            { label: 'Availability',  icon: <IconCalendarEvent size={13} stroke={1.5} />, onClick: () => navigate('/app/companion/account') },
            { label: 'Payouts',       icon: <IconCurrencyRupee size={13} stroke={1.5} />, onClick: () => navigate('/app/companion/account') },
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

            <div className="grid grid-cols-2 gap-3">
              {statsWithCounts.map(stat => (
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

            <div className="bg-white rounded-[14px] border border-[var(--color-border)] p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold text-[var(--color-dark)]">Earnings Overview</h3>
                <span className="text-[11px] text-[var(--color-amber)] font-medium">This Week</span>
              </div>

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

            <div className="bg-white rounded-[14px] border border-[var(--color-border)] overflow-hidden">
              <div className="flex border-b border-[var(--color-border)]">
                {([
                  { key: 'requests',  label: 'Requests',  count: requests.filter(r => r.status === 'pending').length },
                  { key: 'upcoming',  label: 'Upcoming',  count: requests.filter(r => r.status === 'confirmed' || r.status === 'in_progress').length },
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

              <div className="p-4">
                {loading ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-[120px] rounded-[14px] bg-[var(--color-gray-light)] animate-pulse" />
                    ))}
                  </div>
                ) : tabList.length === 0 ? (
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
                  <>
                    {tab === 'requests' && (
                      <div className="md:hidden flex flex-col items-center gap-3">
                        <p className="text-[12px] text-[var(--color-gray)]">
                          {tabList.length} pending request{tabList.length !== 1 ? 's' : ''} · swipe to respond
                        </p>
                        <SwipeCard
                          key={tabList[0].id}
                          request={tabList[0]}
                          stackSize={tabList.length}
                          onAccept={() => accept(tabList[0].id)}
                          onDecline={() => decline(tabList[0].id)}
                          onView={() => navigate(`/app/companion/bookings/${tabList[0].id}`)}
                        />
                      </div>
                    )}

                    <div className={`grid md:grid-cols-1 xl:grid-cols-2 gap-3 ${tab === 'requests' ? 'hidden md:grid' : ''}`}>
                      {tabList.map(request => (
                        <RequestCard
                          key={request.id}
                          request={request}
                          onAccept={() => accept(request.id)}
                          onDecline={() => decline(request.id)}
                          onView={() => navigate(`/app/companion/bookings/${request.id}`)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
