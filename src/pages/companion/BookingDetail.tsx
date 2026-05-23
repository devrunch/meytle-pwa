import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconCalendarEvent, IconClock, IconMapPin,
  IconCurrencyRupee, IconMessageCircle, IconCheck, IconX,
  IconUser, IconNotes, IconShieldCheck, IconAlertCircle, IconGift,
} from '@tabler/icons-react'
import { MOCK_REQUESTS, type RequestStatus } from '../../data/mockBookings'
import LocationPickerMap from '../../components/ui/LocationPickerMap'

const STATUS_CONFIG: Record<RequestStatus, { label: string; bg: string; text: string }> = {
  pending:   { label: 'Pending approval',  bg: 'bg-yellow-50 border-yellow-200',  text: 'text-yellow-700' },
  confirmed: { label: 'Confirmed',          bg: 'bg-[var(--color-success-bg)] border-[var(--color-success)]/30', text: 'text-[var(--color-success)]' },
  completed: { label: 'Completed',          bg: 'bg-[var(--color-gray-light)] border-[var(--color-border)]',     text: 'text-[var(--color-gray)]' },
  declined:  { label: 'Declined',           bg: 'bg-[var(--color-error-bg)] border-[var(--color-error)]/30',     text: 'text-[var(--color-error)]' },
}

