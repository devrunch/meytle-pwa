import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconArrowRight, IconCheck, IconPlus, IconMinus,
  IconCamera, IconPhoto, IconId, IconMapPin, IconCoffee,
  IconCalendarEvent, IconShieldCheck, IconUsers, IconHeart,
  IconCurrencyRupee, IconAlertCircle,
} from '@tabler/icons-react'
import { ProgressBar, ScheduleGrid, Button } from '../../components/ui'
import MapView from '../../components/ui/MapView'
import { useToast } from '../../components/ui/Toast'
import type { ExperienceType } from '../../types'
import { createEmptySchedule } from '../../components/ui'
import type { ScheduleValue } from '../../components/ui/ScheduleGrid'
import { api } from '../../lib/api'

const TOTAL_STEPS = 7

const STEP_META = [
  { label: 'Services',     sub: 'What you offer',        icon: <IconCoffee size={16} stroke={1.5} /> },
  { label: 'Rate',         sub: 'Your hourly price',     icon: <IconCurrencyRupee size={16} stroke={1.5} /> },
  { label: 'About You',    sub: 'Interests & vibe',      icon: <IconHeart size={16} stroke={1.5} /> },
  { label: 'Availability', sub: 'Your schedule',         icon: <IconCalendarEvent size={16} stroke={1.5} /> },
  { label: 'Photos',       sub: 'Showcase yourself',     icon: <IconPhoto size={16} stroke={1.5} /> },
  { label: 'Selfie',       sub: 'Verify your face',      icon: <IconCamera size={16} stroke={1.5} /> },
  { label: 'Identity',     sub: 'Government ID',         icon: <IconId size={16} stroke={1.5} /> },
]

const ALL_SERVICES: { type: ExperienceType; label: string; icon: string }[] = [
  { type: 'coffee',   label: 'Coffee Dates',    icon: '☕' },
  { type: 'dining',   label: 'Fine Dining',     icon: '🍽️' },
  { type: 'concert',  label: 'Concerts',        icon: '🎵' },
  { type: 'travel',   label: 'Travel',          icon: '✈️' },
  { type: 'fitness',  label: 'Fitness',         icon: '🏃' },
  { type: 'culture',  label: 'Cultural Events', icon: '🎭' },
  { type: 'nature',   label: 'Nature Walks',    icon: '🌿' },
  { type: 'movies',   label: 'Movies',          icon: '🎬' },
]

const INTEREST_GROUPS = [
  {
    group: 'Activities',
    items: [
      { id: 'fitness',     label: 'Fitness',      emoji: '💪' },
      { id: 'hiking',      label: 'Hiking',       emoji: '🏔️' },
      { id: 'yoga',        label: 'Yoga',         emoji: '🧘' },
      { id: 'cycling',     label: 'Cycling',      emoji: '🚴' },
      { id: 'swimming',    label: 'Swimming',     emoji: '🏊' },
    ],
  },
  {
    group: 'Arts & Culture',
    items: [
      { id: 'movies',      label: 'Movies',       emoji: '🎬' },
      { id: 'live_music',  label: 'Live Music',   emoji: '🎵' },
      { id: 'theatre',     label: 'Theatre',      emoji: '🎭' },
      { id: 'art',         label: 'Art',          emoji: '🎨' },
      { id: 'photography', label: 'Photography',  emoji: '📷' },
    ],
  },
  {
    group: 'Food & Social',
    items: [
      { id: 'coffee',      label: 'Coffee',       emoji: '☕' },
      { id: 'fine_dining', label: 'Fine Dining',  emoji: '🍽️' },
      { id: 'cooking',     label: 'Cooking',      emoji: '👨‍🍳' },
      { id: 'cocktails',   label: 'Cocktails',    emoji: '🍹' },
      { id: 'brunch',      label: 'Brunch',       emoji: '🥞' },
    ],
  },
  {
    group: 'Lifestyle',
    items: [
      { id: 'travel',      label: 'Travel',       emoji: '✈️' },
      { id: 'books',       label: 'Books',        emoji: '📚' },
      { id: 'gaming',      label: 'Gaming',       emoji: '🎮' },
      { id: 'fashion',     label: 'Fashion',      emoji: '👗' },
      { id: 'wellness',    label: 'Wellness',     emoji: '🌿' },
    ],
  },
]

