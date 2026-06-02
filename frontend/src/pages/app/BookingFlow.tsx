import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  IconArrowLeft, IconCheck, IconCalendar, IconClock, IconCreditCard,
  IconShieldCheck, IconChevronLeft, IconChevronRight, IconMessageCircle,
  IconAlertCircle, IconMapPin, IconX, IconStar, IconUsers, IconLoader2,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { client } from '../../api/client';
import { LocationPickerMap, type PickedLocation } from '../../components/ui/LocationPickerMap';
import type { CompanionProfile, CompanionAvailability, CompanionService, ServiceType } from '../../types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS  = 4;
const MONTHS       = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CALENDAR_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DURATION_OPTIONS = [1, 2, 3, 4];

const SERVICE_LABELS: Record<string, string> = {
  coffee: 'Coffee Dates', dining: 'Fine Dining', concert: 'Concerts',
  travel: 'Travel', fitness: 'Fitness', culture: 'Cultural Events',
  nature: 'Nature Walks', movies: 'Movies', shopping: 'Shopping', gaming: 'Gaming',
};

const CUSTOM_TIME_OPTIONS = [
  '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
  '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM',
];

const TIP_PRESETS = [100, 200, 500];

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeToHour(t: string): number { return parseInt(t.split(':')[0], 10); }

function hourToSlot(h: number): string {
  const period  = h < 12 ? 'AM' : 'PM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${period}`;
}

function parseSlot(slot: string): number {
  const [timePart, period] = slot.split(' ');
  let h = parseInt(timePart.split(':')[0], 10);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h;
}

// DB dayOfWeek: 0=Monday → JS getDay(): 0=Sunday
function dbDayToJsDay(dbDay: number): number { return (dbDay + 1) % 7; }

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }

function parseEwktCentre(ewkt: unknown): { lng: number; lat: number } | null {
  if (!ewkt || typeof ewkt !== 'string') return null;
  const m = ewkt.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!m) return null;
  return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) };
}

// ── MiniCalendar ──────────────────────────────────────────────────────────────

