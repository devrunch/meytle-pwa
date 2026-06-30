import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconArrowLeft, IconArrowRight, IconCamera, IconLoader2, IconCheck,
  IconMapPin, IconCurrencyDollar, IconStar, IconX, IconUser,
  IconFileText, IconLayoutGrid, IconRocket, IconCircleCheck,
  IconCoffee, IconToolsKitchen2, IconMusic, IconPlane, IconRun,
  IconPalette, IconLeaf, IconMovie, IconShoppingBag, IconDeviceGamepad,
  IconClock, IconBrandStripe, IconWallet, IconChevronUp, IconChevronDown,
  IconHeart, IconTags, IconMessageDots, IconShieldCheck, IconCurrentLocation,
} from '@tabler/icons-react';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import { ConnectComponentsProvider, ConnectAccountOnboarding } from '@stripe/react-connect-js';
import { MapContainer, TileLayer, ZoomControl, useMap, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { ServiceType, CompanionProfile } from '../../types';

// ── Constants ──────────────────────────────────────────────────────────────────

const SERVICES: {
  value: ServiceType;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  { value: 'coffee',   label: 'Coffee',   icon: IconCoffee,         desc: 'Café hangouts & conversations' },
  { value: 'dining',   label: 'Dining',   icon: IconToolsKitchen2,  desc: 'Restaurants & food experiences' },
  { value: 'concert',  label: 'Concerts', icon: IconMusic,          desc: 'Live music & events' },
  { value: 'travel',   label: 'Travel',   icon: IconPlane,          desc: 'Trips & adventures' },
  { value: 'fitness',  label: 'Fitness',  icon: IconRun,            desc: 'Workouts & outdoor activities' },
  { value: 'culture',  label: 'Culture',  icon: IconPalette,        desc: 'Museums, art & theatre' },
  { value: 'nature',   label: 'Nature',   icon: IconLeaf,           desc: 'Parks, hikes & outdoors' },
  { value: 'movies',   label: 'Movies',   icon: IconMovie,          desc: 'Cinema & streaming nights' },
  { value: 'shopping', label: 'Shopping', icon: IconShoppingBag,    desc: 'Retail therapy partner' },
  { value: 'gaming',   label: 'Gaming',   icon: IconDeviceGamepad,  desc: 'Gaming sessions & esports' },
];

const RATE_PRESETS = [15, 25, 50, 75, 100];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const INTEREST_TAGS = [
  'Travel', 'Coffee', 'Dining', 'Hiking', 'Fitness', 'Music',
  'Concerts', 'Art', 'Museums', 'Cinema', 'Gaming', 'Reading',
  'Photography', 'Cooking', 'Fashion', 'Sports', 'Dancing',
  'Yoga', 'Nightlife', 'Karaoke', 'Adventure', 'Comedy',
  'Theatre', 'Road Trips',
] as const;

const PROMPTS = [
  'My go-to weekend...',
  "I'm known for...",
  'I get excited about...',
  'My hidden talent...',
  'The best way to spend a Sunday...',
  "I'm weirdly good at...",
  'Things I could talk about for hours...',
  'My love language...',
] as const;

// ── Time picker helpers ────────────────────────────────────────────────────────

const DAY_START_MINS = 6 * 60;   // 6:00 AM — earliest fromTime
const DAY_END_MINS   = 23 * 60;  // 11:00 PM — latest toTime
const MIN_GAP_MINS   = 60;       // minimum 1-hour window

function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function toTimeStr(totalMins: number): string {
  const clamped = Math.max(DAY_START_MINS, Math.min(DAY_END_MINS, Math.round(totalMins / 30) * 30));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function to12h(t: string) {
  const m = toMins(t);
  const h24 = Math.floor(m / 60);
  const min = String(m % 60).padStart(2, '0');
  const ampm: 'AM' | 'PM' = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return { h: h12, min, ampm };
}

function durLabel(from: string, to: string): string {
  const diff = toMins(to) - toMins(from);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function TimeSpinner({
  value, onChange, min, max, label,
}: { value: string; onChange: (v: string) => void; min: number; max: number; label: string }) {
  const cur = toMins(value);
  const canUp   = cur + 30 <= max;
  const canDown = cur - 30 >= min;
  const { h, min: minStr, ampm } = to12h(value);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] font-bold text-muted uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-1.5 bg-white border border-border rounded-xl px-2.5 py-1.5 shadow-sm select-none">
        <div className="flex flex-col">
          <button
            onClick={() => canUp && onChange(toTimeStr(cur + 30))}
            className={`w-4 h-3.5 flex items-center justify-center rounded transition-colors ${canUp ? 'text-muted hover:text-accent-green active:scale-95' : 'text-border cursor-default'}`}>
            <IconChevronUp size={11} stroke={2.5} />
          </button>
          <button
            onClick={() => canDown && onChange(toTimeStr(cur - 30))}
            className={`w-4 h-3.5 flex items-center justify-center rounded transition-colors ${canDown ? 'text-muted hover:text-accent-green active:scale-95' : 'text-border cursor-default'}`}>
            <IconChevronDown size={11} stroke={2.5} />
          </button>
        </div>
        <div className="leading-none text-center">
          <span className="text-sm font-extrabold text-heading tabular-nums">{h}:{minStr}</span>
          <span className={`text-[10px] font-bold ml-[2px] ${ampm === 'AM' ? 'text-blue-400' : 'text-amber-400'}`}>{ampm}</span>
        </div>
      </div>
    </div>
  );
}

function RangeBar({ fromTime, toTime }: { fromTime: string; toTime: string }) {
  const span      = DAY_END_MINS - DAY_START_MINS;
  const leftPct   = ((toMins(fromTime) - DAY_START_MINS) / span) * 100;
  const widthPct  = ((toMins(toTime)   - toMins(fromTime)) / span) * 100;
  const labels    = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '11PM'];

  return (
    <div className="mt-2 px-0.5">
      <div className="relative h-2 bg-border/60 rounded-full overflow-hidden">
        <div className="absolute h-full rounded-full"
          style={{
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            background: 'linear-gradient(90deg,#00D4AA,#4F8CFF)',
          }} />
      </div>
      <div className="flex justify-between mt-1">
        {labels.map((l) => (
          <span key={l} className="text-[8px] text-muted/50 font-medium">{l}</span>
        ))}
      </div>
    </div>
  );
}

const STEP_COPY = [
  { headline: 'Turn your time\ninto earnings',      sub: 'Join companions earning $10K+ a month doing what they love.' },
  { headline: 'Your name is your\nbrand',           sub: 'A great display name makes clients remember you.' },
  { headline: 'Bios get 2×\nmore bookings',        sub: 'Clients connect with your story before they ever book.' },
  { headline: 'Faces build\ntrust instantly',       sub: 'Profiles with photos receive 3× more booking requests.' },
  { headline: 'Show what you\nlove',               sub: 'Interests help clients find their perfect match faster.' },
  { headline: 'Stand out from\nthe crowd',         sub: 'A great prompt answer gets 2× more profile visits.' },
  { headline: 'Pick your\npassions',               sub: 'Clients search by experience type — be their perfect match.' },
  { headline: 'You control\nthe terms',            sub: 'Fair, transparent pricing that works for your schedule.' },
  { headline: 'Be discoverable\nlocally',          sub: 'Nearby clients book faster and leave better reviews.' },
  { headline: 'Set your\nschedule',                sub: "Clients see when you're open — more bookings, fewer surprises." },
  { headline: 'One last\nstep',                   sub: 'Read and accept the Companion Agreement to complete your registration.' },
  { headline: 'Almost there —\nyou\'re ready',    sub: 'Review your profile before we send it for verification.' },
  { headline: 'Build trust\ninstantly',            sub: 'A verified badge makes clients feel safe — and boosts bookings.' },
  { headline: 'Get paid for\nevery session',       sub: 'Connect your bank account so we can send you money instantly.' },
];

