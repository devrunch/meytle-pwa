import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconCalendarEvent, IconClock, IconMapPin, IconChevronRight,
  IconCircleCheck, IconLoader, IconWallet,
} from '@tabler/icons-react'
import { Avatar, Badge } from '../../components/ui'

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

interface Booking {
  id: string
  companionId: string
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

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    companionId: '1',
    companionName: 'Aanya',
    companionInitials: 'A',
    companionAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    service: 'Coffee Date',
    date: 'May 17, 2026',
    time: '10:00 AM',
    duration: 2,
    location: 'Bandra West, Mumbai',
    status: 'confirmed',
    total: 1600,
  },
  {
    id: 'b2',
    companionId: '4',
    companionName: 'Kabir',
    companionInitials: 'K',
    companionAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    service: 'Fine Dining',
    date: 'May 18, 2026',
    time: '7:00 PM',
    duration: 3,
    location: 'Lower Parel, Mumbai',
    status: 'pending',
    total: 3900,
  },
  {
    id: 'b3',
    companionId: '3',
    companionName: 'Priya',
    companionInitials: 'P',
    companionAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    service: 'Fitness Session',
    date: 'May 10, 2026',
    time: '7:00 AM',
    duration: 2,
    location: 'Juhu, Mumbai',
    status: 'completed',
    total: 1900,
  },
  {
    id: 'b4',
    companionId: '6',
    companionName: 'Arjun',
    companionInitials: 'Ar',
    companionAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    service: 'Concert',
    date: 'May 5, 2026',
    time: '6:00 PM',
    duration: 4,
    location: 'Lower Parel, Mumbai',
    status: 'cancelled',
    total: 4400,
  },
]

const STATUS_CONFIG: Record<BookingStatus, { label: string; variant: 'success' | 'warning' | 'default' | 'error' }> = {
  pending:   { label: 'Pending',   variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'error'   },
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

  const upcoming = MOCK_BOOKINGS.filter(b => b.status === 'pending' || b.status === 'confirmed')
  const past     = MOCK_BOOKINGS.filter(b => b.status === 'completed' || b.status === 'cancelled')
  const current  = tab === 'upcoming' ? upcoming : past

  const totalSpent = MOCK_BOOKINGS
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
              { label: 'Total Bookings',  value: MOCK_BOOKINGS.length,                                           icon: <IconCalendarEvent size={16} stroke={1.5} color="var(--color-amber)" /> },
              { label: 'Upcoming',        value: upcoming.length,                                                icon: <IconLoader size={16} stroke={1.5} color="var(--color-amber)" /> },
              { label: 'Completed',       value: past.filter(b => b.status === 'completed').length,             icon: <IconCircleCheck size={16} stroke={1.5} color="var(--color-success)" /> },
              { label: 'Total Spent',     value: `₹${totalSpent.toLocaleString()}`,                             icon: <IconWallet size={16} stroke={1.5} color="var(--color-amber)" /> },
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
                {t === 'upcoming' ? 'Upcoming' : 'Past'} ({t === 'upcoming' ? upcoming.length : past.length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Booking list ── */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 py-5">
        {current.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-gray-light)] flex items-center justify-center mx-auto mb-4">
              <IconCalendarEvent size={28} stroke={1.2} className="text-[var(--color-gray)]" />
            </div>
            <p className="text-[15px] font-medium text-[var(--color-dark)]">No bookings yet</p>
            <p className="text-[13px] text-[var(--color-gray)] mt-1">Find a companion and plan your next experience</p>
            <button
              onClick={() => navigate('/app')}
              className="mt-5 px-6 py-2.5 btn-gradient-gold rounded-full text-[13px] font-medium text-white"
            >
              Explore companions
            </button>
          </div>
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
