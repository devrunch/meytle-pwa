import { useParams, useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconCalendarEvent, IconClock, IconMapPin,
  IconCurrencyRupee, IconMessageCircle, IconCheck, IconX,
  IconUser, IconShieldCheck, IconStar,
} from '@tabler/icons-react'
import { Avatar } from '../../components/ui'
import LocationPickerMap from '../../components/ui/LocationPickerMap'

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
  endTime: string
  duration: number
  location: string
  locationCoords?: { lng: number; lat: number }
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
    endTime: '12:00 PM',
    duration: 2,
    location: 'Bandra West, Mumbai',
    locationCoords: { lng: 72.8347, lat: 19.0596 },
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
    endTime: '10:00 PM',
    duration: 3,
    location: 'Lower Parel, Mumbai',
    locationCoords: { lng: 72.8332, lat: 19.0176 },
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
    endTime: '9:00 AM',
    duration: 2,
    location: 'Juhu, Mumbai',
    locationCoords: { lng: 72.8264, lat: 19.0948 },
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
    endTime: '10:00 PM',
    duration: 4,
    location: 'Lower Parel, Mumbai',
    locationCoords: { lng: 72.8332, lat: 19.0176 },
    status: 'cancelled',
    total: 4400,
  },
]

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string }> = {
  pending:   { label: 'Awaiting confirmation', bg: 'bg-yellow-50 border-yellow-200',   text: 'text-yellow-700' },
  confirmed: { label: 'Confirmed',              bg: 'bg-[var(--color-success-bg)] border-[var(--color-success)]/30', text: 'text-[var(--color-success)]' },
  completed: { label: 'Completed',              bg: 'bg-[var(--color-gray-light)] border-[var(--color-border)]',     text: 'text-[var(--color-gray)]' },
  cancelled: { label: 'Cancelled',              bg: 'bg-[var(--color-error-bg)] border-[var(--color-error)]/30',     text: 'text-[var(--color-error)]' },
}

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()

  const booking = MOCK_BOOKINGS.find(b => b.id === bookingId)

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-[14px] text-[var(--color-gray)]">Booking not found</p>
        <button onClick={() => navigate(-1)} className="text-[var(--color-amber)] text-[13px]">Go back</button>
      </div>
    )
  }

  const status = STATUS_CONFIG[booking.status]
  const isConfirmed = booking.status === 'confirmed'
  const isPending = booking.status === 'pending'
  const isCompleted = booking.status === 'completed'

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">

      {/* Header */}
      <div className="bg-white border-b border-[var(--color-border)] sticky top-0 z-20">
        <div className="max-w-[760px] mx-auto px-4 md:px-6 h-[52px] flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-[8px] hover:bg-[var(--color-gray-light)] flex items-center justify-center transition-colors"
          >
            <IconArrowLeft size={18} stroke={1.5} className="text-[var(--color-dark)]" />
          </button>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-[var(--color-dark)] leading-none">Booking Details</p>
            <p className="text-[11px] text-[var(--color-gray)] mt-0.5">{booking.service} · {booking.date}</p>
          </div>
          <div className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold ${status.bg} ${status.text}`}>
            {status.label}
          </div>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto px-4 md:px-6 py-5 flex flex-col gap-4">

        {/* Companion card */}
        <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-4 flex items-center gap-4">
          <Avatar src={booking.companionAvatar} initials={booking.companionInitials} size="xl" />
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-semibold text-[var(--color-dark)]">{booking.companionName}</p>
            <p className="text-[12px] text-[var(--color-gray)]">Booking #{booking.id.toUpperCase()}</p>
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map(i => (
                <IconStar key={i} size={11} stroke={1.5} className={i <= 4 ? 'text-[var(--color-amber)] fill-[var(--color-amber)]' : 'text-[var(--color-border)]'} />
              ))}
              <span className="text-[10px] text-[var(--color-gray)] ml-1">4.9</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            <button
              onClick={() => navigate(`/companions/${booking.companionId}`)}
              className="px-3 py-1.5 rounded-[10px] border border-[var(--color-border)] text-[12px] font-medium text-[var(--color-dark)] hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] transition-colors"
            >
              <IconUser size={12} stroke={1.5} className="inline mr-1" />
              Profile
            </button>
            {isConfirmed && (
              <button
                onClick={() => navigate('/app/messages')}
                className="px-3 py-1.5 rounded-[10px] bg-[var(--color-amber)] text-[12px] font-medium text-white hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <IconMessageCircle size={12} stroke={1.5} />
                Message
              </button>
            )}
          </div>
        </div>

        {/* Booking info */}
        <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <IconCalendarEvent size={14} stroke={1.5} className="text-[var(--color-amber)]" />
            <p className="text-[13px] font-semibold text-[var(--color-dark)]">Booking Info</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: <IconUser size={13} stroke={1.5} />,          label: 'Service',   value: booking.service },
              { icon: <IconCalendarEvent size={13} stroke={1.5} />, label: 'Date',      value: booking.date },
              { icon: <IconClock size={13} stroke={1.5} />,         label: 'Time',      value: `${booking.time} – ${booking.endTime}` },
              { icon: <IconClock size={13} stroke={1.5} />,         label: 'Duration',  value: `${booking.duration} hour${booking.duration > 1 ? 's' : ''}` },
              { icon: <IconCurrencyRupee size={13} stroke={1.5} />, label: 'You paid',  value: `₹${booking.total.toLocaleString()}` },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-2.5 bg-[var(--color-bg)] rounded-[10px] px-3 py-2.5">
                <span className="text-[var(--color-amber)] flex-none">{row.icon}</span>
                <div>
                  <p className="text-[10px] text-[var(--color-gray)] uppercase tracking-wide">{row.label}</p>
                  <p className="text-[13px] font-semibold text-[var(--color-dark)]">{row.value}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2.5 bg-[var(--color-amber-light)] rounded-[10px] px-3 py-2.5">
              <IconCurrencyRupee size={13} stroke={1.5} className="text-[var(--color-amber)] flex-none" />
              <div>
                <p className="text-[10px] text-[var(--color-amber)] uppercase tracking-wide font-medium">Total</p>
                <p className="text-[13px] font-bold text-[var(--color-amber-dark)]">₹{booking.total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Meeting location */}
        {(isConfirmed || isCompleted) && (
          <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <IconMapPin size={14} stroke={1.5} className="text-[var(--color-amber)]" />
              <p className="text-[13px] font-semibold text-[var(--color-dark)]">Meeting Spot</p>
            </div>
            <p className="text-[12px] text-[var(--color-gray)] mb-3">{booking.location}</p>

            {booking.locationCoords ? (
              <LocationPickerMap
                centerLng={booking.locationCoords.lng}
                centerLat={booking.locationCoords.lat}
                radiusKm={0.5}
                selected={booking.locationCoords}
                onSelect={() => {}}
              />
            ) : (
              <div className="h-[120px] rounded-[12px] bg-[var(--color-gray-light)] flex items-center justify-center">
                <p className="text-[12px] text-[var(--color-gray)]">Address only — no pin set</p>
              </div>
            )}
          </div>
        )}

        {/* Status banners */}
        {isPending && (
          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-[12px] px-4 py-3">
            <IconClock size={15} stroke={1.5} className="text-yellow-600 flex-none mt-0.5" />
            <div>
              <p className="text-[12px] font-semibold text-yellow-700">Waiting for confirmation</p>
              <p className="text-[11px] text-yellow-600 mt-0.5">
                {booking.companionName} will review your request and confirm within 24 hours.
              </p>
            </div>
          </div>
        )}

        {isConfirmed && (
          <div className="flex items-start gap-2 bg-[var(--color-success-bg)] border border-[var(--color-success)]/30 rounded-[12px] px-4 py-3">
            <IconCheck size={15} stroke={2} className="text-[var(--color-success)] flex-none mt-0.5" />
            <p className="text-[12px] font-medium text-[var(--color-success)]">
              Your booking is confirmed. Meeting details have been shared with {booking.companionName}.
            </p>
          </div>
        )}

        {booking.status === 'cancelled' && (
          <div className="flex items-start gap-2 bg-[var(--color-error-bg)] border border-[var(--color-error)]/30 rounded-[12px] px-4 py-3">
            <IconX size={15} stroke={2} className="text-[var(--color-error)] flex-none mt-0.5" />
            <p className="text-[12px] font-medium text-[var(--color-error)]">
              This booking was cancelled. Any payment has been refunded.
            </p>
          </div>
        )}

        {/* Security note */}
        <div className="flex items-start gap-2 bg-[var(--color-gray-light)] rounded-[12px] px-3 py-2.5">
          <IconShieldCheck size={14} stroke={1.5} className="text-[var(--color-success)] flex-none mt-0.5" />
          <p className="text-[11px] text-[var(--color-gray)] leading-snug">
            {isPending
              ? `Payment of ₹${booking.total.toLocaleString()} is held securely and only charged after ${booking.companionName} confirms.`
              : isConfirmed
              ? `₹${booking.total.toLocaleString()} will be released to ${booking.companionName} after the session ends.`
              : `This transaction is protected by Meytle's payment guarantee.`}
          </p>
        </div>

        {/* Review CTA for completed */}
        {isCompleted && (
          <button className="w-full h-12 rounded-[12px] bg-[var(--color-amber)] text-white text-[14px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(232,160,0,0.4)]">
            <IconStar size={16} stroke={1.5} />
            Leave a Review
          </button>
        )}

      </div>
    </div>
  )
}
