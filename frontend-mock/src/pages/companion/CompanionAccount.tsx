import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconUser, IconBrandStripe, IconCheck, IconAlertCircle,
  IconCurrencyRupee, IconCalendarEvent, IconClock, IconShieldCheck,
  IconExternalLink, IconEdit, IconCamera, IconMapPin, IconStar,
  IconBell, IconLock, IconChevronRight, IconX, IconEye, IconEyeOff, IconHourglass,
} from '@tabler/icons-react'
import { api } from '../../lib/api'
import { useToast } from '../../components/ui/Toast'

// ── Types ────────────────────────────────────────────────────────────────────

type StripeStatus = 'not_connected' | 'pending_verification' | 'active' | 'restricted'

interface CompanionProfile {
  id: string
  displayName: string
  bio: string | null
  profilePhotoUrl: string
  hourlyRatePaisa: number
  profileStatus: string
  ratingAvg: number | null
  ratingCount: number
}

interface ApiService {
  serviceType: string
}

interface ApiAvailabilitySlot {
  dayOfWeek: number
  fromTime: string
  toTime: string
}

const SERVICE_LABELS: Record<string, string> = {
  coffee: 'Coffee Dates', dining: 'Fine Dining', concert: 'Concerts',
  travel: 'Travel', fitness: 'Fitness', culture: 'Cultural Events',
  nature: 'Nature Walks', movies: 'Movies', shopping: 'Shopping', gaming: 'Gaming',
}

const ALL_SERVICE_TYPES = Object.keys(SERVICE_LABELS)

const DB_DAY_TO_LABEL: Record<number, string> = {
  0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri', 5: 'Sat', 6: 'Sun',
}
const LABEL_TO_DB_DAY: Record<string, number> = {
  Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
}

const TIME_OPTIONS_FROM = ['6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM']
const TIME_OPTIONS_TO   = ['1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM']