const PERSONALITY_TAGS = [
  'Adventurous', 'Laid-back', 'Intellectual', 'Funny', 'Sporty',
  'Artistic', 'Foodie', 'Night owl', 'Early bird', 'Social butterfly',
  'Deep conversations', 'Spontaneous', 'Planner', 'Outdoorsy', 'Homebody',
]

// ── Step 1: Services (no price, single rate later) ─────────────────────────
function StepServices({
  selected,
  onChange,
}: {
  selected: ExperienceType[]
  onChange: (s: ExperienceType[]) => void
}) {
  function toggle(type: ExperienceType) {
    selected.includes(type)
      ? onChange(selected.filter(t => t !== type))
      : onChange([...selected, type])
  }

  return (
    <div>
      <h2 className="text-[22px] font-semibold text-[var(--color-dark)] mb-1">What do you offer?</h2>
      <p className="text-[13px] text-[var(--color-gray)] mb-6">Select all the experiences you'd like to provide.</p>

      <div className="grid sm:grid-cols-2 gap-3">
        {ALL_SERVICES.map(svc => {
          const active = selected.includes(svc.type)
          return (
            <button
              key={svc.type}
              onClick={() => toggle(svc.type)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-[14px] border-2 transition-all text-left ${
                active
                  ? 'border-[var(--color-amber)] bg-[var(--color-amber-light)]'
                  : 'border-[var(--color-border)] bg-white hover:border-[var(--color-amber)]/40'
              }`}
            >
              <span className="text-[22px] leading-none">{svc.icon}</span>
              <span className={`flex-1 text-[14px] font-medium ${active ? 'text-[var(--color-amber-dark)]' : 'text-[var(--color-dark)]'}`}>
                {svc.label}
              </span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                active ? 'bg-[var(--color-amber)] border-[var(--color-amber)]' : 'border-[var(--color-border)]'
              }`}>
                {active && <IconCheck size={11} stroke={2.5} color="white" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 2: Rate ─────────────────────────────────────────────────────────────
function StepRate({ rate, onChange }: { rate: number; onChange: (r: number) => void }) {
  const presets = [500, 800, 1000, 1200, 1500, 2000]
  return (
    <div className="max-w-[480px]">
      <h2 className="text-[22px] font-semibold text-[var(--color-dark)] mb-1">Set your hourly rate</h2>
      <p className="text-[13px] text-[var(--color-gray)] mb-6">
        This rate applies to all your services. You can change it anytime.
      </p>

      {/* Big rate display + stepper */}
      <div className="bg-white border border-[var(--color-border)] rounded-[16px] p-6 mb-5 flex flex-col items-center gap-4">
        <p className="text-[12px] font-semibold text-[var(--color-gray)] uppercase tracking-wider">Your hourly rate</p>
        <div className="flex items-center gap-5">
          <button
            onClick={() => onChange(Math.max(100, rate - 100))}
            className="w-10 h-10 rounded-full bg-[var(--color-gray-light)] border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-amber)] transition-colors"
          >
            <IconMinus size={16} stroke={2} className="text-[var(--color-dark)]" />
          </button>
          <div className="text-center">
            <p className="text-[42px] font-bold text-[var(--color-dark)] leading-none">₹{rate.toLocaleString()}</p>
            <p className="text-[12px] text-[var(--color-gray)] mt-1">per hour</p>
          </div>
          <button
            onClick={() => onChange(rate + 100)}
            className="w-10 h-10 rounded-full bg-[var(--color-gray-light)] border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-amber)] transition-colors"
          >
            <IconPlus size={16} stroke={2} className="text-[var(--color-dark)]" />
          </button>
        </div>
      </div>

      {/* Presets */}
      <p className="text-[12px] text-[var(--color-gray)] mb-2.5">Quick select</p>
      <div className="grid grid-cols-3 gap-2">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`py-2.5 rounded-[10px] text-[13px] font-semibold border-2 transition-all ${
              rate === p
                ? 'border-[var(--color-amber)] bg-[var(--color-amber-light)] text-[var(--color-amber-dark)]'
                : 'border-[var(--color-border)] bg-white text-[var(--color-dark)] hover:border-[var(--color-amber)]/40'
            }`}
          >
            ₹{p.toLocaleString()}
          </button>
        ))}
      </div>

      <div className="mt-4 bg-[var(--color-amber-light)] rounded-[10px] px-3 py-2.5">
        <p className="text-[11px] text-[var(--color-amber-dark)]">
          💡 Companions earning ₹800–₹1,200/hr get the most bookings in your city.
        </p>
      </div>
    </div>
  )
}

// ── Step 3: Interests / About You ─────────────────────────────────────────────
function StepInterests({
  displayName,
  selected,
  tags,
  onDisplayName,
  onSelected,
  onTags,
}: {
  displayName: string
  selected: string[]
  tags: string[]
  onDisplayName: (v: string) => void
  onSelected: (s: string[]) => void
  onTags: (t: string[]) => void
}) {
  const [nameTouched, setNameTouched] = useState(false)
  const nameError = nameTouched && !displayName.trim() ? 'Display name is required' : ''

  function toggleInterest(id: string) {
    selected.includes(id)
      ? onSelected(selected.filter(i => i !== id))
      : onSelected([...selected, id])
  }
  function toggleTag(t: string) {
    tags.includes(t)
      ? onTags(tags.filter(x => x !== t))
      : onTags([...tags, t])
  }

  return (
    <div>
      <h2 className="text-[22px] font-semibold text-[var(--color-dark)] mb-1">About you</h2>
      <p className="text-[13px] text-[var(--color-gray)] mb-6">
        Tell clients who you are. Pick your interests and personality traits too.
      </p>

      {/* Display name */}
      <div className="mb-7 max-w-[320px]">
        <label className="block text-[12px] font-semibold text-[var(--color-gray)] uppercase tracking-wider mb-1.5">
          Display name <span className="text-[var(--color-error)]">*</span>
        </label>
        <input
          type="text"
          value={displayName}
          onChange={e => onDisplayName(e.target.value)}
          onBlur={() => setNameTouched(true)}
          placeholder="e.g. Aanya K."
          maxLength={40}
          className={`w-full h-11 px-3 rounded-[10px] border text-[13px] text-[var(--color-dark)] focus:outline-none focus:border-[var(--color-amber)] transition-colors ${
            nameError ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'
          }`}
        />
        {nameError ? (
          <p className="text-[11px] text-[var(--color-error)] mt-1 flex items-center gap-1">
            <IconAlertCircle size={11} />{nameError}
          </p>
        ) : (
          <p className="text-[11px] text-[var(--color-gray)] mt-1">Shown on your public profile</p>
        )}
      </div>

      {/* Interest groups */}
      <div className="flex flex-col gap-5 mb-6">
        {INTEREST_GROUPS.map(group => (
          <div key={group.group}>
            <p className="text-[11px] font-semibold text-[var(--color-gray)] uppercase tracking-wider mb-2.5">{group.group}</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {group.items.map(item => {
                const active = selected.includes(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleInterest(item.id)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-[12px] border-2 transition-all ${
                      active
                        ? 'border-[var(--color-amber)] bg-[var(--color-amber-light)]'
                        : 'border-[var(--color-border)] bg-white hover:border-[var(--color-amber)]/40'
                    }`}
                  >
                    <span className="text-[24px] leading-none">{item.emoji}</span>
                    <span className={`text-[10px] font-semibold text-center leading-tight ${
                      active ? 'text-[var(--color-amber-dark)]' : 'text-[var(--color-gray)]'
                    }`}>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Personality tags */}
      <div>
        <p className="text-[11px] font-semibold text-[var(--color-gray)] uppercase tracking-wider mb-2.5">Your vibe</p>
        <div className="flex flex-wrap gap-2">
          {PERSONALITY_TAGS.map(t => {
            const active = tags.includes(t)
            return (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                  active
                    ? 'bg-[var(--color-amber)] border-[var(--color-amber)] text-white'
                    : 'bg-white border-[var(--color-border)] text-[var(--color-gray)] hover:border-[var(--color-amber)]/50'
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>
        {(selected.length > 0 || tags.length > 0) && (
          <p className="text-[11px] text-[var(--color-amber)] mt-3">
            {selected.length} interest{selected.length !== 1 ? 's' : ''} + {tags.length} personality tag{tags.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>
    </div>
  )
}

// ── Step 4: Availability ─────────────────────────────────────────────────────
function StepAvailability({ schedule, onChange }: { schedule: ScheduleValue; onChange: (s: ScheduleValue) => void }) {
  return (
    <div>
      <h2 className="text-[22px] font-semibold text-[var(--color-dark)] mb-1">When are you available?</h2>
      <p className="text-[13px] text-[var(--color-gray)] mb-6">Set the days and hours you're open for bookings.</p>
      <ScheduleGrid value={schedule} onChange={onChange} />
    </div>
  )
}

// ── Step 5: Photos ────────────────────────────────────────────────────────────
function StepPhotos({
  photos,
  uploading,
  onRemove,
  onFilesSelected,
}: {
  photos: string[]
  uploading: boolean
  onRemove: (i: number) => void
  onFilesSelected: (files: FileList) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <h2 className="text-[22px] font-semibold text-[var(--color-dark)] mb-1">Add your photos</h2>
      <p className="text-[13px] text-[var(--color-gray)] mb-6">Upload at least 3 photos. Clear, well-lit photos get more bookings.</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) onFilesSelected(e.target.files); e.target.value = '' }}
      />

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
        {photos.map((url, i) => (
          <div key={url} className="aspect-square rounded-[12px] overflow-hidden bg-[var(--color-gray-light)] relative group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <div className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">Main</div>
            )}
            <button
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] font-bold hidden group-hover:flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ))}

        {uploading ? (
          <div className="aspect-square rounded-[12px] border-2 border-dashed border-[var(--color-amber)] bg-[var(--color-amber-light)]/30 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-[var(--color-amber)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-[var(--color-amber)]">Uploading…</span>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-[12px] border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center gap-2 hover:border-[var(--color-amber)] hover:bg-[var(--color-amber-light)]/30 transition-all"
          >
            <IconPhoto size={22} stroke={1.2} className="text-[var(--color-gray)]" />
            <span className="text-[10px] text-[var(--color-gray)]">Add photo</span>
          </button>
        )}
      </div>

      {photos.length < 3 ? (
        <div className="flex items-center gap-2 bg-[var(--color-error-bg)] rounded-[10px] px-3 py-2.5">
          <span className="text-[12px] text-[var(--color-error)]">Add at least {3 - photos.length} more photo{3 - photos.length > 1 ? 's' : ''} to continue.</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-[var(--color-success-bg)] rounded-[10px] px-3 py-2.5">
          <IconCheck size={13} stroke={2} className="text-[var(--color-success)]" />
          <span className="text-[12px] text-[var(--color-success)] font-medium">Looking great! You can add more photos.</span>
        </div>
      )}
    </div>
  )
}

// ── Step 6: Selfie ────────────────────────────────────────────────────────────
function StepSelfie({ captured, onCapture }: { captured: boolean; onCapture: () => void }) {
  return (
    <div className="max-w-[400px]">
      <h2 className="text-[22px] font-semibold text-[var(--color-dark)] mb-1">Take a selfie</h2>
      <p className="text-[13px] text-[var(--color-gray)] mb-6">We verify your profile photo is real. Make sure your face is clearly visible.</p>

      <div className="aspect-square rounded-[24px] bg-[var(--color-gray-light)] border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center overflow-hidden mb-5">
        {captured ? (
          <div className="w-full h-full bg-[var(--color-amber-light)] flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-[var(--color-amber)] flex items-center justify-center mb-4 shadow-lg">
              <IconCheck size={36} stroke={2} color="white" />
            </div>
            <p className="text-[16px] font-semibold text-[var(--color-amber-dark)]">Selfie captured!</p>
          </div>
        ) : (
          <>
            <IconCamera size={48} stroke={1} className="text-[var(--color-gray)] mb-4" />
            <p className="text-[13px] text-[var(--color-gray)] text-center px-8">Position your face in the frame</p>
          </>
        )}
      </div>

      <button onClick={onCapture} className="w-full h-12 rounded-[12px] bg-[var(--color-dark)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-3">
        <IconCamera size={18} stroke={1.5} />
        {captured ? 'Retake Selfie' : 'Open Camera'}
      </button>
      <p className="text-[11px] text-[var(--color-gray)] text-center">Selfie is only used for verification and never shown publicly.</p>
    </div>
  )
}

// ── Step 7: ID ─────────────────────────────────────────────────────────────────
function StepID({ captured, onCapture }: { captured: boolean; onCapture: () => void }) {
  return (
    <div className="max-w-[480px]">
      <h2 className="text-[22px] font-semibold text-[var(--color-dark)] mb-1">Verify your identity</h2>
      <p className="text-[13px] text-[var(--color-gray)] mb-6">Upload a government-issued ID (Aadhaar, PAN, Passport, or Driver's License).</p>

      <div className="flex flex-col gap-3 mb-5">
        {['Front of ID', 'Back of ID'].map((side, i) => (
          <button
            key={side}
            onClick={onCapture}
            className={`w-full h-32 rounded-[14px] border-2 flex flex-col items-center justify-center gap-2 transition-all ${
              captured && i === 0
                ? 'border-[var(--color-success)] bg-[var(--color-success-bg)]'
                : 'border-dashed border-[var(--color-border)] bg-[var(--color-gray-light)] hover:border-[var(--color-amber)] hover:bg-[var(--color-amber-light)]/30'
            }`}
          >
            {captured && i === 0 ? (
              <>
                <div className="w-12 h-12 rounded-full bg-[var(--color-success)] flex items-center justify-center">
                  <IconCheck size={22} stroke={2} color="white" />
                </div>
                <span className="text-[13px] font-medium text-[var(--color-success)]">Front captured</span>
              </>
            ) : (
              <>
                <IconId size={32} stroke={1.2} className="text-[var(--color-gray)]" />
                <span className="text-[12px] text-[var(--color-gray)]">{side} — tap to capture or upload</span>
              </>
            )}
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-amber-light)] rounded-[12px] px-4 py-3.5 flex gap-3">
        <IconShieldCheck size={18} stroke={1.5} className="text-[var(--color-amber)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-[var(--color-amber-dark)] mb-1">Why we need this</p>
          <p className="text-[12px] text-[var(--color-amber)] leading-relaxed">
            Your ID is encrypted and only reviewed by our safety team — it's never shared with other users.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Service area step ──────────────────────────────────────────────────────────
function StepServiceArea() {
  return (
    <div>
      <h2 className="text-[22px] font-semibold text-[var(--color-dark)] mb-1">Where do you operate?</h2>
      <p className="text-[13px] text-[var(--color-gray)] mb-4">
        Draw your service areas on the map. Use <strong>Draw</strong> for freeform or <strong>Circle</strong> for a radius.
      </p>
      <div className="rounded-[14px] overflow-hidden border border-[var(--color-border)]" style={{ height: 420 }}>
        <MapView drawMode={true} height={420} className="w-full h-full" />
      </div>
      <div className="mt-3 flex items-center gap-2 bg-[var(--color-amber-light)] rounded-[10px] px-3 py-2.5">
        <IconMapPin size={14} stroke={1.5} className="text-[var(--color-amber)] flex-none" />
        <p className="text-[12px] text-[var(--color-amber-dark)]">You can add multiple areas and adjust them from your dashboard.</p>
      </div>
    </div>
  )
}

// ── Schedule conversion helpers ────────────────────────────────────────────

const DAY_TO_NUM: Record<string, number> = {
  mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6,
}

function parseTimeToHHMM(t: string): string {
  const [time, period] = t.split(' ')
  const [h, m] = time.split(':').map(Number)
  let hour = h
  if (period === 'PM' && h !== 12) hour += 12
  if (period === 'AM' && h === 12) hour = 0
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function scheduleToSlots(schedule: ScheduleValue) {
  return Array.from(schedule.days).map(day => ({
    dayOfWeek: DAY_TO_NUM[day],
    fromTime: parseTimeToHHMM(schedule.from),
    toTime: parseTimeToHHMM(schedule.to),
  }))
}

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [services, setServices]           = useState<ExperienceType[]>([])
  const [rate, setRate]                   = useState(1000)
  const [displayName, setDisplayName]     = useState('')
  const [interests, setInterests]         = useState<string[]>([])
  const [personalityTags, setPersonality] = useState<string[]>([])
  const [schedule, setSchedule]           = useState<ScheduleValue>(createEmptySchedule())
  const [photos, setPhotos]               = useState<string[]>([])
  const [photoUploading, setPhotoUploading] = useState(false)
  const [selfieCaptured, setSelfieCaptured] = useState(false)
  const [idCaptured, setIdCaptured]         = useState(false)

  async function handlePhotoFiles(files: FileList) {
    setPhotoUploading(true)
    try {
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append('file', file)
        const res = await api.post<{ url: string }>('/uploads/photo', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setPhotos(prev => [...prev, res.data.url])
      }
    } catch {
      // individual upload failures are silent — the grid just won't grow
    } finally {
      setPhotoUploading(false)
    }
  }

  function canProceed() {
    if (step === 1) return services.length > 0
    if (step === 3) return displayName.trim().length > 0
    if (step === 5) return photos.length >= 3 && !photoUploading
    return true
  }

  async function next() {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1)
      return
    }

    // Final step — submit
    setSubmitting(true)
    setSubmitError(null)
    try {
      const bio = [...interests, ...personalityTags].join(', ')

      await api.post('/companions/me', {
        displayName: displayName.trim(),
        bio: bio || undefined,
        profilePhotoUrl: photos[0],
        hourlyRatePaisa: rate * 100,
        serviceAreaCentre: [77.209, 28.6139], // Delhi NCR default
        serviceAreaRadiusKm: 25,
        services,
      })

      const slots = scheduleToSlots(schedule)
      if (slots.length > 0) {
        await api.put('/companions/me/availability', { slots })
      }

      toast('success', 'Profile submitted!', 'Your application is under review.')
      navigate('/app/companion/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      const detail = typeof msg === 'string' ? msg : 'Please try again.'
      setSubmitError(detail)
      toast('error', 'Submission failed', detail)
    } finally {
      setSubmitting(false)
    }
  }

  function back() {
    if (step > 1) setStep(s => s - 1)
    else navigate('/app')
  }

  return (
    <div className="min-h-full bg-[var(--color-bg)]">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-[var(--color-border)] h-[52px] flex items-center px-5 gap-4">
        <button onClick={back} className="flex items-center gap-1.5 text-[13px] text-[var(--color-gray)] hover:text-[var(--color-dark)] transition-colors">
          <IconArrowLeft size={15} stroke={1.5} /> Back
        </button>
        <div className="flex-1 hidden md:block">
          <ProgressBar value={(step / TOTAL_STEPS) * 100} />
        </div>
        <span className="text-[12px] text-[var(--color-gray)] hidden md:block">Step {step} of {TOTAL_STEPS}</span>
        <button onClick={() => navigate('/app')} className="text-[12px] text-[var(--color-gray)] hover:text-[var(--color-dark)] transition-colors ml-auto md:ml-0">
          Save & exit
        </button>
      </div>

      {/* ── Mobile progress ── */}
      <div className="md:hidden bg-white border-b border-[var(--color-border)] px-4 pb-3 pt-2">
        <ProgressBar value={(step / TOTAL_STEPS) * 100} />
        <p className="text-[11px] text-[var(--color-gray)] mt-1.5">{STEP_META[step - 1].label} · Step {step} of {TOTAL_STEPS}</p>
      </div>

      {/* ── Body ── */}
      <div className="flex">

        {/* ── Left sidebar ── */}
        <aside className="hidden md:flex flex-col w-[260px] flex-shrink-0 bg-white border-r border-[var(--color-border)] py-8 px-5 sticky top-[52px] h-[calc(100vh-104px)] overflow-y-auto self-start">
          <div className="mb-8 px-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-[8px] bg-[var(--color-amber)] flex items-center justify-center">
                <IconUsers size={14} stroke={1.5} color="white" />
              </div>
              <span className="text-[13px] font-semibold text-[var(--color-dark)]">Become a Companion</span>
            </div>
            <p className="text-[11px] text-[var(--color-gray)] pl-9">Complete all {TOTAL_STEPS} steps to go live</p>
          </div>

          <div className="flex flex-col gap-1 relative">
            <div className="absolute left-[15px] top-7 bottom-7 w-px bg-[var(--color-border)]" />
            {STEP_META.map((s, i) => {
              const n = i + 1
              const done = n < step
              const current = n === step
              return (
                <div key={s.label} className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] relative z-10 ${current ? 'bg-[var(--color-amber-light)]' : ''}`}>
                  <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                    done    ? 'bg-[var(--color-amber)] border-[var(--color-amber)]' :
                    current ? 'bg-[var(--color-amber)] border-[var(--color-amber)] ring-4 ring-[var(--color-amber-light)]' :
                              'bg-white border-[var(--color-border)]'
                  }`}>
                    {done
                      ? <IconCheck size={13} stroke={2.5} color="white" />
                      : <span className={`text-[11px] font-bold ${current ? 'text-white' : 'text-[var(--color-gray)]'}`}>{n}</span>
                    }
                  </div>
                  <div>
                    <p className={`text-[13px] font-medium leading-none ${current ? 'text-[var(--color-amber-dark)]' : done ? 'text-[var(--color-dark)]' : 'text-[var(--color-gray)]'}`}>{s.label}</p>
                    <p className={`text-[10px] mt-0.5 ${current ? 'text-[var(--color-amber)]' : 'text-[var(--color-gray)]'}`}>{s.sub}</p>
                  </div>
                  {done && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center">
                      <IconCheck size={9} stroke={2.5} className="text-[var(--color-success)]" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-auto pt-6 px-1">
            <div className="flex items-start gap-2 bg-[var(--color-gray-light)] rounded-[10px] p-3">
              <IconHeart size={14} stroke={1.5} className="text-[var(--color-amber)] mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-[var(--color-gray)] leading-relaxed">
                Verified companions earn <span className="font-semibold text-[var(--color-dark)]">3× more</span> than unverified profiles.
              </p>
            </div>
          </div>
        </aside>

        {/* ── Right: content ── */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 px-5 md:px-10 py-8 pb-24">
            <div className="max-w-[680px]">
              {step === 1 && <StepServices selected={services} onChange={setServices} />}
              {step === 2 && <StepRate rate={rate} onChange={setRate} />}
              {step === 3 && (
                <StepInterests
                  displayName={displayName}
                  selected={interests}
                  tags={personalityTags}
                  onDisplayName={setDisplayName}
                  onSelected={setInterests}
                  onTags={setPersonality}
                />
              )}
              {step === 4 && <StepAvailability schedule={schedule} onChange={setSchedule} />}
              {step === 4 && false && <StepServiceArea />}
              {step === 5 && (
                <StepPhotos
                  photos={photos}
                  uploading={photoUploading}
                  onRemove={i => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                  onFilesSelected={handlePhotoFiles}
                />
              )}
              {step === 6 && <StepSelfie captured={selfieCaptured} onCapture={() => setSelfieCaptured(true)} />}
              {step === 7 && <StepID captured={idCaptured} onCapture={() => setIdCaptured(true)} />}
            </div>
          </div>

          {/* ── Bottom CTA ── */}
          <div className="sticky bottom-0 bg-white border-t border-[var(--color-border)] px-5 md:px-10 py-4 flex flex-col gap-2">
            {submitError && (
              <div className="flex items-center gap-2 bg-[var(--color-error-bg)] rounded-[10px] px-3 py-2">
                <IconAlertCircle size={14} stroke={1.5} className="text-[var(--color-error)] flex-none" />
                <p className="text-[12px] text-[var(--color-error)]">{submitError}</p>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <div>
                {step === 1 && services.length === 0 && (
                  <p className="text-[12px] text-[var(--color-gray)]">Select at least one service</p>
                )}
                {step === 3 && !displayName.trim() && (
                  <p className="text-[12px] text-[var(--color-gray)]">Display name is required</p>
                )}
                {step === 5 && photoUploading && (
                  <p className="text-[12px] text-[var(--color-gray)]">Uploading…</p>
                )}
                {step === 5 && !photoUploading && photos.length < 3 && (
                  <p className="text-[12px] text-[var(--color-gray)]">Need {3 - photos.length} more photo{3 - photos.length > 1 ? 's' : ''}</p>
                )}
              </div>
              <Button size="lg" onClick={next} disabled={!canProceed() || submitting} className="min-w-[160px]">
                <span className="flex items-center justify-center gap-2">
                  {submitting
                    ? 'Submitting…'
                    : step === TOTAL_STEPS
                      ? <><IconCheck size={16} stroke={2} /> Submit Application</>
                      : <>Continue <IconArrowRight size={16} stroke={2} /></>
                  }
                </span>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