// ── Types ──────────────────────────────────────────────────────────────────────

type DaySlot = { enabled: boolean; fromTime: string; toTime: string };
const DEFAULT_SLOT: DaySlot = { enabled: false, fromTime: '09:00', toTime: '21:00' };

interface FormData {
  displayName: string;
  bio: string;
  profilePhotoUrl: string;
  interests: string[];
  prompt: { question: string; answer: string };
  services: ServiceType[];
  hourlyRate: number;
  areaLabel: string;
  radiusKm?: number;
  coords: [number, number];
  selectedAreaIds: string[];
  slots: DaySlot[];
  selfieUrl: string;
  govtIdFrontUrl: string;
  agreed: boolean;
}

const INITIAL: FormData = {
  displayName: '',
  bio: '',
  profilePhotoUrl: '',
  interests: [],
  prompt: { question: '', answer: '' },
  services: [],
  hourlyRate: 15,
  areaLabel: '',
  radiusKm: undefined,
  coords: [0, 0],
  selectedAreaIds: [],
  slots: Array(7).fill(null).map(() => ({ ...DEFAULT_SLOT })),
  selfieUrl: '',
  govtIdFrontUrl: '',
  agreed: false,
};

// Steps: 0=welcome 1=name 2=bio 3=photo 4=interests 5=prompt 6=services 7=rate 8=location 9=availability 10=agreement 11=review 12=identity 13=payout
const TOTAL_STEPS = 14;

// ── Left panel: live preview ────────────────────────────────────────────────────