function parseTimeToHHMM(t: string): string {
  const [time, period] = t.split(' ')
  const [h, m] = time.split(':').map(Number)
  let hour = h
  if (period === 'PM' && h !== 12) hour += 12
  if (period === 'AM' && h === 12) hour = 0
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function hhmmToDisplay(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${display}:${String(m).padStart(2, '0')} ${period}`
}

// ── Profile status config ─────────────────────────────────────────────────────

const PROFILE_STATUS_CONFIG: Record<string, {
  label: string; badge: string; badgeBg: string;
  bannerBg: string; bannerBorder: string; bannerText: string;
  icon: React.ReactNode; detail: string; visible: boolean
}> = {
  pending_verification: {
    label: 'Pending review',
    badge: 'text-yellow-700', badgeBg: 'bg-yellow-50',
    bannerBg: 'bg-yellow-50', bannerBorder: 'border-yellow-200', bannerText: 'text-yellow-800',
    icon: <IconHourglass size={15} stroke={1.5} />,
    detail: 'Your profile is under review. It is not visible to users yet and won\'t appear in search results.',
    visible: false,
  },
  active: {
    label: 'Active',
    badge: 'text-[var(--color-success)]', badgeBg: 'bg-[var(--color-success-bg)]',
    bannerBg: 'bg-[var(--color-success-bg)]', bannerBorder: 'border-green-200', bannerText: 'text-green-800',
    icon: <IconEye size={15} stroke={1.5} />,
    detail: 'Your profile is live and publicly visible. Users can find and book you.',
    visible: true,
  },
  inactive: {
    label: 'Inactive',
    badge: 'text-[var(--color-gray)]', badgeBg: 'bg-[var(--color-gray-light)]',
    bannerBg: 'bg-[var(--color-gray-light)]', bannerBorder: 'border-[var(--color-border)]', bannerText: 'text-[var(--color-dark)]',
    icon: <IconEyeOff size={15} stroke={1.5} />,
    detail: 'Your profile is hidden and not searchable. Contact support to reactivate.',
    visible: false,
  },
  rejected: {
    label: 'Rejected',
    badge: 'text-[var(--color-error)]', badgeBg: 'bg-red-50',
    bannerBg: 'bg-red-50', bannerBorder: 'border-red-200', bannerText: 'text-red-800',
    icon: <IconX size={15} stroke={1.5} />,
    detail: 'Your profile was not approved. Please contact support for more information.',
    visible: false,
  },
}

// ── Stripe status config (UI only — no backend yet) ──────────────────────────

const STRIPE_STATUS_CONFIG: Record<StripeStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  not_connected:        { label: 'Not connected',        color: 'text-[var(--color-gray)]',   bg: 'bg-[var(--color-gray-light)]', border: 'border-[var(--color-border)]',       icon: <IconBrandStripe size={16} stroke={1.5} /> },
  pending_verification: { label: 'Pending verification', color: 'text-yellow-700',             bg: 'bg-yellow-50',                 border: 'border-yellow-200',                  icon: <IconAlertCircle size={16} stroke={1.5} /> },
  active:               { label: 'Active',               color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success-bg)]', border: 'border-[var(--color-success)]/30',   icon: <IconCheck size={16} stroke={1.5} /> },
  restricted:           { label: 'Restricted',           color: 'text-[var(--color-error)]',   bg: 'bg-[var(--color-error-bg)]',   border: 'border-[var(--color-error)]/30',     icon: <IconAlertCircle size={16} stroke={1.5} /> },
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'payouts' | 'settings'

// ── Toggle row helper ─────────────────────────────────────────────────────────

function ToggleRow({ label, sub, defaultOn }: { label: string; sub: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)] last:border-0">
      <div className="min-w-0 mr-4">
        <p className="text-[13px] font-medium text-[var(--color-dark)]">{label}</p>
        <p className="text-[11px] text-[var(--color-gray)] mt-0.5">{sub}</p>
      </div>
      <button
        onClick={() => setOn(v => !v)}
        className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${on ? 'bg-[var(--color-amber)]' : 'bg-[var(--color-border)]'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CompanionAccount() {
  const navigate = useNavigate()
  const toast = useToast()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)

  // Profile data
  const [profile, setProfile] = useState<CompanionProfile | null>(null)
  const [services, setServices] = useState<string[]>([])
  const [availabilitySlots, setAvailabilitySlots] = useState<ApiAvailabilitySlot[]>([])

  // Edit state — bio
  const [editingBio, setEditingBio] = useState(false)
  const [bio, setBio] = useState('')
  const [savingBio, setSavingBio] = useState(false)

  // Edit state — rate
  const [editingRate, setEditingRate] = useState(false)
  const [hourlyRate, setHourlyRate] = useState(0)
  const [rateTouched, setRateTouched] = useState(false)
  const [savingRate, setSavingRate] = useState(false)

  // Edit state — services
  const [editingServices, setEditingServices] = useState(false)
  const [draftServices, setDraftServices] = useState<string[]>([])
  const [savingServices, setSavingServices] = useState(false)

  // Edit state — availability
  const [editingAvailability, setEditingAvailability] = useState(false)
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set())
  const [fromTime, setFromTime] = useState('9:00 AM')
  const [toTime, setToTime] = useState('7:00 PM')
  const [savingAvailability, setSavingAvailability] = useState(false)

  // Photo upload
  const [photoUploading, setPhotoUploading] = useState(false)

  useEffect(() => {
    api.get<CompanionProfile>('/companions/me/profile')
      .then(async profileRes => {
        const p = profileRes.data
        setProfile(p)
        setBio(p.bio ?? '')
        setHourlyRate(Math.round(p.hourlyRatePaisa / 100))

        const [svcRes, availRes] = await Promise.all([
          api.get<ApiService[]>(`/companions/${p.id}/services`),
          api.get<ApiAvailabilitySlot[]>(`/companions/${p.id}/availability`),
        ])
        const svcTypes = svcRes.data.map(s => s.serviceType)
        setServices(svcTypes)
        setDraftServices(svcTypes)
        setAvailabilitySlots(availRes.data)

        if (availRes.data.length > 0) {
          const days = new Set(availRes.data.map(s => DB_DAY_TO_LABEL[s.dayOfWeek]))
          setActiveDays(days)
          setFromTime(hhmmToDisplay(availRes.data[0].fromTime))
          setToTime(hhmmToDisplay(availRes.data[0].toTime))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function saveBio() {
    if (!profile) return
    setSavingBio(true)
    try {
      await api.patch('/companions/me/profile', { bio })
      setProfile(p => p ? { ...p, bio } : p)
      setEditingBio(false)
      toast('success', 'Bio saved')
    } catch {
      toast('error', "Couldn't save changes")
    } finally { setSavingBio(false) }
  }

  async function saveRate() {
    if (!profile) return
    setRateTouched(true)
    if (hourlyRate < 500) return
    setSavingRate(true)
    try {
      await api.patch('/companions/me/profile', { hourlyRatePaisa: hourlyRate * 100 })
      setProfile(p => p ? { ...p, hourlyRatePaisa: hourlyRate * 100 } : p)
      setEditingRate(false)
      toast('success', 'Rate updated')
    } catch {
      toast('error', "Couldn't save changes")
    } finally { setSavingRate(false) }
  }

  async function saveServices() {
    if (!profile) return
    setSavingServices(true)
    try {
      await api.patch('/companions/me/profile', { services: draftServices })
      setServices(draftServices)
      setEditingServices(false)
      toast('success', 'Services updated')
    } catch {
      toast('error', "Couldn't save changes")
    } finally { setSavingServices(false) }
  }

  async function saveAvailability() {
    setSavingAvailability(true)
    try {
      const slots = Array.from(activeDays).map(day => ({
        dayOfWeek: LABEL_TO_DB_DAY[day],
        fromTime: parseTimeToHHMM(fromTime),
        toTime: parseTimeToHHMM(toTime),
      }))
      await api.put('/companions/me/availability', { slots })
      setAvailabilitySlots(slots)
      setEditingAvailability(false)
      toast('success', 'Availability saved')
    } catch {
      toast('error', "Couldn't save changes")
    } finally { setSavingAvailability(false) }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setPhotoUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const uploadRes = await api.post<{ url: string }>('/uploads/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await api.patch('/companions/me/profile', { profilePhotoUrl: uploadRes.data.url })
      setProfile(p => p ? { ...p, profilePhotoUrl: uploadRes.data.url } : p)
      toast('success', 'Photo updated')
    } catch {
      toast('error', "Couldn't save changes")
    } finally { setPhotoUploading(false) }
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile',  label: 'Profile',  icon: <IconUser size={15} stroke={1.5} /> },
    { key: 'payouts',  label: 'Payouts',  icon: <IconBrandStripe size={15} stroke={1.5} /> },
    { key: 'settings', label: 'Settings', icon: <IconLock size={15} stroke={1.5} /> },
  ]

  const stripeStatus: StripeStatus = 'not_connected'
  const stripeStatusCfg = STRIPE_STATUS_CONFIG[stripeStatus]
  const initials = profile?.displayName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?'

  return (
    <div className="min-h-full bg-[var(--color-bg)]">

      {/* Header */}
      <div className="bg-white border-b border-[var(--color-border)] sticky top-0 z-20">
        <div className="max-w-[900px] mx-auto px-4 md:px-6 h-[52px] flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-[8px] hover:bg-[var(--color-gray-light)] flex items-center justify-center transition-colors"
          >
            <IconArrowLeft size={18} stroke={1.5} className="text-[var(--color-dark)]" />
          </button>
          <p className="text-[15px] font-semibold text-[var(--color-dark)] flex-1">Companion Account</p>
          <button
            onClick={() => navigate('/app/companion/dashboard')}
            className="text-[12px] text-[var(--color-amber)] font-medium"
          >
            Dashboard
          </button>
        </div>
        <div className="max-w-[900px] mx-auto px-4 md:px-6 flex border-t border-[var(--color-border)]">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-5 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'text-[var(--color-amber)] border-[var(--color-amber)]'
                  : 'text-[var(--color-gray)] border-transparent hover:text-[var(--color-dark)]'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 md:px-6 py-6 flex flex-col gap-5 pb-12">

        {loading ? (
          <div className="flex flex-col gap-4">
            {[160, 120, 100, 180].map((h, i) => (
              <div key={i} className="rounded-[16px] bg-[var(--color-gray-light)] animate-pulse" style={{ height: h }} />
            ))}
          </div>
        ) : (

        <>
        {/* ── Profile tab ── */}
        {tab === 'profile' && (
          <>
            {/* Profile photo + name */}
            <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-[80px] h-[80px] rounded-full bg-[var(--color-amber-light)] border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                    {profile?.profilePhotoUrl
                      ? <img src={profile.profilePhotoUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                      : <span className="text-[28px] font-black text-[var(--color-amber-dark)]">{initials}</span>
                    }
                  </div>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={photoUploading}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[var(--color-amber)] flex items-center justify-center border-2 border-white shadow disabled:opacity-60"
                  >
                    {photoUploading
                      ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      : <IconCamera size={13} stroke={1.5} className="text-white" />
                    }
                  </button>
                  <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={handlePhotoUpload} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-[18px] font-bold text-[var(--color-dark)]">{profile?.displayName ?? '—'}</p>
                    {profile?.profileStatus && (() => {
                      const cfg = PROFILE_STATUS_CONFIG[profile.profileStatus]
                      if (!cfg) return null
                      return (
                        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge} ${cfg.badgeBg}`}>
                          {cfg.icon && <span className="w-3 h-3 flex items-center">{cfg.icon}</span>}
                          {cfg.label}
                        </span>
                      )
                    })()}
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-[var(--color-gray)]">
                    <span className="flex items-center gap-1"><IconMapPin size={11} stroke={1.5} /> Delhi NCR</span>
                    {profile?.ratingAvg && (
                      <span className="flex items-center gap-1">
                        <IconStar size={11} stroke={1.5} className="text-[var(--color-amber)]" />
                        {Number(profile.ratingAvg).toFixed(1)} · {profile.ratingCount} reviews
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--color-amber)] font-medium mt-1.5">
                    ₹{Math.round((profile?.hourlyRatePaisa ?? 0) / 100).toLocaleString()}/hr
                  </p>
                </div>
              </div>
            </div>

            {/* Profile status banner */}
            {profile?.profileStatus && (() => {
              const cfg = PROFILE_STATUS_CONFIG[profile.profileStatus]
              if (!cfg) return null
              return (
                <div className={`rounded-[12px] border px-4 py-3 flex items-start gap-3 ${cfg.bannerBg} ${cfg.bannerBorder}`}>
                  <span className={`mt-0.5 flex-shrink-0 ${cfg.bannerText}`}>{cfg.icon}</span>
                  <div>
                    <p className={`text-[13px] font-semibold ${cfg.bannerText}`}>
                      {cfg.visible ? 'Profile is live' : `Profile ${cfg.label.toLowerCase()}`}
                    </p>
                    <p className={`text-[12px] mt-0.5 ${cfg.bannerText} opacity-80`}>{cfg.detail}</p>
                  </div>
                </div>
              )
            })()}

            {/* Bio */}
            <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[14px] font-semibold text-[var(--color-dark)]">Bio</p>
                {editingBio ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingBio(false)} className="text-[12px] text-[var(--color-gray)]">Cancel</button>
                    <button
                      onClick={saveBio}
                      disabled={savingBio}
                      className="text-[12px] text-[var(--color-amber)] font-semibold disabled:opacity-50"
                    >
                      {savingBio ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingBio(true)} className="flex items-center gap-1 text-[12px] text-[var(--color-amber)] font-medium">
                    <IconEdit size={13} stroke={1.5} /> Edit
                  </button>
                )}
              </div>
              {editingBio ? (
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={4}
                  maxLength={300}
                  className="w-full px-3 py-2.5 rounded-[10px] border border-[var(--color-amber)] text-[13px] text-[var(--color-dark)] focus:outline-none resize-none"
                />
              ) : (
                <p className="text-[13px] text-[var(--color-gray)] leading-relaxed">
                  {bio || <span className="italic">No bio yet — add one to attract more clients.</span>}
                </p>
              )}
            </div>

            {/* Hourly rate */}
            <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[14px] font-semibold text-[var(--color-dark)]">Hourly Rate</p>
                  <p className="text-[11px] text-[var(--color-gray)] mt-0.5">Applied to all services you offer</p>
                </div>
                {editingRate ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingRate(false); setRateTouched(false); setHourlyRate(Math.round((profile?.hourlyRatePaisa ?? 0) / 100)) }} className="text-[12px] text-[var(--color-gray)]">Cancel</button>
                    <button onClick={saveRate} disabled={savingRate} className="text-[12px] text-[var(--color-amber)] font-semibold disabled:opacity-50">
                      {savingRate ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingRate(true)} className="flex items-center gap-1 text-[12px] text-[var(--color-amber)] font-medium">
                    <IconEdit size={13} stroke={1.5} /> Edit
                  </button>
                )}
              </div>
              {editingRate ? (
                <div>
                  <div className="relative w-40">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-gray)]">₹</span>
                    <input
                      type="number"
                      value={hourlyRate}
                      min={500}
                      onChange={e => setHourlyRate(Number(e.target.value))}
                      onBlur={() => setRateTouched(true)}
                      className={`w-full h-11 pl-7 pr-3 rounded-[10px] border text-[15px] font-bold text-[var(--color-dark)] focus:outline-none ${
                        rateTouched && hourlyRate < 500 ? 'border-[var(--color-error)]' : 'border-[var(--color-amber)]'
                      }`}
                    />
                  </div>
                  {rateTouched && hourlyRate < 500 && (
                    <p className="text-[11px] text-[var(--color-error)] mt-1 flex items-center gap-1">
                      <IconAlertCircle size={11} />Minimum rate is ₹500/hr
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[28px] font-black text-[var(--color-dark)]">
                  ₹{hourlyRate.toLocaleString()}
                  <span className="text-[14px] font-normal text-[var(--color-gray)] ml-1">/hr</span>
                </p>
              )}
              <p className="text-[11px] text-[var(--color-gray)] mt-2">You earn ₹{Math.round(hourlyRate * 0.85).toLocaleString()}/hr after the 15% platform fee.</p>
            </div>

            {/* Services */}
            <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[14px] font-semibold text-[var(--color-dark)]">Services</p>
                {editingServices ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingServices(false); setDraftServices(services) }} className="text-[12px] text-[var(--color-gray)]">Cancel</button>
                    <button onClick={saveServices} disabled={savingServices} className="text-[12px] text-[var(--color-amber)] font-semibold disabled:opacity-50">
                      {savingServices ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingServices(true)} className="flex items-center gap-1 text-[12px] text-[var(--color-amber)] font-medium">
                    <IconEdit size={13} stroke={1.5} /> Manage
                  </button>
                )}
              </div>
              {editingServices ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_SERVICE_TYPES.map(type => {
                    const active = draftServices.includes(type)
                    return (
                      <button
                        key={type}
                        onClick={() => setDraftServices(prev =>
                          active ? prev.filter(t => t !== type) : [...prev, type]
                        )}
                        className={`flex items-center gap-2 px-3 py-2 rounded-[10px] border-2 text-left transition-all ${
                          active
                            ? 'border-[var(--color-amber)] bg-[var(--color-amber-light)]'
                            : 'border-[var(--color-border)] bg-white hover:border-[var(--color-amber)]/40'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? 'bg-[var(--color-amber)] border-[var(--color-amber)]' : 'border-[var(--color-border)]'}`}>
                          {active && <IconCheck size={9} stroke={2.5} color="white" />}
                        </div>
                        <span className={`text-[12px] font-medium ${active ? 'text-[var(--color-amber-dark)]' : 'text-[var(--color-dark)]'}`}>
                          {SERVICE_LABELS[type]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {services.length === 0 ? (
                    <p className="text-[13px] text-[var(--color-gray)] italic">No services added yet.</p>
                  ) : services.map(type => (
                    <div key={type} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-amber-light)] border border-[var(--color-amber)]/30">
                      <IconCheck size={11} stroke={2.5} className="text-[var(--color-amber)]" />
                      <span className="text-[12px] font-medium text-[var(--color-amber-dark)]">{SERVICE_LABELS[type] ?? type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[14px] font-semibold text-[var(--color-dark)]">Availability</p>
                  <p className="text-[11px] text-[var(--color-gray)] mt-0.5">Days and hours you're open for bookings</p>
                </div>
                {editingAvailability ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingAvailability(false)
                        if (availabilitySlots.length > 0) {
                          setActiveDays(new Set(availabilitySlots.map(s => DB_DAY_TO_LABEL[s.dayOfWeek])))
                          setFromTime(hhmmToDisplay(availabilitySlots[0].fromTime))
                          setToTime(hhmmToDisplay(availabilitySlots[0].toTime))
                        }
                      }}
                      className="text-[12px] text-[var(--color-gray)]"
                    >
                      Cancel
                    </button>
                    <button onClick={saveAvailability} disabled={savingAvailability} className="text-[12px] text-[var(--color-amber)] font-semibold disabled:opacity-50">
                      {savingAvailability ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingAvailability(true)} className="flex items-center gap-1 text-[12px] text-[var(--color-amber)] font-medium">
                    <IconEdit size={13} stroke={1.5} /> Edit
                  </button>
                )}
              </div>

              <div className="flex gap-2 flex-wrap mb-4">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => {
                  const on = activeDays.has(day)
                  return (
                    <button
                      key={day}
                      disabled={!editingAvailability}
                      onClick={() => {
                        const next = new Set(activeDays)
                        on ? next.delete(day) : next.add(day)
                        setActiveDays(next)
                      }}
                      className={`w-11 h-11 rounded-[10px] text-[12px] font-bold transition-all ${
                        on ? 'bg-[var(--color-amber)] text-white shadow-sm' : 'bg-[var(--color-gray-light)] text-[var(--color-gray)]'
                      } ${editingAvailability ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}`}
                    >
                      {day.slice(0, 2)}
                    </button>
                  )
                })}
              </div>

              {editingAvailability ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-[var(--color-gray)] uppercase tracking-wide block mb-1">From</label>
                    <select
                      value={fromTime}
                      onChange={e => setFromTime(e.target.value)}
                      className="w-full h-10 px-3 rounded-[10px] border border-[var(--color-amber)] bg-white text-[13px] font-medium text-[var(--color-dark)] focus:outline-none appearance-none"
                    >
                      {TIME_OPTIONS_FROM.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <span className="text-[var(--color-gray)] text-[13px] mt-5">–</span>
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-[var(--color-gray)] uppercase tracking-wide block mb-1">To</label>
                    <select
                      value={toTime}
                      onChange={e => setToTime(e.target.value)}
                      className="w-full h-10 px-3 rounded-[10px] border border-[var(--color-amber)] bg-white text-[13px] font-medium text-[var(--color-dark)] focus:outline-none appearance-none"
                    >
                      {TIME_OPTIONS_TO.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[12px] text-[var(--color-gray)]">
                  <IconClock size={13} stroke={1.5} className="text-[var(--color-amber)]" />
                  {availabilitySlots.length === 0 ? (
                    <span className="italic">No availability set yet.</span>
                  ) : (
                    <>
                      <span className="font-medium text-[var(--color-dark)]">{fromTime} – {toTime}</span>
                      <span className="text-[var(--color-gray)]">·</span>
                      <span>{activeDays.size} days / week</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Payouts tab ── */}
        {tab === 'payouts' && (
          <>
            <div className={`rounded-[16px] border p-5 ${stripeStatusCfg.bg} ${stripeStatusCfg.border}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <IconBrandStripe size={22} stroke={1.5} className="text-[#635BFF]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[15px] font-bold text-[var(--color-dark)]">Stripe Connect</p>
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${stripeStatusCfg.color} bg-white/70`}>
                        {stripeStatusCfg.icon} {stripeStatusCfg.label}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#635BFF] text-white text-[12px] font-semibold flex-shrink-0 hover:opacity-90 transition-opacity">
                  <IconExternalLink size={13} stroke={1.5} />
                  Connect Stripe
                </button>
              </div>

              <div className="mt-4 bg-white/60 rounded-[10px] p-3">
                <p className="text-[12px] text-[var(--color-dark)] font-medium mb-1">Why connect Stripe?</p>
                <p className="text-[11px] text-[var(--color-gray)] leading-relaxed">
                  Receive payouts directly to your Indian bank account. Stripe handles secure payments and instant transfers. Free to set up.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#635BFF]/10 flex items-center justify-center mx-auto mb-4">
                <IconBrandStripe size={32} stroke={1.2} className="text-[#635BFF]" />
              </div>
              <p className="text-[16px] font-bold text-[var(--color-dark)] mb-2">Set up payouts</p>
              <p className="text-[13px] text-[var(--color-gray)] mb-5 max-w-[320px] mx-auto leading-relaxed">
                Connect your bank account via Stripe to receive earnings from your sessions. Takes less than 5 minutes.
              </p>
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-[12px] bg-[#635BFF] text-white text-[14px] font-bold hover:opacity-90 transition-opacity shadow-[0_4px_16px_rgba(99,91,255,0.35)]">
                <IconBrandStripe size={18} stroke={1.5} />
                Connect with Stripe
              </button>
              <p className="text-[10px] text-[var(--color-gray)] mt-3">Secured by Stripe · No card required</p>
            </div>

            <div className="flex items-start gap-3 bg-[var(--color-gray-light)] rounded-[12px] px-4 py-3">
              <IconShieldCheck size={15} stroke={1.5} className="text-[var(--color-success)] flex-none mt-0.5" />
              <p className="text-[11px] text-[var(--color-gray)] leading-relaxed">
                Meytle retains a <span className="font-semibold text-[var(--color-dark)]">15% platform fee</span> on each session. Payouts are processed via Stripe and typically arrive within 1–2 business days.
              </p>
            </div>
          </>
        )}

        {/* ── Settings tab ── */}
        {tab === 'settings' && (
          <>
            <div className="bg-white rounded-[16px] border border-[var(--color-border)] overflow-hidden">
              <p className="text-[12px] font-semibold text-[var(--color-gray)] uppercase tracking-wide px-5 py-3 border-b border-[var(--color-border)]">Notifications</p>
              {[
                { label: 'New booking requests',  sub: 'Get notified when someone requests your time',  on: true  },
                { label: 'Booking confirmations', sub: 'When a booking is accepted or declined',        on: true  },
                { label: 'Payout notifications',  sub: 'When funds are sent to your bank',              on: true  },
                { label: 'Marketing & tips',      sub: 'Tips to improve your profile and earnings',     on: false },
              ].map(item => (
                <ToggleRow key={item.label} label={item.label} sub={item.sub} defaultOn={item.on} />
              ))}
            </div>

            <div className="bg-white rounded-[16px] border border-[var(--color-border)] overflow-hidden">
              <p className="text-[12px] font-semibold text-[var(--color-gray)] uppercase tracking-wide px-5 py-3 border-b border-[var(--color-border)]">Privacy</p>
              {[
                { label: 'Show profile to new users', sub: 'Your profile appears in Discover',          on: true  },
                { label: 'Show availability status',  sub: '"Available now" badge on your profile',     on: true  },
                { label: 'Allow direct messages',     sub: 'Users can message before booking',          on: false },
              ].map(item => (
                <ToggleRow key={item.label} label={item.label} sub={item.sub} defaultOn={item.on} />
              ))}
            </div>

            <div className="bg-white rounded-[16px] border border-[var(--color-border)] overflow-hidden">
              <p className="text-[12px] font-semibold text-[var(--color-gray)] uppercase tracking-wide px-5 py-3 border-b border-[var(--color-border)]">Account</p>
              {[
                { label: 'Change password',                    icon: <IconLock size={15} stroke={1.5} /> },
                { label: `Linked email · ${profile?.displayName ?? ''}`, icon: <IconBell size={15} stroke={1.5} /> },
                { label: 'Download my data',                   icon: <IconX size={15} stroke={1.5} /> },
              ].map(item => (
                <button key={item.label} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-gray-light)] transition-colors border-b border-[var(--color-border)] last:border-0">
                  <span className="text-[var(--color-gray)]">{item.icon}</span>
                  <span className="flex-1 text-[13px] font-medium text-[var(--color-dark)] text-left">{item.label}</span>
                  <IconChevronRight size={14} stroke={1.5} className="text-[var(--color-gray)]" />
                </button>
              ))}
            </div>

            <button className="w-full py-3.5 rounded-[14px] border-2 border-[var(--color-error)]/30 text-[var(--color-error)] text-[14px] font-semibold hover:bg-[var(--color-error-bg)] transition-colors">
              Deactivate companion account
            </button>
          </>
        )}
        </>
        )}

      </div>
    </div>
  )
}