function MiniCalendar({
  selected, onChange, availableDays,
}: {
  selected: Date | null;
  onChange: (d: Date, available: boolean) => void;
  availableDays: Set<number>;
}) {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1),
  );

  function prev() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function next() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }
  function isAvailable(day: number) {
    return availableDays.has(new Date(viewYear, viewMonth, day).getDay());
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <button onClick={prev}
          className="w-8 h-8 rounded-lg hover:bg-surface-alt flex items-center justify-center transition-colors">
          <IconChevronLeft size={16} stroke={2} className="text-heading" />
        </button>
        <p className="text-[15px] font-bold text-heading">{MONTHS[viewMonth]} {viewYear}</p>
        <button onClick={next}
          className="w-8 h-8 rounded-lg hover:bg-surface-alt flex items-center justify-center transition-colors">
          <IconChevronRight size={16} stroke={2} className="text-heading" />
        </button>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-teal-50 border border-teal-200 inline-block" />
            <span className="text-[11px] text-muted">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-100 inline-block" />
            <span className="text-[11px] text-muted">Custom request</span>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {CALENDAR_DAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-muted py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const date       = new Date(viewYear, viewMonth, day);
            const isPast     = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const available  = !isPast && isAvailable(day);
            const customable = !isPast && !available;
            const isSelected = selected &&
              selected.getFullYear() === viewYear &&
              selected.getMonth() === viewMonth &&
              selected.getDate() === day;
            const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

            let cls = 'relative h-10 w-full rounded-lg text-[13px] font-medium transition-all flex items-center justify-center ';
            if (isSelected) {
              cls += 'bg-accent-green text-white font-bold shadow-sm';
            } else if (isPast) {
              cls += 'text-gray-200 cursor-not-allowed';
            } else if (available) {
              cls += isToday
                ? 'bg-teal-50 text-teal-700 ring-2 ring-accent-green font-bold'
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100 hover:shadow-sm cursor-pointer';
            } else if (customable) {
              cls += 'bg-gray-100 text-muted hover:bg-gray-200 cursor-pointer';
            }

            return (
              <button key={i} disabled={isPast}
                onClick={() => onChange(date, available)}
                className={cls}>
                {day}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-green" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── CustomBookingPanel ────────────────────────────────────────────────────────

interface CustomRequest { from: string; to: string; note: string; tip: number; tipCustom: string }

function CustomBookingPanel({ value, onChange }: { value: CustomRequest; onChange: (v: CustomRequest) => void }) {
  const [showCustomInput, setShowCustomInput] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-amber-200 p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3">
        <IconAlertCircle size={16} stroke={1.5} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[12px] text-amber-700 leading-relaxed">
          This date isn't in the companion's regular schedule. A tip is required to send a custom request.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {([{ label: 'Start time', key: 'from' as const }, { label: 'End time', key: 'to' as const }]).map(({ label, key }) => (
          <div key={key}>
            <label className="text-[11px] font-semibold text-muted block mb-1.5 uppercase tracking-wide">{label}</label>
            <select value={value[key]}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-border bg-white text-[13px] font-medium text-heading focus:outline-none focus:border-accent-green appearance-none">
              {CUSTOM_TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wide">
            Tip for companion <span className="text-red-500">*</span>
          </label>
          {value.tip > 0 && <span className="text-[12px] font-bold text-accent-green">${value.tip.toLocaleString()} added</span>}
        </div>
        <div className="flex gap-2 mb-2">
          {TIP_PRESETS.map((amt) => (
            <button key={amt} type="button"
              onClick={() => { setShowCustomInput(false); onChange({ ...value, tip: amt, tipCustom: '' }); }}
              className={`flex-1 h-10 rounded-xl border text-[13px] font-semibold transition-colors ${
                !showCustomInput && value.tip === amt
                  ? 'border-accent-green bg-teal-50 text-teal-700'
                  : 'border-border text-muted hover:border-accent-green'
              }`}>
              ${amt}
            </button>
          ))}
          <button type="button"
            onClick={() => { setShowCustomInput(true); onChange({ ...value, tip: 0, tipCustom: '' }); }}
            className={`flex-1 h-10 rounded-xl border text-[13px] font-semibold transition-colors ${
              showCustomInput ? 'border-accent-green bg-teal-50 text-teal-700' : 'border-border text-muted hover:border-accent-green'
            }`}>
            Custom
          </button>
        </div>
        {showCustomInput && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">$</span>
            <input autoFocus type="text" inputMode="numeric" value={value.tipCustom}
              onChange={(e) => {
                const raw = e.target.value;
                const num = parseInt(raw.replace(/\D/g, ''), 10);
                onChange({ ...value, tipCustom: raw, tip: isNaN(num) ? 0 : num });
              }}
              placeholder="Enter amount"
              className="w-full h-10 pl-7 pr-3 rounded-xl border border-accent-green bg-white text-[13px] font-medium text-heading placeholder:text-muted focus:outline-none" />
          </div>
        )}
      </div>

    </div>
  );
}

// ── Companion sidebar (desktop) ───────────────────────────────────────────────

function CompanionSidebar({ profile, step, selectedService, selectedDate, selectedTime, duration, location, total }: {
  profile: CompanionProfile;
  step: number;
  selectedService: string | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  duration: number;
  location: string;
  total: number;
}) {
  const steps   = ['Choose Service', 'Date & Time', 'Meeting Spot', 'Confirm & Pay'];
  const initials = profile.displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const priceHr  = Math.round(profile.hourlyRatePaisa / 100);

  return (
    <div className="flex flex-col gap-4 sticky top-6">
      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          {profile.profilePhotoUrl ? (
            <img src={profile.profilePhotoUrl} alt={profile.displayName}
              className="w-12 h-12 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-teal-400 to-blue-500 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">{initials}</span>
            </div>
          )}
          <div>
            <p className="text-[16px] font-bold text-heading">{profile.displayName}</p>
            <p className="text-[12px] text-muted">Delhi NCR</p>
            {(profile.ratingAvg ?? 0) > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <IconStar size={11} stroke={0} fill="#F59E0B" color="#F59E0B" />
                <span className="text-[12px] font-semibold text-heading">{Number(profile.ratingAvg).toFixed(1)}</span>
                <span className="text-[11px] text-muted ml-0.5">({profile.ratingCount ?? 0})</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {selectedService && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted">Service</span>
              <span className="font-semibold text-heading">{SERVICE_LABELS[selectedService] ?? selectedService}</span>
            </div>
          )}
          {selectedDate && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted">Date</span>
              <span className="font-semibold text-heading">
                {selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}
          {selectedTime && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted">Time</span>
              <span className="font-semibold text-heading">{selectedTime} · {duration}h</span>
            </div>
          )}
          {location && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted">Meet at</span>
              <span className="font-semibold text-heading text-right max-w-35 truncate">{location}</span>
            </div>
          )}
          {step >= 2 && selectedTime && (
            <>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-[13px] text-muted">Rate</span>
                <span className="text-[13px] font-semibold text-heading">${priceHr.toLocaleString()}/hr</span>
              </div>
              <div className="flex items-center justify-between bg-teal-50 rounded-xl px-3 py-2">
                <span className="text-[13px] font-bold text-teal-700">Est. Total</span>
                <span className="text-[15px] font-bold text-teal-700">${Math.round(total * 1.05).toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Step tracker */}
      <div className="bg-white rounded-2xl border border-border p-4">
        {steps.map((label, i) => {
          const s      = i + 1;
          const done   = step > s;
          const active = step === s;
          return (
            <div key={s} className="flex items-center gap-3 py-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-colors ${
                done   ? 'bg-emerald-500 text-white' :
                active ? 'bg-accent-green text-white' :
                         'bg-gray-100 text-muted'
              }`}>
                {done ? <IconCheck size={12} stroke={2.5} /> : s}
              </div>
              <span className={`text-[13px] ${active ? 'font-bold text-heading' : done ? 'text-muted line-through' : 'text-muted'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CheckoutForm (must be rendered inside <Elements>) ─────────────────────────

function CheckoutForm({
  totalPaisa,
  submitting,
  onPay,
}: {
  totalPaisa: number;
  submitting: boolean;
  onPay: (paymentIntentId: string) => Promise<void>;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [confirming, setConfirming] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;
    setConfirming(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });
      if (error) {
        toast.error(error.message ?? 'Payment failed');
        return;
      }
      if (paymentIntent?.id) {
        await onPay(paymentIntent.id);
      }
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-border p-5">
        <p className="text-[14px] font-bold text-heading mb-4 flex items-center gap-2">
          <IconCreditCard size={16} stroke={1.5} className="text-muted" />
          Payment details
        </p>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      <div className="flex items-start gap-2 bg-surface-alt rounded-xl px-3.5 py-3">
        <IconShieldCheck size={14} stroke={1.5} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted leading-relaxed">
          Card is authorized now but only charged after the companion accepts. Declined bookings are fully refunded.
        </p>
      </div>

      <button
        onClick={handlePay}
        disabled={!stripe || confirming || submitting}
        className="w-full py-3.5 rounded-2xl text-white text-[15px] font-bold disabled:opacity-40 transition-all hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-2 gradient-primary"
      >
        {confirming ? (
          <><IconLoader2 size={17} className="animate-spin" /> Authorizing…</>
        ) : submitting ? (
          <><IconLoader2 size={17} className="animate-spin" /> Confirming…</>
        ) : (
          <><IconCheck size={17} stroke={2.5} /> Pay & Request · ${Math.round(totalPaisa / 100).toLocaleString('en-US')}</>
        )}
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function BookingFlow() {
  const { id }              = useParams<{ id: string }>();
  const navigate            = useNavigate();
  const [searchParams]      = useSearchParams();

  const [profile, setProfile]         = useState<CompanionProfile | null>(null);
  const [availability, setAvailability] = useState<CompanionAvailability[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [totalPaisa, setTotalPaisa]   = useState(0);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      client.get<CompanionProfile>(`/companions/${id}`).then((r) => r.data),
      client.get<{ id: string; serviceType: ServiceType }[]>(`/companions/${id}/services`).then((r) => r.data),
      client.get<CompanionAvailability[]>(`/companions/${id}/availability`).then((r) => r.data),
    ])
      .then(([prof, svcs, avail]) => {
        setProfile({ ...prof, services: svcs as CompanionService[] });
        setAvailability(avail);
      })
      .catch(() => { toast.error('Companion not found'); navigate(-1); })
      .finally(() => setLoadingProfile(false));
  }, [id, navigate]);

  const serviceParam       = searchParams.get('service');
  const services           = profile?.services ?? [];

  const [step, setStep]                 = useState(() => serviceParam ? 2 : 1);
  const [selectedService, setSelectedService] = useState<string | null>(serviceParam);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateAvailable, setDateAvailable] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration]         = useState(2);
  const [locationPick, setLocationPick] = useState<PickedLocation | null>(null);
  const [location, setLocation]         = useState('');
  const [customRequest, setCustomRequest] = useState<CustomRequest>({
    from: '10:00 AM', to: '12:00 PM', note: '', tip: 0, tipCustom: '',
  });

  // Fetch PaymentIntent when user reaches step 4
  useEffect(() => {
    if (step !== 4 || !profile || clientSecret) return;
    const durationMins = dateAvailable
      ? duration * 60
      : Math.max(60, (parseSlot(customRequest.to) - parseSlot(customRequest.from)) * 60);
    const tipPaisa = !dateAvailable ? customRequest.tip * 100 : 0;

    client.post<{ clientSecret: string; totalPaisa: number }>('/bookings/prepare-payment', {
      companionId:           profile.id,
      bookedDurationMinutes: durationMins,
      isCustomRequest:       !dateAvailable,
      tipPaisa,
    })
      .then((r) => {
        setClientSecret(r.data.clientSecret);
        setTotalPaisa(r.data.totalPaisa);
      })
      .catch(() => toast.error('Could not set up payment — please go back and try again'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Pre-select service once profile loads
  useEffect(() => {
    if (serviceParam && services.length > 0 && !selectedService) {
      const match = services.find((s) => s.serviceType === serviceParam);
      if (match) { setSelectedService(match.serviceType); setStep(2); }
    }
  }, [services, serviceParam, selectedService]);

  const availableDays = useMemo(
    () => new Set(availability.map((a) => dbDayToJsDay(a.dayOfWeek))),
    [availability],
  );

  const timeSlots = useMemo(() => {
    if (!selectedDate || !dateAvailable) return [];
    const jsDay = selectedDate.getDay();
    const slot  = availability.find((a) => dbDayToJsDay(a.dayOfWeek) === jsDay);
    if (!slot) return [];
    const from = timeToHour(slot.fromTime);
    const to   = timeToHour(slot.toTime);
    return Array.from({ length: to - from }, (_, i) => hourToSlot(from + i));
  }, [selectedDate, dateAvailable, availability]);

  const mapCentre = useMemo(
    () => parseEwktCentre(profile?.serviceAreaCentre ?? null) ?? { lng: 77.209, lat: 28.6139 },
    [profile],
  );

  const submitBooking = useCallback(async (paymentIntentId: string) => {
    if (!selectedDate || !selectedService || !profile) return;
    setSubmitting(true);
    try {
      const startHour   = dateAvailable ? parseSlot(selectedTime!) : parseSlot(customRequest.from);
      const bookedStart = new Date(selectedDate);
      bookedStart.setHours(startHour, 0, 0, 0);

      const durationMins = dateAvailable
        ? duration * 60
        : Math.max(60, (parseSlot(customRequest.to) - parseSlot(customRequest.from)) * 60);

      await client.post('/bookings', {
        companionId:           profile.id,
        serviceType:           selectedService,
        bookedStart:           bookedStart.toISOString(),
        bookedDurationMinutes: durationMins,
        meetingSpot:           locationPick
          ? [locationPick.lng, locationPick.lat]
          : [mapCentre.lng, mapCentre.lat],
        meetingSpotText:    location,
        isCustomRequest:    !dateAvailable,
        customNote:         !dateAvailable ? customRequest.note : undefined,
        paymentIntentId,
        tipPaisa:           !dateAvailable ? customRequest.tip * 100 : 0,
      });

      toast.success('Request sent! Waiting for companion to accept.');
      navigate('/bookings', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Booking failed — please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedDate, selectedService, profile, dateAvailable, selectedTime, customRequest, duration, locationPick, location, mapCentre, navigate]);

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-surface-mint animate-pulse flex flex-col">
        <div className="bg-white border-b border-border h-14" />
        <div className="flex-1 max-w-265 mx-auto px-4 py-8 w-full">
          <div className="h-100 rounded-2xl bg-white border border-border" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[14px] text-muted">Companion not found</p>
        <button onClick={() => navigate(-1)} className="mt-2 text-accent-green text-[13px]">Go back</button>
      </div>
    );
  }

  const hourlyRate          = Math.round(profile.hourlyRatePaisa / 100);
  const total               = hourlyRate * duration;
  const customDurationHours = Math.max(1, parseSlot(customRequest.to) - parseSlot(customRequest.from));
  const customServiceFee    = hourlyRate * customDurationHours;
  const customTotal         = Math.round(customServiceFee * 1.05) + customRequest.tip;
  const initials            = profile.displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  function handleDateSelect(date: Date, available: boolean) {
    setSelectedDate(date);
    setDateAvailable(available);
    setSelectedTime(null);
  }

  function canProceed() {
    if (step === 1) return selectedService !== null;
    if (step === 2) {
      if (!selectedDate) return false;
      if (!dateAvailable) return customRequest.from !== customRequest.to && customRequest.tip > 0;
      return selectedTime !== null;
    }
    if (step === 3) return location.trim().length > 0;
    return true;
  }

  function handleNext() {
    if (step < TOTAL_STEPS) { setStep((s) => s + 1); }
    // Step 4 submit is handled by CheckoutForm directly
  }

  function back() {
    if (step > 1) setStep((s) => s - 1);
    else navigate(-1);
  }

  const stepTitles  = ['Choose Service', 'Pick Date & Time', 'Meeting Spot', 'Confirm & Pay'];
  const summaryTime = dateAvailable
    ? `${selectedTime} · ${duration} ${duration === 1 ? 'hour' : 'hours'}`
    : `${customRequest.from} – ${customRequest.to} (custom request)`;

  return (
    <div className="min-h-screen bg-surface-mint flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-265 mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3 h-14">
            <button onClick={back}
              className="w-8 h-8 rounded-lg hover:bg-surface-alt flex items-center justify-center transition-colors shrink-0">
              <IconArrowLeft size={18} stroke={1.5} className="text-heading" />
            </button>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-heading leading-none">{stepTitles[step - 1]}</p>
              <p className="text-[11px] text-muted mt-0.5">Step {step} of {TOTAL_STEPS}</p>
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className={`h-1.5 rounded-full transition-all ${
                  s < step  ? 'w-5 bg-emerald-400' :
                  s === step ? 'w-8 bg-accent-green' :
                               'w-5 bg-border'
                }`} />
              ))}
            </div>
            {profile.profilePhotoUrl ? (
              <img src={profile.profilePhotoUrl} alt={profile.displayName}
                className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-teal-400 to-blue-500 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">{initials}</span>
              </div>
            )}
          </div>
          <div className="md:hidden h-1 bg-border rounded-full mb-1 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300 gradient-primary"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-265 mx-auto px-4 md:px-8 py-5 md:py-8 md:grid md:grid-cols-[280px,1fr] lg:grid-cols-[300px,1fr] md:gap-8 md:items-start">

          <div className="hidden md:block">
            <CompanionSidebar
              profile={profile}
              step={step}
              selectedService={selectedService}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              duration={duration}
              location={location}
              total={total}
            />
          </div>

          <div className="flex flex-col gap-4">

            {/* Step 1 — Choose Service */}
            {step === 1 && (
              <div>
                <div className="mb-5">
                  <h2 className="text-[18px] font-bold text-heading">Choose an experience</h2>
                  <p className="text-[13px] text-muted mt-1">
                    All services with {profile.displayName} are billed at{' '}
                    <span className="font-semibold text-accent-green">${hourlyRate.toLocaleString()}/hr</span>
                  </p>
                </div>
                {services.length === 0 ? (
                  <p className="text-[13px] text-muted">No services listed yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {services.map((svc) => (
                      <button key={svc.id}
                        onClick={() => setSelectedService(svc.serviceType)}
                        className={`flex items-center justify-between rounded-2xl border-2 p-4 transition-all text-left ${
                          selectedService === svc.serviceType
                            ? 'border-accent-green bg-teal-50 shadow-sm'
                            : 'border-border bg-white hover:border-accent-green/50'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            selectedService === svc.serviceType ? 'bg-accent-green/20' : 'bg-gray-100'
                          }`}>
                            <IconUsers size={18} stroke={1.5}
                              className={selectedService === svc.serviceType ? 'text-teal-700' : 'text-muted'} />
                          </div>
                          <div>
                            <p className={`text-[14px] font-semibold ${selectedService === svc.serviceType ? 'text-teal-700' : 'text-heading'}`}>
                              {SERVICE_LABELS[svc.serviceType] ?? svc.serviceType}
                            </p>
                            <p className="text-[11px] text-muted mt-0.5">${hourlyRate.toLocaleString()} / hour</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                          selectedService === svc.serviceType ? 'bg-accent-green border-accent-green' : 'border-border'
                        }`}>
                          {selectedService === svc.serviceType && <IconCheck size={11} stroke={2.5} color="white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Date & Time */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="mb-1">
                  <h2 className="text-[18px] font-bold text-heading">When would you like to meet?</h2>
                  {availability.length > 0 ? (
                    <p className="text-[13px] text-muted mt-1">
                      Available {availability.map((a) => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][a.dayOfWeek]).join(', ')}
                    </p>
                  ) : (
                    <p className="text-[13px] text-muted mt-1">Send a custom request for any date</p>
                  )}
                </div>

                <MiniCalendar selected={selectedDate} onChange={handleDateSelect} availableDays={availableDays} />

                {selectedDate && !dateAvailable && (
                  <CustomBookingPanel value={customRequest} onChange={setCustomRequest} />
                )}

                {selectedDate && dateAvailable && (
                  <>
                    <div className="bg-white rounded-2xl border border-border p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <IconClock size={15} stroke={1.5} className="text-accent-green" />
                        <p className="text-[14px] font-bold text-heading">Available slots</p>
                      </div>
                      {timeSlots.length === 0 ? (
                        <p className="text-[13px] text-muted">No slots configured for this day.</p>
                      ) : (
                        <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                          {timeSlots.map((slot) => (
                            <button key={slot} onClick={() => setSelectedTime(slot)}
                              className={`py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                                selectedTime === slot
                                  ? 'bg-accent-green text-white shadow-sm'
                                  : 'bg-gray-100 text-heading hover:bg-teal-50 hover:text-teal-700'
                              }`}>
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl border border-border p-5">
                      <p className="text-[14px] font-bold text-heading mb-3">Duration</p>
                      <div className="grid grid-cols-4 gap-2">
                        {DURATION_OPTIONS.map((hrs) => (
                          <button key={hrs} onClick={() => setDuration(hrs)}
                            className={`py-3 rounded-xl text-[13px] font-semibold transition-all flex flex-col items-center gap-0.5 ${
                              duration === hrs
                                ? 'bg-accent-green text-white shadow-sm'
                                : 'bg-gray-100 text-heading hover:bg-teal-50'
                            }`}>
                            <span className="text-[15px] font-bold">{hrs}h</span>
                            {selectedTime && (
                              <span className={`text-[10px] ${duration === hrs ? 'text-white/80' : 'text-muted'}`}>
                                ${(hourlyRate * hrs).toLocaleString()}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {!selectedDate && (
                  <div className="flex items-center gap-3 bg-teal-50 rounded-xl px-4 py-3">
                    <IconCalendar size={16} stroke={1.5} className="text-accent-green shrink-0" />
                    <p className="text-[13px] text-teal-700 font-medium">Select a date above to see available time slots</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Meeting Spot */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-[18px] font-bold text-heading">Where should you meet?</h2>
                  <p className="text-[13px] text-muted mt-1">
                    Tap the map to pin a spot. Shared with {profile.displayName} after confirmation.
                  </p>
                </div>

                <LocationPickerMap
                  centerLng={mapCentre.lng}
                  centerLat={mapCentre.lat}
                  radiusKm={profile.serviceAreaRadiusKm}
                  value={locationPick}
                  onChange={(v) => { setLocationPick(v); setLocation(v.text); }}
                  onClear={() => { setLocationPick(null); setLocation(''); }}
                />

                <div className="relative">
                  <IconMapPin size={15} stroke={1.5}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent-green" />
                  <input type="text" value={location}
                    onChange={(e) => { setLocation(e.target.value); setLocationPick(null); }}
                    placeholder="Or type a place name / address…"
                    className="w-full h-12 pl-10 pr-10 rounded-xl bg-white border border-border text-[13px] text-heading placeholder:text-muted focus:outline-none focus:border-accent-green transition-colors" />
                  {location && (
                    <button onClick={() => { setLocation(''); setLocationPick(null); }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <IconX size={14} stroke={1.5} className="text-muted" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 4 — Confirm & Pay */}
            {step === 4 && (
              <div className="flex flex-col gap-4">
                {!dateAvailable && (
                  <div className="flex items-center gap-2 bg-teal-50 rounded-xl px-4 py-3">
                    <IconMessageCircle size={14} stroke={1.5} className="text-accent-green shrink-0" />
                    <p className="text-[12px] text-teal-700 font-medium">
                      Custom request — {profile.displayName} will confirm within 24 hours.
                    </p>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-border p-5">
                  <p className="text-[14px] font-bold text-heading mb-4">Booking Summary</p>
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                    {profile.profilePhotoUrl ? (
                      <img src={profile.profilePhotoUrl} alt={profile.displayName}
                        className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-teal-400 to-blue-500 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold">{initials}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-[15px] font-bold text-heading">{profile.displayName}</p>
                      <p className="text-[12px] text-muted">Delhi NCR</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { icon: <IconCheck size={13} stroke={1.5} />,    label: 'Service', value: selectedService ? (SERVICE_LABELS[selectedService] ?? selectedService) : '—' },
                      { icon: <IconCalendar size={13} stroke={1.5} />, label: 'Date',    value: selectedDate?.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) ?? '—' },
                      { icon: <IconClock size={13} stroke={1.5} />,    label: 'Time',    value: summaryTime },
                      { icon: <IconMapPin size={13} stroke={1.5} />,   label: 'Meet at', value: location || '—' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-start gap-2.5 bg-surface-alt rounded-xl px-3 py-2.5">
                        <span className="text-accent-green shrink-0 mt-0.5">{row.icon}</span>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted uppercase tracking-wide">{row.label}</p>
                          <p className="text-[13px] font-semibold text-heading truncate">{row.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {dateAvailable && (
                  <div className="bg-white rounded-2xl border border-border p-5">
                    <p className="text-[14px] font-bold text-heading mb-3">Price Breakdown</p>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted">${hourlyRate.toLocaleString()} × {duration} hr{duration > 1 ? 's' : ''}</span>
                        <span className="font-semibold text-heading">${total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted">Platform fee (5%)</span>
                        <span className="font-semibold text-heading">${Math.round(total * 0.05).toLocaleString()}</span>
                      </div>
                      <div className="border-t border-border pt-2.5 flex justify-between items-center">
                        <span className="text-[15px] font-bold text-heading">Total</span>
                        <span className="text-[18px] font-bold text-teal-700">${Math.round(total * 1.05).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {!dateAvailable && (
                  <div className="bg-white rounded-2xl border border-border p-5">
                    <p className="text-[14px] font-bold text-heading mb-3">Price Breakdown</p>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted">${hourlyRate.toLocaleString()} × {customDurationHours} hr{customDurationHours > 1 ? 's' : ''}</span>
                        <span className="font-semibold text-heading">${customServiceFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted">Platform fee (5%)</span>
                        <span className="font-semibold text-heading">${Math.round(customServiceFee * 0.05).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted">Companion tip</span>
                        <span className="font-semibold text-heading">${customRequest.tip.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-border pt-2.5 flex justify-between items-center">
                        <span className="text-[15px] font-bold text-heading">Total</span>
                        <span className="text-[18px] font-bold text-teal-700">${customTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stripe payment */}
                {clientSecret ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: { theme: 'stripe', variables: { colorPrimary: '#00D4AA', borderRadius: '12px' } },
                    }}
                  >
                    <CheckoutForm
                      totalPaisa={totalPaisa}
                      submitting={submitting}
                      onPay={submitBooking}
                    />
                  </Elements>
                ) : (
                  <div className="flex items-center justify-center py-8 bg-white rounded-2xl border border-border">
                    <IconLoader2 size={22} className="animate-spin text-teal-500" />
                    <span className="ml-2 text-sm text-muted">Setting up payment…</span>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Bottom CTA — hidden on step 4 (CheckoutForm has its own button) */}
      {step < TOTAL_STEPS && (
        <div className="bg-white border-t border-border">
          <div className="max-w-265 mx-auto px-4 md:px-8 py-4 md:pl-91">
            <button onClick={handleNext} disabled={!canProceed()}
              className="w-full py-3.5 rounded-2xl text-white text-[15px] font-bold disabled:opacity-40 transition-all hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-2 gradient-primary">
              Continue
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