function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function LivePreviewCard({ data }: { data: FormData }) {
  const user = useAuthStore((s) => s.user);
  const age = calcAge(user?.dateOfBirth);
  const initial = data.displayName?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="relative w-55 h-85 rounded-3xl overflow-hidden shadow-2xl border border-white/10 select-none">
      {/* Photo / placeholder */}
      {data.profilePhotoUrl ? (
        <img src={data.profilePhotoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(160deg,#00A896,#4F8CFF)' }}>
          <span className="text-6xl font-extrabold text-white/80">{initial}</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 45%, transparent 70%)' }} />

      {/* Verified badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
        <IconShieldCheck size={11} className="text-teal-300" />
        <span className="text-[10px] text-teal-200 font-bold">Verified</span>
      </div>

      {/* Rate badge */}
      {data.hourlyRate >= 20 && (
        <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
          <span className="text-[10px] text-white font-bold">
            ${data.hourlyRate.toLocaleString('en-US')}/hr
          </span>
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {/* Name + age */}
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-white text-xl font-extrabold leading-tight">
            {data.displayName || 'Your Name'}
          </p>
          {age && <span className="text-white/70 text-base font-medium">{age}</span>}
        </div>

        {/* Prompt card */}
        {data.prompt.answer && (
          <div className="mb-2.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
            <p className="text-[9px] text-white/50 font-semibold uppercase tracking-wide mb-0.5">
              {data.prompt.question}
            </p>
            <p className="text-[11px] text-white leading-snug line-clamp-2">{data.prompt.answer}</p>
          </div>
        )}

        {/* Interest tags */}
        {data.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {data.interests.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/25">
                {tag}
              </span>
            ))}
            {data.interests.length > 3 && (
              <span className="text-[10px] text-white/50 self-center">+{data.interests.length - 3}</span>
            )}
          </div>
        )}

        {/* Service tags */}
        {data.interests.length === 0 && data.services.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {data.services.slice(0, 3).map((s) => {
              const svc = SERVICES.find((x) => x.value === s);
              return svc ? (
                <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/25">
                  {svc.label}
                </span>
              ) : null;
            })}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-5 mt-1">
          <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
            <IconStar size={16} className="text-amber-300 fill-amber-300" />
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
            <IconHeart size={20} className="text-white fill-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LeftPanel({ step, data }: { step: number; data: FormData }) {
  const copy = STEP_COPY[step] ?? STEP_COPY[0];
  return (
    <div
      className="hidden md:flex flex-col justify-between p-10 lg:p-14 shrink-0 w-100 lg:w-115"
      style={{ background: 'linear-gradient(160deg,#00A896 0%,#00C2D8 40%,#4F8CFF 100%)' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/20">
          <IconStar size={16} className="text-white fill-white" />
        </div>
        <span className="text-white font-extrabold text-lg tracking-tight">meytle</span>
      </div>

      <div className="flex flex-col items-center gap-8">
        <LivePreviewCard data={data} />
        <div className="text-center">
          <h2 className="text-white font-extrabold text-2xl lg:text-3xl leading-tight whitespace-pre-line">
            {copy.headline}
          </h2>
          <p className="text-white/70 text-sm mt-2 leading-relaxed max-w-55 mx-auto">
            {copy.sub}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {[
          { label: '100% verified', icon: IconCheck },
          { label: 'Earn on your terms', icon: IconCurrencyDollar },
        ].map(({ label, icon: Icon }) => (
          <div key={label} className="flex items-center gap-1.5 text-white/60 text-xs">
            <Icon size={12} className="text-white/50" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step components ────────────────────────────────────────────────────────────

function StepHeader({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="mb-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
        <Icon size={20} className="text-white" />
      </div>
      <h2 className="text-xl font-extrabold text-heading mb-1.5">{title}</h2>
      <p className="text-muted text-sm leading-relaxed">{sub}</p>
    </div>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
          <IconRocket size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-heading mb-3 leading-tight">
          Turn your time<br />into earnings
        </h1>
        <p className="text-muted text-sm leading-relaxed max-w-xs">
          Join Meytle as a companion — meet interesting people, do what you love, and get paid for it.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-8 max-w-sm">
          {[
            { icon: IconCurrencyDollar, label: 'Set your rate' },
            { icon: IconStar, label: 'Your schedule' },
            { icon: IconCircleCheck, label: 'Safe & verified' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-surface-alt rounded-xl py-4 px-2 text-center border border-border">
              <Icon size={20} className="mx-auto mb-2 text-accent-green" />
              <p className="text-[11px] font-semibold text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onNext}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity active:scale-95 mt-8"
        style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
        Let's get started <IconArrowRight size={16} />
      </button>
    </div>
  );
}

function StepName({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  return (
    <div>
      <StepHeader
        icon={IconUser}
        title="What's your name?"
        sub="This is what clients will see on your profile. Use your real name or a display name."
      />
      <input
        value={data.displayName}
        onChange={(e) => onChange({ displayName: e.target.value })}
        placeholder="e.g. Aditya, Sarah K., Alex…"
        maxLength={40}
        autoFocus
        className="w-full text-base font-semibold text-heading bg-surface-alt border-2 border-border rounded-xl px-4 py-3.5 outline-none placeholder:text-muted/40 focus:border-accent-green/60 focus:ring-4 focus:ring-accent-green/10 transition-all"
      />
      {data.displayName && (
        <div className="mt-4 flex items-center gap-3 bg-surface-mint border border-border rounded-xl p-3.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shrink-0 text-sm"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
            {data.displayName[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] text-muted">Preview on your card</p>
            <p className="text-sm font-semibold text-heading">{data.displayName}</p>
          </div>
          <IconStar size={13} className="ml-auto text-yellow-400 fill-yellow-400" />
        </div>
      )}
    </div>
  );
}

function StepBio({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  return (
    <div>
      <StepHeader
        icon={IconFileText}
        title="Tell your story"
        sub="A great bio helps clients connect with you before they book. Be authentic — share your personality!"
      />
      <textarea
        value={data.bio}
        onChange={(e) => onChange({ bio: e.target.value })}
        placeholder="I love spontaneous plans, great food, and meaningful conversations. Whether it's exploring hidden cafés or hiking a trail, I'm always up for a good time…"
        maxLength={300}
        rows={5}
        className="w-full text-sm text-body bg-surface-alt border-2 border-border rounded-xl px-4 py-3.5 outline-none placeholder:text-muted/40 focus:border-accent-green/60 focus:ring-4 focus:ring-accent-green/10 transition-all resize-none leading-relaxed"
      />
      <div className="flex justify-between mt-1.5">
        <p className="text-[11px] text-muted">Clients love authenticity</p>
        <p className={`text-[11px] font-medium ${data.bio.length > 260 ? 'text-amber-500' : 'text-muted'}`}>
          {data.bio.length}/300
        </p>
      </div>
      <div className="mt-5 space-y-2">
        {['Mention 1-2 things you\'re passionate about', 'Describe your ideal hangout', 'Keep it warm and friendly'].map((tip) => (
          <div key={tip} className="flex items-start gap-2 text-xs text-muted">
            <IconCheck size={12} className="text-accent-green mt-0.5 shrink-0" />
            {tip}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepPhoto({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const { data: res } = await client.post<{ url: string }>('/uploads/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange({ profilePhotoUrl: res.url });
      toast.success('Photo uploaded!');
    } catch {
      toast.error('Upload failed, try again');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <StepHeader
        icon={IconCamera}
        title="Add your photo"
        sub="Profiles with a photo get 3× more bookings. Make a great first impression!"
      />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full group">
        <div className={`mx-auto w-40 h-40 rounded-2xl overflow-hidden border-2 transition-all ${
          data.profilePhotoUrl ? 'border-accent-green/50 shadow-lg' : 'border-dashed border-border hover:border-accent-green/40'
        }`}
          style={!data.profilePhotoUrl ? { background: 'linear-gradient(135deg,#00D4AA08,#4F8CFF08)' } : {}}>
          {data.profilePhotoUrl ? (
            <div className="relative w-full h-full">
              <img src={data.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-semibold">Change photo</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2.5">
              {uploading
                ? <IconLoader2 size={28} className="text-accent-green animate-spin" />
                : <IconCamera size={28} className="text-muted group-hover:text-accent-green transition-colors" />}
              <p className="text-xs text-muted font-medium">{uploading ? 'Uploading…' : 'Click to upload'}</p>
            </div>
          )}
        </div>
      </button>
      {data.profilePhotoUrl && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <IconCheck size={14} className="text-accent-green" />
          <p className="text-sm text-accent-green font-semibold">Looking great!</p>
          <button onClick={() => onChange({ profilePhotoUrl: '' })}
            className="text-xs text-muted hover:text-red-500 transition-colors ml-2 flex items-center gap-1">
            <IconX size={11} /> Remove
          </button>
        </div>
      )}
      <p className="text-center text-[11px] text-muted mt-3">JPG, PNG or WebP · max 8 MB</p>
    </div>
  );
}

// ── Step 4: Interests ──────────────────────────────────────────────────────────

function StepInterests({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  const toggle = (tag: string) => {
    const curr = data.interests;
    if (curr.includes(tag)) {
      onChange({ interests: curr.filter((t) => t !== tag) });
    } else if (curr.length < 6) {
      onChange({ interests: [...curr, tag] });
    }
  };

  return (
    <div>
      <StepHeader
        icon={IconTags}
        title="What are you into?"
        sub="Pick up to 6 interests. Clients find companions who share their vibe."
      />
      <div className="flex flex-wrap gap-2">
        {INTEREST_TAGS.map((tag) => {
          const active = data.interests.includes(tag);
          const maxed = data.interests.length >= 6 && !active;
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              disabled={maxed}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-semibold transition-all active:scale-95 ${
                active
                  ? 'text-white border-transparent shadow-md'
                  : maxed
                  ? 'border-border text-muted/30 cursor-not-allowed'
                  : 'border-border text-body hover:border-accent-green/40 hover:bg-surface-alt'
              }`}
              style={active ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
              {active && <IconCheck size={12} className="text-white shrink-0" />}
              {tag}
            </button>
          );
        })}
      </div>
      {data.interests.length > 0 && (
        <p className="text-center text-xs text-accent-green font-semibold mt-4">
          {data.interests.length}/6 selected
        </p>
      )}
    </div>
  );
}

// ── Step 5: Prompt ─────────────────────────────────────────────────────────────

function StepPrompt({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  const [picked, setPicked] = useState(data.prompt.question);

  const selectQ = (q: string) => {
    setPicked(q);
    onChange({ prompt: { question: q, answer: data.prompt.question === q ? data.prompt.answer : '' } });
  };

  const clearQ = () => {
    setPicked('');
    onChange({ prompt: { question: '', answer: '' } });
  };

  return (
    <div>
      <StepHeader
        icon={IconMessageDots}
        title="Share your vibe"
        sub="A prompt answer makes your profile 2× more memorable. Pick one and be yourself."
      />

      {picked ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl border-2 border-accent-green/40 bg-teal-50/60">
            <p className="text-sm font-bold text-heading leading-snug">{picked}</p>
            <button onClick={clearQ} className="text-muted hover:text-red-500 transition-colors shrink-0 mt-0.5">
              <IconX size={14} />
            </button>
          </div>
          <textarea
            value={data.prompt.answer}
            onChange={(e) => onChange({ prompt: { question: picked, answer: e.target.value } })}
            placeholder="Write your answer…"
            maxLength={150}
            rows={4}
            autoFocus
            className="w-full text-sm text-body bg-surface-alt border-2 border-border rounded-xl px-4 py-3 outline-none placeholder:text-muted/40 focus:border-accent-green/60 focus:ring-4 focus:ring-accent-green/10 transition-all resize-none leading-relaxed"
          />
          <div className="flex justify-between text-[11px] text-muted px-1">
            <span>Be specific and fun</span>
            <span className={data.prompt.answer.length > 120 ? 'text-amber-500' : ''}>
              {data.prompt.answer.length}/150
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {PROMPTS.map((q) => (
            <button key={q} onClick={() => selectQ(q)}
              className="w-full text-left px-4 py-3.5 rounded-xl border border-border bg-surface hover:border-accent-green/40 hover:bg-teal-50/40 text-sm font-medium text-heading transition-all active:scale-[0.99] flex items-center justify-between gap-3">
              <span>{q}</span>
              <IconArrowRight size={14} className="text-muted shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 6: Services ───────────────────────────────────────────────────────────

function StepServices({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  const toggle = (v: ServiceType) => {
    const curr = data.services;
    onChange({ services: curr.includes(v) ? curr.filter((s) => s !== v) : [...curr, v] });
  };
  return (
    <div>
      <StepHeader
        icon={IconLayoutGrid}
        title="What do you enjoy?"
        sub="Pick experiences you're happy to share. Select at least one."
      />
      <div className="grid grid-cols-2 gap-2">
        {SERVICES.map(({ value, label, icon: Icon, desc }) => {
          const active = data.services.includes(value);
          return (
            <button key={value} onClick={() => toggle(value)}
              className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                active ? 'border-transparent shadow-md' : 'border-border bg-surface hover:border-accent-green/30'
              }`}
              style={active ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
              <Icon size={18} className={`shrink-0 ${active ? 'text-white' : 'text-muted'}`} />
              <div className="min-w-0">
                <p className={`text-sm font-bold truncate ${active ? 'text-white' : 'text-heading'}`}>{label}</p>
                <p className={`text-[10px] truncate ${active ? 'text-white/70' : 'text-muted'}`}>{desc}</p>
              </div>
              {active && (
                <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-white/30 flex items-center justify-center">
                  <IconCheck size={9} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {data.services.length > 0 && (
        <p className="text-center text-xs text-accent-green font-semibold mt-4">
          {data.services.length} experience{data.services.length > 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}

function StepRate({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  return (
    <div>
      <StepHeader
        icon={IconCurrencyDollar}
        title="Set your rate"
        sub="You can change this anytime. Minimum $15/hour."
      />
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1">
          <span className="text-3xl font-bold text-muted">$</span>
          <input
            type="number"
            value={data.hourlyRate}
            onChange={(e) => onChange({ hourlyRate: +e.target.value || 15 })}
            className="text-5xl font-extrabold text-heading w-36 text-center bg-transparent outline-none border-b-2 border-border focus:border-accent-green/60 transition-colors [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xl text-muted self-end mb-2">/hr</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-muted text-center mb-3 font-medium">Quick presets</p>
        <div className="flex gap-2 justify-center flex-wrap">
          {RATE_PRESETS.map((r) => (
            <button key={r} onClick={() => onChange({ hourlyRate: r })}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                data.hourlyRate === r ? 'text-white border-transparent' : 'border-border text-muted hover:border-accent-green/40'
              }`}
              style={data.hourlyRate === r ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
              ${r.toLocaleString('en-US')}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 bg-surface-mint border border-border rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
        {[
          { label: '5 sessions/mo', hrs: 5 },
          { label: '10 sessions/mo', hrs: 10 },
          { label: '20 sessions/mo', hrs: 20 },
        ].map(({ label, hrs }) => (
          <div key={label}>
            <p className="text-sm font-bold text-heading">${(data.hourlyRate * hrs * 2).toLocaleString('en-US')}</p>
            <p className="text-[10px] text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted text-center mt-2">Estimated at 2 hrs avg per session</p>
    </div>
  );
}

// ── Map helpers ────────────────────────────────────────────────────────────────


const pinIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 12, { duration: 1.2 }); }, [lat, lng, map]);
  return null;
}

function StepLocation({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  const [locating, setLocating] = useState(false);
  const hasPin = data.coords[0] !== 0 || data.coords[1] !== 0;
  const [lng, lat] = data.coords;

  const applyCoords = async (newLat: number, newLng: number) => {
    onChange({ coords: [newLng, newLat], areaLabel: 'Location set' });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const d = await res.json();
      const label = d.address?.city || d.address?.town || d.address?.village || d.address?.county || d.address?.state || 'Location set';
      onChange({ coords: [newLng, newLat], areaLabel: label });
    } catch { /* keep 'Location set' */ }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { applyCoords(pos.coords.latitude, pos.coords.longitude); setLocating(false); },
      ()    => { toast.error('Location access denied'); setLocating(false); },
      { timeout: 8000 }
    );
  };

  const initCenter: [number, number] = hasPin ? [lat, lng] : [20, 0];

  return (
    <>
      <div className="px-5 md:px-8 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
            <IconMapPin size={17} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-heading">Your service area</h2>
            <p className="text-[11px] text-muted">Drop a pin on the map or use your location</p>
          </div>
        </div>
        <button
          onClick={useMyLocation}
          disabled={locating}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 disabled:opacity-50"
          style={{ borderColor: '#00D4AA', color: '#00A896', background: '#F0FDFB' }}>
          {locating
            ? <IconLoader2 size={15} className="animate-spin" />
            : <IconCurrentLocation size={15} />}
          {locating ? 'Getting location…' : 'Use my location'}
        </button>
      </div>

      <div className="flex-1 relative min-h-0">
        <MapContainer center={initCenter} zoom={hasPin ? 12 : 2}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" opacity={0.85} />
          <ZoomControl position="bottomright" />
          <MapClickHandler onPick={applyCoords} />
          {hasPin && (
            <>
              <Marker position={[lat, lng]} icon={pinIcon} />
              <FlyTo lat={lat} lng={lng} />
            </>
          )}
        </MapContainer>
        {!hasPin && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg text-center">
              <p className="text-sm font-semibold text-heading">Tap the map to drop a pin</p>
              <p className="text-[11px] text-muted mt-0.5">or use the button above</p>
            </div>
          </div>
        )}
      </div>

      {hasPin && (
        <div className="px-5 md:px-8 py-3 border-t border-border bg-surface flex-shrink-0">
          <p className="text-[11px] text-muted">
            📍 {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
        </div>
      )}
    </>
  );
}

// ── Step 7: Availability schedule ──────────────────────────────────────────────

function StepAvailability({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  const toggle = (i: number) => {
    const next = data.slots.map((s, idx) => idx === i ? { ...s, enabled: !s.enabled } : s);
    onChange({ slots: next });
  };

  const updateFrom = (i: number, val: string) => {
    const fromMins = toMins(val);
    const s = data.slots[i];
    const adjustedTo = toMins(s.toTime) < fromMins + MIN_GAP_MINS
      ? toTimeStr(Math.min(fromMins + MIN_GAP_MINS, DAY_END_MINS))
      : s.toTime;
    onChange({ slots: data.slots.map((slot, idx) => idx === i ? { ...slot, fromTime: val, toTime: adjustedTo } : slot) });
  };

  const updateTo = (i: number, val: string) => {
    const toMinsVal = toMins(val);
    const s = data.slots[i];
    const adjustedFrom = toMinsVal < toMins(s.fromTime) + MIN_GAP_MINS
      ? toTimeStr(Math.max(toMinsVal - MIN_GAP_MINS, DAY_START_MINS))
      : s.fromTime;
    onChange({ slots: data.slots.map((slot, idx) => idx === i ? { ...slot, toTime: val, fromTime: adjustedFrom } : slot) });
  };

  const enabledCount = data.slots.filter((s) => s.enabled).length;

  return (
    <div>
      <StepHeader
        icon={IconClock}
        title="When are you available?"
        sub="Toggle the days you're open. Clients will only see bookings within your hours."
      />

      <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/60">
        {DAYS.map((day, i) => {
          const s = data.slots[i];
          return (
            <div key={day} className={`px-4 py-3 transition-colors ${s.enabled ? 'bg-surface' : 'bg-surface-alt/50'}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => toggle(i)} className="flex items-center gap-2.5 shrink-0 w-20">
                  <div className={`w-10 h-[22px] rounded-full relative transition-colors shrink-0 ${s.enabled ? '' : 'bg-gray-200'}`}
                    style={s.enabled ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
                    <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${s.enabled ? 'translate-x-5' : 'translate-x-[3px]'}`} />
                  </div>
                  <span className={`text-xs font-bold w-7 ${s.enabled ? 'text-heading' : 'text-muted'}`}>{day}</span>
                </button>

                {s.enabled ? (
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <TimeSpinner
                      label="From"
                      value={s.fromTime}
                      min={DAY_START_MINS}
                      max={DAY_END_MINS - MIN_GAP_MINS}
                      onChange={(v) => updateFrom(i, v)}
                    />
                    <span className="text-xs text-muted font-medium shrink-0 mt-4">→</span>
                    <TimeSpinner
                      label="To"
                      value={s.toTime}
                      min={toMins(s.fromTime) + MIN_GAP_MINS}
                      max={DAY_END_MINS}
                      onChange={(v) => updateTo(i, v)}
                    />
                    <div className="flex flex-col items-center shrink-0 mt-4">
                      <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Dur</span>
                      <span className="text-xs font-extrabold text-accent-green tabular-nums mt-0.5">
                        {durLabel(s.fromTime, s.toTime)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted flex-1 italic">Tap to enable</span>
                )}
              </div>

              {s.enabled && <RangeBar fromTime={s.fromTime} toTime={s.toTime} />}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between px-1">
        <p className="text-xs text-muted">
          {enabledCount > 0
            ? <><span className="text-accent-green font-semibold">{enabledCount} day{enabledCount > 1 ? 's' : ''}</span> selected</>
            : 'No days selected yet'}
        </p>
        <button
          onClick={() => {
            const allEnabled = data.slots.every((s) => s.enabled);
            onChange({ slots: data.slots.map((s) => ({ ...s, enabled: !allEnabled })) });
          }}
          className="text-xs text-accent-green font-semibold hover:underline">
          {data.slots.every((s) => s.enabled) ? 'Deselect all' : 'Select all'}
        </button>
      </div>
    </div>
  );
}

// ── Step 10: Companion Agreement ───────────────────────────────────────────────

const AGREEMENT_TEXT = `MEYTLE — COMPANION AGREEMENT
For registered service providers on the Meytle platform
Operated by ZEPHYR GROUP OF COMPANIES LIMITED
Effective Date: 15 May 2025

IMPORTANT: By completing the Companion registration process and ticking the acceptance box, you agree to be legally bound by this Companion Agreement in addition to Meytle's general Terms and Conditions and Privacy Policy. Please read this document carefully before registering.

1. INTRODUCTION

This Companion Agreement ("Agreement") is entered into between ZEPHYR GROUP OF COMPANIES LIMITED (trading as "Meytle") and you, the individual or entity registering as a Companion on the Meytle platform ("you" or "Companion").

This Agreement governs your registration, listing, and provision of services through the Meytle platform at meytle.com ("Platform"). It supplements and should be read together with Meytle's general Terms and Conditions and Privacy Policy.

In the event of any conflict between this Agreement and the general Terms and Conditions, this Agreement takes precedence in relation to Companion-specific matters.

2. NATURE OF THE RELATIONSHIP

2.1 Independent Contractor
You are an independent contractor, not an employee, agent, partner, or franchisee of ZEPHYR GROUP OF COMPANIES LIMITED. Nothing in this Agreement creates any employment relationship. You have no authority to bind Meytle to any contract or obligation.

2.2 Platform as Intermediary
Meytle provides a technology platform that connects you with potential Clients. Meytle is not a party to any service agreement you enter into with a Client. We do not direct, supervise, or control how you deliver your services.

2.3 No Exclusivity
This Agreement does not prevent you from offering your services outside of the Meytle platform, provided you do not solicit Meytle Clients to take transactions off-platform (see Section 10).

3. ELIGIBILITY & REGISTRATION

3.1 Eligibility Requirements
To register and remain active as a Companion, you must:
• Be at least 18 years of age;
• Be legally permitted to offer and provide services in the jurisdiction(s) where you operate;
• Provide accurate, truthful, and complete registration information;
• Pass any identity verification process required by Meytle from time to time;
• Maintain a valid payment account capable of receiving payouts;
• Comply with all applicable laws, regulations, and licensing requirements in your jurisdiction.

3.2 Identity Verification
Meytle may require you to submit government-issued identification and/or other verification documents prior to or at any time during your registration. We reserve the right to decline or suspend any Companion who fails to satisfactorily complete verification.

3.3 Accurate Information
You warrant that all information you provide during registration and in your profile is accurate, current, and not misleading. You must promptly update your information if it changes.

4. COMPANION PROFILE & LISTINGS

4.1 Profile Standards
Your profile and all service listings must:
• Accurately describe the services you offer;
• Use clear, professional, and respectful language;
• Include only photos that genuinely represent you and/or your services;
• Not include any content that is false, misleading, defamatory, offensive, or illegal;
• Not include personal contact information in public-facing profile fields;
• Not include pricing or payment terms that circumvent the Platform's booking and payment system.

4.2 Prohibited Listing Content
You must not include in any listing or profile:
• Explicit sexual content or solicitation of sexual services;
• Content that discriminates on the basis of race, gender, religion, sexual orientation, disability, or any other protected characteristic;
• Content that promotes illegal activity;
• Another person's image, name, or identity without their written consent;
• Misleading pricing, fake availability, or manufactured reviews.

4.3 Meytle's Right to Edit or Remove
Meytle reserves the right to edit, remove, or decline to publish any listing or profile content that, in our sole discretion, violates this Agreement, our community standards, or applicable law.

5. SERVICES & CONDUCT

5.1 Permitted Services
Companions may offer any lawful personal service through the Platform, including but not limited to social companionship, travel companionship, event attendance, dining accompaniment, guided experiences, wellness services, language tutoring, fitness coaching, and other lifestyle services.

5.2 Prohibited Services
You must not offer, advertise, or provide any services that:
• Are illegal in the jurisdiction where the service is delivered or received;
• Involve sexual services of any nature where prohibited by local law;
• Involve the supply of controlled substances;
• Involve minors in any capacity;
• Involve deception, coercion, or exploitation of any person.

Meytle operates a zero-tolerance policy on services involving exploitation or illegal conduct. Violations will result in immediate permanent account termination and may be reported to relevant law enforcement authorities.

5.3 Professional Conduct
When delivering services to Clients, you agree to:
• Behave professionally, respectfully, and safely at all times;
• Honour confirmed bookings or provide reasonable advance notice of cancellation;
• Communicate clearly and honestly with Clients;
• Not engage in any behaviour that would damage the reputation of the Meytle platform;
• Not request or accept payment for services outside the Platform's payment system.

5.4 Safety
Your personal safety is important to us. You are encouraged to meet new Clients in public places, share your location with a trusted person, and report any unsafe behaviour immediately to companions@meytle.com. Meytle will take all reported safety concerns seriously.

6. BOOKINGS & CANCELLATIONS

6.1 Accepting Bookings
When you accept a booking through the Platform, you enter into a direct service agreement with the Client. You are responsible for honouring that commitment.

6.2 Cancellations by You
If you need to cancel a confirmed booking, you must cancel through the Platform as early as possible and provide the Client with reasonable notice (minimum 24 hours where possible). Meytle reserves the right to apply cancellation penalties or restrict your account if you have an excessive cancellation rate.

6.3 No-Shows
Failure to appear for a confirmed booking without prior cancellation constitutes a no-show and may result in account suspension or termination.

7. PAYMENTS & COMMISSION

7.1 Platform Commission
Meytle charges a commission on each completed booking. The applicable rate is displayed in your Companion dashboard. We reserve the right to update commission rates with at least 14 days' prior notice.

7.2 How Payouts Work
Your earnings (booking amount minus commission) will be processed to your nominated payment account after a booking is completed and any applicable holding period has passed.

7.3 Disputed Payments
If you believe a payout is incorrect, you must contact us within 14 days at companions@meytle.com. We will investigate and respond within 10 business days.

7.4 Withholding
Meytle reserves the right to withhold or reverse payouts where a booking is disputed, where fraud is suspected, or where you are in breach of this Agreement.

8. TAX OBLIGATIONS

Meytle does not withhold any taxes on your behalf. As an independent contractor, you are solely responsible for registering with relevant tax authorities, declaring all income earned through the Platform, paying all applicable income tax, and complying with any GST, VAT, or equivalent obligations in your jurisdiction.

9. INSURANCE & LIABILITY

9.1 Your Insurance Responsibility
You are strongly advised to obtain and maintain appropriate insurance coverage, which may include public liability, professional indemnity, and personal accident insurance.

9.2 No Platform Insurance
Meytle does not provide any insurance coverage for Companions or their activities.

9.3 Limitation of Liability
To the maximum extent permitted by law, ZEPHYR GROUP OF COMPANIES LIMITED's total liability to you shall not exceed the total commission fees paid by you to Meytle in the three months preceding the relevant event.

10. OFF-PLATFORM TRANSACTIONS

Taking transactions off the Meytle Platform is strictly prohibited and constitutes a material breach of this Agreement. This prohibition applies during the period you are a registered Companion and for 12 months after your account is closed or terminated. Breaches may result in immediate account termination, a claim for damages, and legal action.

11. RATINGS, REVIEWS & STANDARDS

Clients may leave ratings and reviews after a completed booking. These are displayed publicly on your profile. Attempting to manipulate reviews is a serious breach of this Agreement and will result in immediate account termination.

12. INTELLECTUAL PROPERTY & CONTENT

By uploading content to the Platform, you grant ZEPHYR GROUP OF COMPANIES LIMITED a worldwide, royalty-free, non-exclusive licence to use, display, reproduce, and distribute that content solely for the purposes of operating and promoting the Platform.

13. CONFIDENTIALITY & CLIENT PRIVACY

You agree to use Client personal information only for the purpose of delivering the booked service, and not to store, share, sell, or misuse Client personal information.

14. SUSPENSION & TERMINATION

Meytle may suspend or permanently terminate your account immediately and without prior notice if you breach any material term of this Agreement, engage in fraudulent or illegal conduct, or pose a safety risk. You may also close your account at any time by contacting companions@meytle.com.

15. GOVERNING LAW

This Agreement is governed by the laws of New Zealand. Any disputes shall be subject to the non-exclusive jurisdiction of the New Zealand courts.

16. CONTACT

Companion Support: companions@meytle.com
Legal: legal@meytle.com
Website: https://meytle.com`;

function StepAgreement({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [reachedBottom, setReachedBottom] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setReachedBottom(true);
    }
  }, []);

  return (
    <div>
      <StepHeader
        icon={IconFileText}
        title="Companion Agreement"
        sub="Read the agreement in full, then tick the box below to accept."
      />

      <div className="relative rounded-2xl border border-border overflow-hidden mb-4">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-72 overflow-y-auto p-5 bg-surface text-[12px] text-body leading-relaxed font-mono whitespace-pre-wrap"
          style={{ scrollbarWidth: 'thin' }}
        >
          {AGREEMENT_TEXT}
        </div>

        {!reachedBottom && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-2">
            <span className="text-[10px] text-muted font-medium flex items-center gap-1">
              <IconChevronDown size={12} /> Scroll to read full agreement
            </span>
          </div>
        )}
      </div>

      <label className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer select-none ${
        reachedBottom
          ? 'border-accent-green/40 bg-teal-50/60 hover:bg-teal-50'
          : 'border-border bg-surface-alt opacity-50 cursor-not-allowed pointer-events-none'
      }`}>
        <div className={`w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
          data.agreed ? 'bg-accent-green border-accent-green' : 'border-border bg-white'
        }`}>
          {data.agreed && <IconCheck size={12} className="text-white" strokeWidth={3} />}
        </div>
        <input
          type="checkbox"
          className="sr-only"
          disabled={!reachedBottom}
          checked={data.agreed}
          onChange={(e) => onChange({ agreed: e.target.checked })}
        />
        <span className="text-[12px] text-body leading-relaxed">
          I have read and understood the Companion Agreement in full and agree to be legally bound by its terms. I confirm I meet all eligibility requirements and that all information I have provided is accurate.
        </span>
      </label>
    </div>
  );
}

// ── Step 8: Review ─────────────────────────────────────────────────────────────

function StepReview({
  data, submitting, onSubmit,
}: { data: FormData; submitting: boolean; onSubmit: () => void }) {
  const photoInitial = data.displayName[0]?.toUpperCase() ?? '?';
  const enabledDays = data.slots.map((s, i) => s.enabled ? DAYS[i] : null).filter(Boolean);

  return (
    <div>
      <StepHeader
        icon={IconCircleCheck}
        title="You're all set!"
        sub="Review your profile before going live. You can edit everything later."
      />

      <div className="bg-surface rounded-2xl border border-border overflow-hidden mb-5 shadow-md">
        <div className="relative h-36 bg-surface-alt">
          {data.profilePhotoUrl ? (
            <img src={data.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold"
              style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
              {photoInitial}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <p className="text-white font-bold">{data.displayName}</p>
              <p className="text-white/70 text-xs">{data.areaLabel || 'Not set'}</p>
            </div>
            <p className="text-white font-bold">
              ${data.hourlyRate.toLocaleString('en-US')}
              <span className="text-white/60 text-xs font-normal">/hr</span>
            </p>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted line-clamp-2">{data.bio || 'No bio added'}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {data.services.map((s) => {
              const svc = SERVICES.find((x) => x.value === s);
              return svc ? (
                <span key={s} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full text-white"
                  style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                  {svc.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {[
          { icon: IconUser,        label: 'Display name', val: data.displayName },
          { icon: IconMapPin,      label: 'Location',     val: data.areaLabel || 'Not set' },
          { icon: IconCurrencyDollar, label: 'Hourly rate', val: `$${data.hourlyRate.toLocaleString('en-US')}/hr` },
          { icon: IconLayoutGrid,  label: 'Services',     val: `${data.services.length} selected` },
          { icon: IconClock,       label: 'Availability', val: enabledDays.length > 0 ? enabledDays.join(', ') : 'Not set' },
        ].map(({ icon: Icon, label, val }) => (
          <div key={label} className="flex items-center gap-3 px-3.5 py-2.5 bg-surface-alt rounded-xl">
            <Icon size={15} className="text-muted shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted">{label}</p>
              <p className="text-sm font-semibold text-heading truncate">{val}</p>
            </div>
            <IconCheck size={13} className="text-accent-green shrink-0" />
          </div>
        ))}
      </div>

      <button onClick={onSubmit} disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity disabled:opacity-60 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
        {submitting
          ? <><IconLoader2 size={16} className="animate-spin" /> Submitting…</>
          : <>Submit profile <IconArrowRight size={16} /></>}
      </button>
      <p className="text-[11px] text-muted text-center mt-4 leading-relaxed">
        Your profile goes live after a quick verification.<br />We'll notify you within 24 hours.
      </p>
    </div>
  );
}

// ── Step 11: Identity verification ─────────────────────────────────────────────

function UploadZone({
  label, hint, url, uploading, onFile, onClear,
}: {
  label: string; hint: string; url: string; uploading: boolean;
  onFile: (f: File) => void; onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="text-xs font-bold text-heading mb-1.5">{label}</p>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
      <button onClick={() => ref.current?.click()} disabled={uploading} className="w-full group">
        <div className={`rounded-xl border-2 transition-all h-24 flex items-center justify-center gap-3 ${
          url ? 'border-accent-green/50' : 'border-dashed border-border hover:border-accent-green/40'
        }`}
          style={!url ? { background: 'linear-gradient(135deg,#00D4AA08,#4F8CFF08)' } : {}}>
          {url ? (
            <div className="relative w-full h-full rounded-xl overflow-hidden">
              <img src={url} alt={label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                <p className="text-white text-xs font-semibold">Change</p>
              </div>
            </div>
          ) : uploading ? (
            <><IconLoader2 size={20} className="text-accent-green animate-spin" /><span className="text-xs text-muted">Uploading…</span></>
          ) : (
            <><IconCamera size={20} className="text-muted group-hover:text-accent-green transition-colors" /><span className="text-xs text-muted font-medium">{hint}</span></>
          )}
        </div>
      </button>
      {url && (
        <button onClick={onClear} className="text-[11px] text-muted hover:text-red-500 transition-colors mt-1 flex items-center gap-1">
          <IconX size={10} /> Remove
        </button>
      )}
    </div>
  );
}

function StepIdentity({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [uploadingId, setUploadingId]         = useState(false);

  const upload = async (file: File, field: 'selfieUrl' | 'govtIdFrontUrl', setLoading: (v: boolean) => void) => {
    setLoading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const { data: res } = await client.post<{ url: string }>('/uploads/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange({ [field]: res.url });
      toast.success('Uploaded!');
    } catch {
      toast.error('Upload failed, try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <StepHeader
        icon={IconShieldCheck}
        title="Verify your identity"
        sub="Required to go live. Upload a selfie and a government-issued ID — takes 2 minutes."
      />

      <div className="space-y-4 mb-5">
        <UploadZone
          label="Selfie with face clearly visible"
          hint="Take or upload a selfie"
          url={data.selfieUrl}
          uploading={uploadingSelfie}
          onFile={(f) => upload(f, 'selfieUrl', setUploadingSelfie)}
          onClear={() => onChange({ selfieUrl: '' })}
        />
        <UploadZone
          label="Government ID — front (Aadhaar, PAN, Passport)"
          hint="Upload front of your ID"
          url={data.govtIdFrontUrl}
          uploading={uploadingId}
          onFile={(f) => upload(f, 'govtIdFrontUrl', setUploadingId)}
          onClear={() => onChange({ govtIdFrontUrl: '' })}
        />
      </div>

      <div className="bg-surface-alt rounded-xl p-3.5 space-y-2">
        {[
          'Your documents are encrypted and never shared publicly',
          'Verification is reviewed by our team within 24 hours',
          'You get a verified badge once approved',
        ].map((tip) => (
          <div key={tip} className="flex items-start gap-2 text-xs text-muted">
            <IconCheck size={12} className="text-accent-green mt-0.5 shrink-0" />
            {tip}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 12: Payout setup (embedded Stripe Connect) ────────────────────────────

function StepPayout({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [stripeInstance, setStripeInstance] = useState<ReturnType<typeof loadConnectAndInitialize> | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  const initStripe = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // First ensure the Stripe account exists
      await client.post('/companions/me/stripe-onboard', {});

      const instance = loadConnectAndInitialize({
        publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string,
        fetchClientSecret: async () => {
          const { data } = await client.post<{ clientSecret: string }>('/companions/me/stripe-session');
          return data.clientSecret;
        },
        appearance: {
          overlays: 'dialog',
          variables: {
            colorPrimary: '#00D4AA',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '12px',
          },
        },
      });
      setStripeInstance(instance);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not initialise Stripe. Check your keys.');
    } finally {
      setLoading(false);
    }
  }, []);

  if (done) {
    return (
      <div className="flex flex-col items-center text-center py-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
          style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
          <IconCircleCheck size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-heading mb-2">Payout account set up!</h2>
        <p className="text-sm text-muted max-w-xs mb-8">
          Your earnings will be transferred to your bank after each completed session.
        </p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-left mb-8">
          {[
            { icon: IconWallet,         text: 'Direct bank transfers' },
            { icon: IconCheck,          text: 'Auto payouts after sessions' },
            { icon: IconCurrencyDollar,  text: 'USD payouts supported' },
            { icon: IconClock,          text: '2-7 business days' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs text-body">
              <Icon size={13} className="text-accent-green shrink-0" />{text}
            </div>
          ))}
        </div>
        <button onClick={onDone}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
          Go to your dashboard <IconArrowRight size={16} />
        </button>
      </div>
    );
  }

  if (stripeInstance) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#635BFF,#0570DE)' }}>
            <IconBrandStripe size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-heading">Set up payouts</h2>
            <p className="text-xs text-muted">Powered by Stripe — your data is encrypted</p>
          </div>
        </div>

        <ConnectComponentsProvider connectInstance={stripeInstance}>
          <ConnectAccountOnboarding onExit={() => { setDone(true); onDone(); }} />
        </ConnectComponentsProvider>

        <button onClick={onSkip}
          className="w-full flex items-center justify-center gap-1.5 py-3 mt-4 rounded-xl text-sm font-semibold text-muted hover:text-body transition-colors">
          Skip for now — I'll set up payouts later
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'linear-gradient(135deg,#635BFF,#0570DE)' }}>
        <IconBrandStripe size={28} className="text-white" />
      </div>
      <h2 className="text-xl font-extrabold text-heading mb-1.5">Set up your payout account</h2>
      <p className="text-sm text-muted leading-relaxed mb-6">
        Connect your bank account so we can send earnings directly to you after every session. Handled securely by Stripe — takes 2 minutes.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-7">
        {[
          { icon: IconWallet,        text: 'Direct bank transfer' },
          { icon: IconCheck,         text: 'Auto payouts after sessions' },
          { icon: IconCurrencyDollar, text: 'USD payouts supported' },
          { icon: IconClock,         text: '2-7 business days' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-muted">
            <Icon size={13} className="text-accent-green shrink-0" />{text}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
          {error}
        </div>
      )}

      <button onClick={initStripe} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 disabled:opacity-60 active:scale-95 mb-3"
        style={{ background: 'linear-gradient(135deg,#635BFF,#0570DE)' }}>
        {loading
          ? <><IconLoader2 size={16} className="animate-spin" /> Loading…</>
          : <><IconBrandStripe size={16} /> Set up payouts with Stripe</>}
      </button>

      <button onClick={onSkip}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold text-muted hover:text-body transition-colors">
        Skip for now — I'll set up payouts later
      </button>
      <p className="text-[11px] text-muted text-center mt-3">
        You won't be able to receive payments until this is set up.
      </p>
    </div>
  );
}

// ── Main wizard ────────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, setAuth, token } = useAuthStore();

  const [step, setStep]           = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);
  const [data, setData]           = useState<FormData>({
    ...INITIAL,
    displayName: user?.fullName?.split(' ')[0] ?? '',
  });
  const [submitting, setSubmitting] = useState(false);

  // On mount: skip wizard if profile already exists
  useEffect(() => {
    client.get<CompanionProfile>('/companions/me/profile')
      .then(({ data: profile }) => {
        if (profile.stripePayoutsEnabled) {
          // Already fully set up — open Stripe Express dashboard
          client.post<{ url: string }>('/companions/me/stripe-login-link')
            .then(({ data }) => { window.location.href = data.url; })
            .catch(() => navigate('/companion/dashboard', { replace: true }));
        } else {
          // Pre-populate form from existing profile then jump to payout
          setData((prev) => ({
            ...prev,
            displayName:     profile.displayName ?? prev.displayName,
            bio:             profile.bio ?? prev.bio,
            profilePhotoUrl: profile.profilePhotoUrl ?? prev.profilePhotoUrl,
            hourlyRate:      profile.hourlyRatePaisa ? profile.hourlyRatePaisa / 100 : prev.hourlyRate,
            services:        profile.services?.map((s) => s.serviceType) ?? prev.services,
            interests:       profile.user?.interests ?? prev.interests,
          }));
          setStep(12); // jump straight to payout
        }
      })
      .catch(() => { /* no profile yet — start from step 0 */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (patch: Partial<FormData>) => setData((prev) => ({ ...prev, ...patch }));

  const canNext = (): boolean => {
    if (step === 0) return true;
    if (step === 1) return data.displayName.trim().length >= 1;
    if (step === 2) return true;   // bio optional
    if (step === 3) return true;   // photo optional
    if (step === 4) return true;   // interests optional
    if (step === 5) return true;   // prompt optional
    if (step === 6) return data.services.length >= 1;
    if (step === 7) return data.hourlyRate >= 15;
    if (step === 8) return data.coords[0] !== 0 || data.coords[1] !== 0;
    if (step === 9) return true;   // availability optional
    if (step === 10) return data.agreed;
    if (step === 12) return true;  // identity optional
    return true;
  };

  const goTo = (next: number, dir: 'forward' | 'back') => {
    if (animating) return;
    setAnimating(true);
    setDirection(dir);
    setTimeout(() => { setStep(next); setAnimating(false); }, 200);
  };

  const handleNext = () => {
    if (!canNext()) { toast.error('Please complete this step first'); return; }
    if (step < TOTAL_STEPS - 1) goTo(step + 1, 'forward');
  };

  const handleBack = () => {
    if (step > 0) goTo(step - 1, 'back');
    else navigate(-1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // prompt stored as "{question}\n{answer}" in user.bio so detail page can parse it
      const promptText = data.prompt.question && data.prompt.answer
        ? `${data.prompt.question}\n${data.prompt.answer.trim()}`
        : undefined;

      await Promise.all([
        client.post('/companions/me', {
          displayName:         data.displayName.trim(),
          bio:                 data.bio.trim() || undefined,
          profilePhotoUrl:     data.profilePhotoUrl || undefined,
          hourlyRatePaisa:     data.hourlyRate * 100,
          serviceAreaCentre:   data.coords,
          services:            data.services,
        }),
        client.patch('/users/me', {
          ...(data.interests.length > 0 && { interests: data.interests }),
          ...(promptText !== undefined && { bio: promptText }),
        }),
      ]);

      // Save availability slots (if any enabled)
      const enabledSlots = data.slots
        .map((s, i) => s.enabled ? { dayOfWeek: i, fromTime: s.fromTime, toTime: s.toTime } : null)
        .filter(Boolean);
      if (enabledSlots.length > 0) {
        await client.put('/companions/me/availability', { slots: enabledSlots });
      }

      // Refresh auth user so isCompanion() works
      const me = await client.get('/users/me');
      if (token) setAuth(token, me.data);

      toast.success('Profile created! Now set up your payouts.');
      goTo(13, 'forward');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (typeof msg === 'string' && msg.includes('already exists')) {
        toast('Profile already exists — set up your payouts.', { icon: 'ℹ️' });
        goTo(13, 'forward');
      } else {
        toast.error('Submission failed, please try again');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isReview    = step === 11;
  const isPayout    = step === 13;
  const isFullBleed = step === 8;
  const progress  = step === 0 ? 0 : Math.round((step / (TOTAL_STEPS - 1)) * 100);

  return (
    <div className="h-screen flex overflow-hidden"
      style={{ background: 'linear-gradient(160deg,#F7FBFA 0%,#F0F9FF 50%,#EFF6FF 100%)' }}>

      <LeftPanel step={step} data={data} />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top nav */}
        <div className="flex items-center justify-between px-6 md:px-12 lg:px-16 pt-5 pb-3">
          <button onClick={handleBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted hover:bg-black/4 hover:text-body transition-colors">
            {step === 0 ? <IconX size={18} /> : <IconArrowLeft size={18} />}
          </button>

          {step > 0 && (
            <div className="flex items-center gap-1.5">
              {Array.from({ length: TOTAL_STEPS - 1 }, (_, i) => (
                <div key={i}
                  className={`rounded-full transition-all duration-300 ${i + 1 === step ? 'w-5 h-2' : 'w-2 h-2'}`}
                  style={{
                    background: i + 1 <= step
                      ? 'linear-gradient(135deg,#00D4AA,#4F8CFF)'
                      : '#D1E8E4',
                  }}
                />
              ))}
            </div>
          )}

          <div className="w-9">
            {step > 0 && !isReview && !isPayout && (
              <p className="text-[11px] text-muted font-medium text-right">
                {step}/{TOTAL_STEPS - 2}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {step > 0 && (
          <div className="mx-6 md:mx-12 lg:mx-16 h-0.5 bg-border rounded-full">
            <div className="h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#00D4AA,#4F8CFF)' }} />
          </div>
        )}

        {/* Step content */}
        {isFullBleed ? (
          <div className="flex-1 flex flex-col min-h-0"
            style={{ opacity: animating ? 0 : 1, transition: 'opacity 0.18s ease' }}>
            <StepLocation data={data} onChange={update} />
          </div>
        ) : (
          <div className="flex-1 px-6 md:px-12 lg:px-16 py-6 overflow-y-auto"
            style={{
              opacity: animating ? 0 : 1,
              transform: animating ? `translateX(${direction === 'forward' ? 20 : -20}px)` : 'translateX(0)',
              transition: 'opacity 0.18s ease, transform 0.18s ease',
            }}>
            <div className="max-w-xl">
              {step === 0  && <StepWelcome onNext={handleNext} />}
              {step === 1  && <StepName data={data} onChange={update} />}
              {step === 2  && <StepBio data={data} onChange={update} />}
              {step === 3  && <StepPhoto data={data} onChange={update} />}
              {step === 4  && <StepInterests data={data} onChange={update} />}
              {step === 5  && <StepPrompt data={data} onChange={update} />}
              {step === 6  && <StepServices data={data} onChange={update} />}
              {step === 7  && <StepRate data={data} onChange={update} />}
              {step === 9  && <StepAvailability data={data} onChange={update} />}
              {step === 10 && <StepAgreement data={data} onChange={update} />}
              {step === 11 && <StepReview data={data} submitting={submitting} onSubmit={handleSubmit} />}
              {step === 12 && <StepIdentity data={data} onChange={update} />}
              {step === 13 && (
                <StepPayout
                  onDone={() => navigate('/companion/dashboard', { replace: true })}
                  onSkip={() => navigate('/companion/dashboard', { replace: true })}
                />
              )}
            </div>
          </div>
        )}

        {/* Bottom nav — only for non-review, non-payout, non-welcome steps */}
        {step > 0 && !isReview && !isPayout && (
          <div className="px-6 md:px-12 lg:px-16 pb-6 pt-3">
            <div className="max-w-xl">
              <button onClick={handleNext} disabled={!canNext()}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all ${
                  canNext()
                    ? 'text-white shadow-md hover:opacity-90 active:scale-95'
                    : 'bg-surface-alt text-muted cursor-not-allowed'
                }`}
                style={canNext() ? { background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' } : {}}>
                Continue <IconArrowRight size={16} />
              </button>

              {(step === 2 || step === 3 || step === 4 || step === 5 || step === 9 || step === 12) && (
                <button onClick={handleNext}
                  className="w-full text-center text-sm text-muted mt-2.5 hover:text-body transition-colors py-1">
                  Skip for now
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
