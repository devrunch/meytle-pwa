import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconUser, IconBrandStripe, IconCheck, IconAlertCircle,
  IconCurrencyRupee, IconCalendarEvent, IconClock, IconShieldCheck,
  IconExternalLink, IconEdit, IconCamera, IconMapPin, IconStar,
  IconBell, IconLock, IconChevronRight, IconCircleCheck, IconX,
  IconArrowUpRight, IconArrowDownRight, IconRefresh,
} from '@tabler/icons-react'

// ── Mock Stripe Connect state ─────────────────────────────────────────────────

type StripeStatus = 'not_connected' | 'pending_verification' | 'active' | 'restricted'

interface StripeAccount {
  status: StripeStatus
  accountId: string
  email: string
  displayName: string
  country: string
  currency: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
  verificationStatus: 'unverified' | 'pending' | 'verified'
  pendingRequirements: string[]
  bankLast4: string
  payoutSchedule: 'daily' | 'weekly' | 'monthly'
  nextPayoutDate: string
}

interface Balance {
  available: number
  pending: number
  totalEarned: number
}

interface PayoutRecord {
  id: string
  amount: number
  status: 'paid' | 'in_transit' | 'pending' | 'failed'
  date: string
  arrivalDate: string
  description: string
}

const MOCK_STRIPE: StripeAccount = {
  status: 'active',
  accountId: 'acct_1PxK2mRGT7qwerty',
  email: 'aanya.companion@gmail.com',
  displayName: 'Aanya K.',
  country: 'IN',
  currency: 'INR',
  chargesEnabled: true,
  payoutsEnabled: true,
  verificationStatus: 'verified',
  pendingRequirements: [],
  bankLast4: '4242',
  payoutSchedule: 'weekly',
  nextPayoutDate: 'May 27, 2026',
}

const MOCK_BALANCE: Balance = {
  available: 8160,
  pending: 4800,
  totalEarned: 62400,
}

const MOCK_PAYOUTS: PayoutRecord[] = [
  { id: 'po_1', amount: 6800,  status: 'paid',       date: 'May 20, 2026', arrivalDate: 'May 20, 2026', description: '3 sessions' },
  { id: 'po_2', amount: 4250,  status: 'in_transit', date: 'May 13, 2026', arrivalDate: 'May 22, 2026', description: '2 sessions' },
  { id: 'po_3', amount: 9600,  status: 'paid',       date: 'May 6, 2026',  arrivalDate: 'May 6, 2026',  description: '4 sessions' },
  { id: 'po_4', amount: 3400,  status: 'paid',       date: 'Apr 29, 2026', arrivalDate: 'Apr 29, 2026', description: '2 sessions' },
  { id: 'po_5', amount: 5100,  status: 'paid',       date: 'Apr 22, 2026', arrivalDate: 'Apr 22, 2026', description: '3 sessions' },
]

const STRIPE_STATUS_CONFIG: Record<StripeStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  not_connected:       { label: 'Not connected',        color: 'text-[var(--color-gray)]',    bg: 'bg-[var(--color-gray-light)]',    border: 'border-[var(--color-border)]',        icon: <IconBrandStripe size={16} stroke={1.5} /> },
  pending_verification:{ label: 'Pending verification', color: 'text-yellow-700',              bg: 'bg-yellow-50',                    border: 'border-yellow-200',                   icon: <IconAlertCircle size={16} stroke={1.5} /> },
  active:              { label: 'Active',               color: 'text-[var(--color-success)]',  bg: 'bg-[var(--color-success-bg)]',    border: 'border-[var(--color-success)]/30',    icon: <IconCircleCheck size={16} stroke={1.5} /> },
  restricted:          { label: 'Restricted',           color: 'text-[var(--color-error)]',    bg: 'bg-[var(--color-error-bg)]',      border: 'border-[var(--color-error)]/30',      icon: <IconAlertCircle size={16} stroke={1.5} /> },
}

const PAYOUT_STATUS: Record<PayoutRecord['status'], { label: string; color: string; bg: string }> = {
  paid:        { label: 'Paid',        color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success-bg)]' },
  in_transit:  { label: 'In transit',  color: 'text-yellow-700',             bg: 'bg-yellow-50' },
  pending:     { label: 'Pending',     color: 'text-[var(--color-gray)]',    bg: 'bg-[var(--color-gray-light)]' },
  failed:      { label: 'Failed',      color: 'text-[var(--color-error)]',   bg: 'bg-[var(--color-error-bg)]' },
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'payouts' | 'settings'

