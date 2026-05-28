import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconCalendarEvent, IconClock, IconMapPin, IconChevronRight,
  IconCircleCheck, IconLoader, IconWallet, IconCalendarOff,
} from '@tabler/icons-react'
import { Avatar, Badge, EmptyState } from '../../components/ui'
import { api } from '../../lib/api'

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

interface ApiBooking {
  id: string
  serviceType: string
  bookedStart: string
  bookedEnd: string
  bookedDurationMinutes: number
  meetingSpotText: string
  status: BookingStatus
  amountPaisa: number
  companion?: {
    id: string
    displayName: string
    profilePhotoUrl: string
  }
}

interface Booking {
  id: string
  companionName: string
  companionInitials: string
  companionAvatar?: string
  service: string
  date: string
  time: string
  duration: number
  location: string
  status: BookingStatus
  total: number
}

function toBooking(b: ApiBooking): Booking {
  const start = new Date(b.bookedStart)
  const name = b.companion?.displayName ?? 'Companion'
  const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  return {
    id: b.id,
    companionName: name,
    companionInitials: initials,
    companionAvatar: b.companion?.profilePhotoUrl,
    service: b.serviceType,
    date: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    duration: Math.round(b.bookedDurationMinutes / 60),
    location: b.meetingSpotText ?? '—',
    status: b.status,
    total: Math.round(b.amountPaisa / 100),
  }
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; variant: 'success' | 'warning' | 'default' | 'error' }> = {
  pending:     { label: 'Pending',     variant: 'warning' },
  confirmed:   { label: 'Confirmed',   variant: 'success' },
  in_progress: { label: 'In Progress', variant: 'success' },
  completed:   { label: 'Completed',   variant: 'default' },
  cancelled:   { label: 'Cancelled',   variant: 'error'   },
}

function BookingCard({ booking, onClick }: { booking: Booking; onClick: () => void }) {
  const cfg = STATUS_CONFIG[booking.status]
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-[16px] border border-[var(--color-border)] p-4 text-left hover:border-[var(--color-amber)] hover:shadow-[0_4px_20px_rgba(201,146,10,0.10)] transition-all"
    >
      <div className="flex items-start gap-3 mb-3">
        <Avatar src={booking.companionAvatar} initials={booking.companionInitials} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14px] font-semibold text-[var(--color-dark)] truncate">{booking.companionName}</p>
            <Badge variant={cfg.variant} label={cfg.label} />
          </div>
          <p className="text-[12px] text-[var(--color-amber)] font-medium mt-0.5">{booking.service}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex items-center gap-2 text-[12px] text-[var(--color-gray)]">
          <IconCalendarEvent size={13} stroke={1.5} className="text-[var(--color-amber)] flex-shrink-0" />
          <span>{booking.date} at {booking.time}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[var(--color-gray)]">
          <IconClock size={13} stroke={1.5} className="text-[var(--color-amber)] flex-shrink-0" />
          <span>{booking.duration} {booking.duration === 1 ? 'hour' : 'hours'}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[var(--color-gray)]">
          <IconMapPin size={13} stroke={1.5} className="text-[var(--color-amber)] flex-shrink-0" />
          <span className="truncate">{booking.location}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
        <p className="text-[14px] font-bold text-[var(--color-dark)]">₹{booking.total.toLocaleString()}</p>
        <div className="flex items-center gap-1 text-[12px] text-[var(--color-amber)] font-medium">
          View details <IconChevronRight size={13} stroke={2} />
        </div>
      </div>
    </button>
  )
}

export default function BookingsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ApiBooking[]>('/bookings')
      .then(res => setBookings(res.data.map(toBooking)))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [])

  const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed' || b.status === 'in_progress')
  const past     = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled')
  const current  = tab === 'upcoming' ? upcoming : past

  const totalSpent = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.total, 0)

  return (
    <div className="min-h-full bg-[var(--color-bg)]">

      {/* ── Page header ── */}
      <div className="bg-white border-b border-[var(--color-border)] px-4 md:px-6 lg:px-10 pt-5 pb-0">
        <div className="max-w-[1280px] mx-auto">
          <h1 className="text-[20px] font-semibold text-[var(--color-dark)] mb-4">My Bookings</h1>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Total Bookings', value: loading ? '—' : bookings.length,                                         icon: <IconCalendarEvent size={16} stroke={1.5} color="var(--color-amber)" /> },
              { label: 'Upcoming',       value: loading ? '—' : upcoming.length,                                         icon: <IconLoader size={16} stroke={1.5} color="var(--color-amber)" /> },
              { label: 'Completed',      value: loading ? '—' : past.filter(b => b.status === 'completed').length,       icon: <IconCircleCheck size={16} stroke={1.5} color="var(--color-success)" /> },
              { label: 'Total Spent',    value: loading ? '—' : `₹${totalSpent.toLocaleString()}`,                       icon: <IconWallet size={16} stroke={1.5} color="var(--color-amber)" /> },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-3 bg-[var(--color-gray-light)] rounded-[12px] px-3.5 py-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[var(--color-dark)] leading-none">{stat.value}</p>
                  <p className="text-[10px] text-[var(--color-gray)] mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex">
            {(['upcoming', 'past'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 pb-3 text-[13px] font-medium border-b-2 transition-colors capitalize ${
                  tab === t
                    ? 'text-[var(--color-amber)] border-[var(--color-amber)]'
                    : 'text-[var(--color-gray)] border-transparent hover:text-[var(--color-dark)]'
                }`}
              >
                {t === 'upcoming' ? 'Upcoming' : 'Past'} ({loading ? '…' : t === 'upcoming' ? upcoming.length : past.length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Booking list ── */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 py-5">
        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[16px] bg-white border border-[var(--color-border)] animate-pulse h-[200px]" />
            ))}
          </div>
        ) : current.length === 0 ? (
          <EmptyState
            icon={<IconCalendarOff size={28} stroke={1.2} />}
            title="No bookings yet"
            body="Browse companions and book your first experience"
            action={{ label: 'Discover companions', onClick: () => navigate('/app') }}
          />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {current.map(booking => (
              <BookingCard key={booking.id} booking={booking} onClick={() => navigate(`/app/bookings/${booking.id}`)} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