export default function BookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()

  const [requests, setRequests] = useState(MOCK_REQUESTS)
  const booking = requests.find(r => r.id === bookingId)

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-[14px] text-[var(--color-gray)]">Booking not found</p>
        <button onClick={() => navigate(-1)} className="text-[var(--color-amber)] text-[13px]">Go back</button>
      </div>
    )
  }

  const status = STATUS_CONFIG[booking.status]
  const isPending = booking.status === 'pending'
  const isConfirmed = booking.status === 'confirmed'

  function accept() {
    if (!booking) return
    setRequests(rs => rs.map(r => r.id === booking.id ? { ...r, status: 'confirmed' as const } : r))
  }
  function decline() {
    if (!booking) return
    setRequests(rs => rs.map(r => r.id === booking.id ? { ...r, status: 'declined' as const } : r))
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">

      {/* Header */}
      <div className="bg-white border-b border-[var(--color-border)] sticky top-0 z-20">
        <div className="max-w-[760px] mx-auto px-4 md:px-6 h-[52px] flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-[8px] hover:bg-[var(--color-gray-light)] flex items-center justify-center transition-colors">
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

        {/* User card */}
        <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-amber-light)] flex items-center justify-center flex-shrink-0">
            <span className="text-[15px] font-bold text-[var(--color-amber-dark)]">{booking.userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-[var(--color-dark)]">{booking.userName}</p>
            <p className="text-[12px] text-[var(--color-gray)]">Booking #{booking.id.toUpperCase()}</p>
          </div>
          {(isConfirmed) && (
            <button
              onClick={() => navigate('/app/messages')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-[var(--color-border)] text-[12px] font-medium text-[var(--color-dark)] hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] transition-colors"
            >
              <IconMessageCircle size={14} stroke={1.5} />
              Message
            </button>
          )}
        </div>

        {/* Custom booking banner */}
        {booking.isCustom && (
          <div className="rounded-[16px] border-2 border-[var(--color-amber)]/50 overflow-hidden">
            {/* Header strip */}
            <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: 'var(--gradient-gold)' }}>
              <IconAlertCircle size={16} stroke={2} className="text-white flex-none" />
              <p className="text-[13px] font-bold text-white">Custom Booking Request</p>
              <span className="ml-auto text-[10px] font-semibold bg-white/25 text-white px-2 py-0.5 rounded-full">
                Outside regular schedule
              </span>
            </div>

            <div className="bg-[var(--color-amber-light)] px-4 py-4 flex flex-col gap-3">
              {/* Requested time */}
              <div className="bg-white rounded-[12px] px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-[var(--color-amber-light)] flex items-center justify-center flex-shrink-0">
                  <IconClock size={17} stroke={1.5} className="text-[var(--color-amber)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-gray)] uppercase tracking-wide">Requested time</p>
                  <p className="text-[14px] font-bold text-[var(--color-dark)]">
                    {booking.customFrom} – {booking.customTo}
                  </p>
                  <p className="text-[11px] text-[var(--color-gray)]">{booking.date}</p>
                </div>
              </div>

              {/* Tip */}
              {booking.tip && booking.tip > 0 && (
                <div className="bg-white rounded-[12px] px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] bg-[var(--color-success-bg)] flex items-center justify-center flex-shrink-0">
                    <IconGift size={17} stroke={1.5} className="text-[var(--color-success)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-[var(--color-gray)] uppercase tracking-wide">Tip included</p>
                    <p className="text-[14px] font-bold text-[var(--color-success)]">₹{booking.tip.toLocaleString()}</p>
                    <p className="text-[11px] text-[var(--color-gray)]">Paid upfront · goes directly to you</p>
                  </div>
                </div>
              )}

              {/* User's note */}
              {booking.note && (
                <div className="bg-white rounded-[12px] px-4 py-3">
                  <p className="text-[10px] text-[var(--color-gray)] uppercase tracking-wide mb-1">Their message</p>
                  <p className="text-[13px] text-[var(--color-dark)] italic">"{booking.note}"</p>
                </div>
              )}
            </div>
          </div>
        )}

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
              { icon: <IconCurrencyRupee size={13} stroke={1.5} />, label: 'You earn',  value: `₹${Math.round(booking.total * 0.85).toLocaleString()}` },
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
                <p className="text-[10px] text-[var(--color-amber)] uppercase tracking-wide font-medium">Total paid</p>
                <p className="text-[13px] font-bold text-[var(--color-amber-dark)]">₹{booking.total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Meeting location */}
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
              <p className="text-[12px] text-[var(--color-gray)]">No pin set — address only</p>
            </div>
          )}
        </div>

        {/* User's note — only shown for non-custom bookings (custom shows it in the banner) */}
        {booking.note && !booking.isCustom && (
          <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <IconNotes size={14} stroke={1.5} className="text-[var(--color-amber)]" />
              <p className="text-[13px] font-semibold text-[var(--color-dark)]">Note from {booking.userName}</p>
            </div>
            <p className="text-[13px] text-[var(--color-gray)] leading-relaxed italic">"{booking.note}"</p>
          </div>
        )}

        {/* Security note */}
        <div className="flex items-start gap-2 bg-[var(--color-gray-light)] rounded-[12px] px-3 py-2.5">
          <IconShieldCheck size={14} stroke={1.5} className="text-[var(--color-success)] flex-none mt-0.5" />
          <p className="text-[11px] text-[var(--color-gray)] leading-snug">
            Payment of ₹{booking.total.toLocaleString()} is held securely and will be released to you after the session.
          </p>
        </div>

        {/* Accept / Decline */}
        {isPending && (
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={decline}
              className="flex-1 py-4 rounded-[16px] border-2 border-[var(--color-border)] text-[15px] font-bold text-[var(--color-gray)] hover:border-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-red-50 transition-colors flex items-center justify-center gap-2.5"
            >
              <IconX size={18} stroke={2.5} /> Decline
            </button>
            <button
              onClick={accept}
              className="flex-1 py-4 rounded-[16px] bg-[var(--color-amber)] text-white text-[15px] font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-[0_6px_20px_rgba(232,160,0,0.45)]"
            >
              <IconCheck size={18} stroke={2.5} /> Accept Booking
            </button>
          </div>
        )}

        {/* Already confirmed actions */}
        {isConfirmed && (
          <div className="bg-[var(--color-success-bg)] border border-[var(--color-success)]/30 rounded-[12px] px-4 py-3 flex items-center gap-2">
            <IconCheck size={15} stroke={2} className="text-[var(--color-success)] flex-none" />
            <p className="text-[12px] font-medium text-[var(--color-success)]">
              You've accepted this booking. The meeting location has been shared with {booking.userName}.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