export default function CompanionAccount() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('profile')
  const [stripeData] = useState(MOCK_STRIPE)
  const [balance] = useState(MOCK_BALANCE)
  const [payouts] = useState(MOCK_PAYOUTS)
  const [editingBio, setEditingBio] = useState(false)
  const [bio, setBio] = useState('I love exploring the city, discovering hidden gems, and making new connections over great food and coffee. Join me for an unforgettable experience in Mumbai!')
  const [hourlyRate, setHourlyRate] = useState(800)
  const [editingRate, setEditingRate] = useState(false)
  const [editingAvailability, setEditingAvailability] = useState(false)
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set(['Mon','Tue','Wed','Thu','Fri']))
  const [fromTime, setFromTime] = useState('9:00 AM')
  const [toTime, setToTime] = useState('7:00 PM')

  const stripeStatusCfg = STRIPE_STATUS_CONFIG[stripeData.status]

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile',  label: 'Profile',  icon: <IconUser size={15} stroke={1.5} /> },
    { key: 'payouts',  label: 'Payouts',  icon: <IconBrandStripe size={15} stroke={1.5} /> },
    { key: 'settings', label: 'Settings', icon: <IconLock size={15} stroke={1.5} /> },
  ]

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
        {/* Tab bar */}
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

        {/* ── Profile tab ── */}
        {tab === 'profile' && (
          <>
            {/* Profile photo + name */}
            <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-[80px] h-[80px] rounded-full bg-[var(--color-amber-light)] border-4 border-white shadow-md flex items-center justify-center">
                    <span className="text-[28px] font-black text-[var(--color-amber-dark)]">A</span>
                  </div>
                  <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[var(--color-amber)] flex items-center justify-center border-2 border-white shadow">
                    <IconCamera size={13} stroke={1.5} className="text-white" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[18px] font-bold text-[var(--color-dark)]">Aanya K.</p>
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[var(--color-success)] bg-[var(--color-success-bg)] px-2 py-0.5 rounded-full">
                      <IconShieldCheck size={10} stroke={2} /> Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-[var(--color-gray)]">
                    <span className="flex items-center gap-1"><IconMapPin size={11} stroke={1.5} /> Bandra West, Mumbai</span>
                    <span className="flex items-center gap-1"><IconStar size={11} stroke={1.5} className="text-[var(--color-amber)]" /> 4.9 · 42 reviews</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-amber)] font-medium mt-1.5">₹{hourlyRate.toLocaleString()}/hr · Active companion</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[14px] font-semibold text-[var(--color-dark)]">Bio</p>
                <button
                  onClick={() => setEditingBio(e => !e)}
                  className="flex items-center gap-1 text-[12px] text-[var(--color-amber)] font-medium"
                >
                  <IconEdit size={13} stroke={1.5} /> {editingBio ? 'Done' : 'Edit'}
                </button>
              </div>
              {editingBio ? (
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-[10px] border border-[var(--color-amber)] text-[13px] text-[var(--color-dark)] focus:outline-none resize-none"
                />
              ) : (
                <p className="text-[13px] text-[var(--color-gray)] leading-relaxed">{bio}</p>
              )}
            </div>

            {/* Hourly rate */}
            <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[14px] font-semibold text-[var(--color-dark)]">Hourly Rate</p>
                  <p className="text-[11px] text-[var(--color-gray)] mt-0.5">Applied to all services you offer</p>
                </div>
                <button
                  onClick={() => setEditingRate(e => !e)}
                  className="flex items-center gap-1 text-[12px] text-[var(--color-amber)] font-medium"
                >
                  <IconEdit size={13} stroke={1.5} /> {editingRate ? 'Save' : 'Edit'}
                </button>
              </div>
              {editingRate ? (
                <div className="relative w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-gray)]">₹</span>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={e => setHourlyRate(Number(e.target.value))}
                    className="w-full h-11 pl-7 pr-3 rounded-[10px] border border-[var(--color-amber)] text-[15px] font-bold text-[var(--color-dark)] focus:outline-none"
                  />
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
                <button className="flex items-center gap-1 text-[12px] text-[var(--color-amber)] font-medium">
                  <IconEdit size={13} stroke={1.5} /> Manage
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Coffee Date','Cultural Event','Fitness Session','Nature Walk','Concert'].map(s => (
                  <div key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-amber-light)] border border-[var(--color-amber)]/30">
                    <IconCheck size={11} stroke={2.5} className="text-[var(--color-amber)]" />
                    <span className="text-[12px] font-medium text-[var(--color-amber-dark)]">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[14px] font-semibold text-[var(--color-dark)]">Availability</p>
                  <p className="text-[11px] text-[var(--color-gray)] mt-0.5">Days and hours you're open for bookings</p>
                </div>
                <button
                  onClick={() => setEditingAvailability(e => !e)}
                  className="flex items-center gap-1 text-[12px] text-[var(--color-amber)] font-medium"
                >
                  <IconEdit size={13} stroke={1.5} /> {editingAvailability ? 'Save' : 'Edit'}
                </button>
              </div>

              {/* Day toggles */}
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
                        on
                          ? 'bg-[var(--color-amber)] text-white shadow-sm'
                          : 'bg-[var(--color-gray-light)] text-[var(--color-gray)]'
                      } ${editingAvailability ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}`}
                    >
                      {day.slice(0, 2)}
                    </button>
                  )
                })}
              </div>

              {/* Time range */}
              {editingAvailability ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-[var(--color-gray)] uppercase tracking-wide block mb-1">From</label>
                    <select
                      value={fromTime}
                      onChange={e => setFromTime(e.target.value)}
                      className="w-full h-10 px-3 rounded-[10px] border border-[var(--color-amber)] bg-white text-[13px] font-medium text-[var(--color-dark)] focus:outline-none appearance-none"
                    >
                      {['6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
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
                      {['1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[12px] text-[var(--color-gray)]">
                  <IconClock size={13} stroke={1.5} className="text-[var(--color-amber)]" />
                  <span className="font-medium text-[var(--color-dark)]">{fromTime} – {toTime}</span>
                  <span className="text-[var(--color-gray)]">·</span>
                  <span>{activeDays.size} days / week</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Payouts tab ── */}
        {tab === 'payouts' && (
          <>
            {/* Stripe status card */}
            <div className={`rounded-[16px] border p-5 ${stripeStatusCfg.bg} ${stripeStatusCfg.border}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-[10px] bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <IconBrandStripe size={22} stroke={1.5} className="text-[#635BFF]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[15px] font-bold text-[var(--color-dark)]">Stripe Connect</p>
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${stripeStatusCfg.color} bg-white/70`}>
                        {stripeStatusCfg.icon} {stripeStatusCfg.label}
                      </span>
                    </div>
                    {stripeData.status !== 'not_connected' && (
                      <p className="text-[12px] text-[var(--color-gray)]">
                        {stripeData.accountId} · {stripeData.email}
                      </p>
                    )}
                    {stripeData.status === 'active' && (
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[11px] text-[var(--color-success)] font-medium">
                          <IconCheck size={11} stroke={2.5} /> Charges enabled
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-[var(--color-success)] font-medium">
                          <IconCheck size={11} stroke={2.5} /> Payouts enabled
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-[var(--color-success)] font-medium">
                          <IconShieldCheck size={11} stroke={2} /> Identity verified
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#635BFF] text-white text-[12px] font-semibold flex-shrink-0 hover:opacity-90 transition-opacity">
                  <IconExternalLink size={13} stroke={1.5} />
                  {stripeData.status === 'not_connected' ? 'Connect Stripe' : 'Stripe Dashboard'}
                </button>
              </div>

              {stripeData.status === 'not_connected' && (
                <div className="mt-4 bg-white/60 rounded-[10px] p-3">
                  <p className="text-[12px] text-[var(--color-dark)] font-medium mb-1">Why connect Stripe?</p>
                  <p className="text-[11px] text-[var(--color-gray)] leading-relaxed">
                    Receive payouts directly to your Indian bank account. Stripe handles secure payments and instant transfers. Free to set up.
                  </p>
                </div>
              )}

              {stripeData.status === 'pending_verification' && (
                <div className="mt-4 bg-white/60 rounded-[10px] p-3 flex items-start gap-2">
                  <IconAlertCircle size={14} stroke={1.5} className="text-yellow-600 flex-none mt-0.5" />
                  <div>
                    <p className="text-[12px] font-semibold text-yellow-700">Action required</p>
                    <ul className="text-[11px] text-yellow-600 mt-1 space-y-0.5">
                      {stripeData.pendingRequirements.map(r => (
                        <li key={r} className="flex items-center gap-1.5"><IconX size={9} stroke={2} /> {r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Balance cards */}
            {stripeData.status === 'active' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
                    <p className="text-[11px] text-[var(--color-gray)] uppercase tracking-wide mb-1">Available</p>
                    <p className="text-[26px] font-black text-[var(--color-dark)]">₹{balance.available.toLocaleString()}</p>
                    <p className="text-[11px] text-[var(--color-gray)] mt-1">Ready to withdraw</p>
                    <button className="mt-3 w-full h-9 rounded-[10px] bg-[var(--color-amber)] text-white text-[12px] font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                      <IconArrowUpRight size={14} stroke={2} /> Withdraw
                    </button>
                  </div>
                  <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
                    <p className="text-[11px] text-[var(--color-gray)] uppercase tracking-wide mb-1">Pending</p>
                    <p className="text-[26px] font-black text-[var(--color-dark)]">₹{balance.pending.toLocaleString()}</p>
                    <p className="text-[11px] text-[var(--color-gray)] mt-1">Arrives {stripeData.nextPayoutDate}</p>
                    <div className="mt-3 w-full h-9 rounded-[10px] bg-[var(--color-gray-light)] text-[var(--color-gray)] text-[12px] font-medium flex items-center justify-center gap-1.5">
                      <IconClock size={13} stroke={1.5} /> In transit
                    </div>
                  </div>
                  <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
                    <p className="text-[11px] text-[var(--color-gray)] uppercase tracking-wide mb-1">Total earned</p>
                    <p className="text-[26px] font-black text-[var(--color-dark)]">₹{balance.totalEarned.toLocaleString()}</p>
                    <p className="text-[11px] text-[var(--color-gray)] mt-1">All time</p>
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-[var(--color-success)] font-medium">
                      <IconArrowDownRight size={13} stroke={2} /> +₹{balance.available.toLocaleString()} this month
                    </div>
                  </div>
                </div>

                {/* Payout settings */}
                <div className="bg-white rounded-[16px] border border-[var(--color-border)] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[14px] font-semibold text-[var(--color-dark)]">Payout Settings</p>
                    <button className="text-[12px] text-[var(--color-amber)] font-medium">Edit</button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[8px] bg-[var(--color-gray-light)] flex items-center justify-center">
                          <IconCurrencyRupee size={16} stroke={1.5} className="text-[var(--color-gray)]" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-[var(--color-dark)]">Bank account</p>
                          <p className="text-[11px] text-[var(--color-gray)]">HDFC ••••{stripeData.bankLast4}</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-[var(--color-success)] font-semibold bg-[var(--color-success-bg)] px-2 py-0.5 rounded-full">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[8px] bg-[var(--color-gray-light)] flex items-center justify-center">
                          <IconCalendarEvent size={16} stroke={1.5} className="text-[var(--color-gray)]" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-[var(--color-dark)]">Payout schedule</p>
                          <p className="text-[11px] text-[var(--color-gray)]">Every {stripeData.payoutSchedule}</p>
                        </div>
                      </div>
                      <span className="text-[12px] font-semibold text-[var(--color-dark)] capitalize">{stripeData.payoutSchedule}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[8px] bg-[var(--color-gray-light)] flex items-center justify-center">
                          <IconClock size={16} stroke={1.5} className="text-[var(--color-gray)]" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-[var(--color-dark)]">Next payout</p>
                          <p className="text-[11px] text-[var(--color-gray)]">Estimated arrival</p>
                        </div>
                      </div>
                      <span className="text-[12px] font-semibold text-[var(--color-amber)]">{stripeData.nextPayoutDate}</span>
                    </div>
                  </div>
                </div>

                {/* Payout history */}
                <div className="bg-white rounded-[16px] border border-[var(--color-border)] overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                    <p className="text-[14px] font-semibold text-[var(--color-dark)]">Payout History</p>
                    <button className="flex items-center gap-1 text-[12px] text-[var(--color-gray)]">
                      <IconRefresh size={13} stroke={1.5} /> Refresh
                    </button>
                  </div>
                  <div className="divide-y divide-[var(--color-border)]">
                    {payouts.map(p => {
                      const cfg = PAYOUT_STATUS[p.status]
                      return (
                        <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                            <IconCurrencyRupee size={15} stroke={1.5} className={cfg.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[var(--color-dark)]">₹{p.amount.toLocaleString()}</p>
                            <p className="text-[11px] text-[var(--color-gray)]">{p.description} · {p.date}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            {p.status === 'in_transit' && (
                              <p className="text-[10px] text-[var(--color-gray)] mt-0.5">Arrives {p.arrivalDate}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="px-5 py-3 border-t border-[var(--color-border)]">
                    <button className="w-full text-center text-[12px] text-[var(--color-amber)] font-medium flex items-center justify-center gap-1">
                      View all in Stripe Dashboard <IconExternalLink size={12} stroke={1.5} />
                    </button>
                  </div>
                </div>

                {/* Platform fee info */}
                <div className="flex items-start gap-3 bg-[var(--color-gray-light)] rounded-[12px] px-4 py-3">
                  <IconShieldCheck size={15} stroke={1.5} className="text-[var(--color-success)] flex-none mt-0.5" />
                  <p className="text-[11px] text-[var(--color-gray)] leading-relaxed">
                    Meytle retains a <span className="font-semibold text-[var(--color-dark)]">15% platform fee</span> on each session. Payouts are processed via Stripe and typically arrive within 1–2 business days depending on your schedule.
                  </p>
                </div>
              </>
            )}

            {/* Not connected CTA */}
            {stripeData.status === 'not_connected' && (
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
            )}
          </>
        )}

        {/* ── Settings tab ── */}
        {tab === 'settings' && (
          <>
            <div className="bg-white rounded-[16px] border border-[var(--color-border)] overflow-hidden">
              <p className="text-[12px] font-semibold text-[var(--color-gray)] uppercase tracking-wide px-5 py-3 border-b border-[var(--color-border)]">Notifications</p>
              {[
                { label: 'New booking requests',    sub: 'Get notified when someone requests your time', on: true },
                { label: 'Booking confirmations',   sub: 'When a booking is accepted or declined',       on: true },
                { label: 'Payout notifications',    sub: 'When funds are sent to your bank',             on: true },
                { label: 'Marketing & tips',        sub: 'Tips to improve your profile and earnings',    on: false },
              ].map(item => (
                <ToggleRow key={item.label} label={item.label} sub={item.sub} defaultOn={item.on} />
              ))}
            </div>

            <div className="bg-white rounded-[16px] border border-[var(--color-border)] overflow-hidden">
              <p className="text-[12px] font-semibold text-[var(--color-gray)] uppercase tracking-wide px-5 py-3 border-b border-[var(--color-border)]">Privacy</p>
              {[
                { label: 'Show profile to new users', sub: 'Your profile appears in Discover', on: true },
                { label: 'Show availability status',  sub: '"Available now" badge on your profile', on: true },
                { label: 'Allow direct messages',     sub: 'Users can message before booking',     on: false },
              ].map(item => (
                <ToggleRow key={item.label} label={item.label} sub={item.sub} defaultOn={item.on} />
              ))}
            </div>

            <div className="bg-white rounded-[16px] border border-[var(--color-border)] overflow-hidden">
              <p className="text-[12px] font-semibold text-[var(--color-gray)] uppercase tracking-wide px-5 py-3 border-b border-[var(--color-border)]">Account</p>
              {[
                { label: 'Change password', icon: <IconLock size={15} stroke={1.5} /> },
                { label: 'Linked email · aanya@gmail.com', icon: <IconBell size={15} stroke={1.5} /> },
                { label: 'Download my data', icon: <IconArrowUpRight size={15} stroke={1.5} /> },
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

      </div>
    </div>
  )
}

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
