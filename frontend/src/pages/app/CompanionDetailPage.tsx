import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IconArrowLeft, IconStar, IconMapPin, IconShieldCheck, IconHeart, IconShare,
  IconCheck, IconAlertCircle, IconChevronRight,
  IconMessageDots, IconCalendar, IconClock,
  IconCoffee, IconToolsKitchen2, IconMusic, IconPlane, IconRun,
  IconPalette, IconLeaf, IconMovie, IconShoppingBag, IconDeviceGamepad,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { client } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { CompanionProfile, CompanionAvailability, ServiceType } from '../../types';

// ── Constants ─────────────────────────────────────────────────────────────────

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

const SERVICE_META: Record<ServiceType, { label: string; icon: React.ElementType; color: string; bg: string; desc: string }> = {
  coffee:   { label: 'Coffee',    icon: IconCoffee,          color: '#6F4E37', bg: '#FDF6EC', desc: 'Café chat & brew' },
  dining:   { label: 'Dining',    icon: IconToolsKitchen2,   color: '#E85D04', bg: '#FFF0E6', desc: 'Meals & restaurants' },
  concert:  { label: 'Concerts',  icon: IconMusic,           color: '#7209B7', bg: '#F5E6FF', desc: 'Gigs & live shows' },
  travel:   { label: 'Travel',    icon: IconPlane,           color: '#0077B6', bg: '#E6F4FF', desc: 'Day trips & travel' },
  fitness:  { label: 'Fitness',   icon: IconRun,             color: '#2DC653', bg: '#E8FAEE', desc: 'Gym & outdoor' },
  culture:  { label: 'Culture',   icon: IconPalette,         color: '#E63946', bg: '#FFEBEC', desc: 'Art & museums' },
  nature:   { label: 'Nature',    icon: IconLeaf,            color: '#588157', bg: '#EAF2E8', desc: 'Parks & outdoors' },
  movies:   { label: 'Movies',    icon: IconMovie,           color: '#F4A261', bg: '#FFF4E6', desc: 'Cinema & streaming' },
  shopping: { label: 'Shopping',  icon: IconShoppingBag,     color: '#C77DFF', bg: '#F5EEFF', desc: 'Malls & markets' },
  gaming:   { label: 'Gaming',    icon: IconDeviceGamepad,   color: '#480CA8', bg: '#ECE8FF', desc: 'Board & video games' },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  starRating: number;
  comment: string;
  createdAt: string;
  reviewer?: { fullName: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseEwkt(ewkt: string | null | undefined): { lat: number; lng: number } | null {
  if (!ewkt) return null;
  const m = ewkt.match(/POINT\(([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\)/i);
  if (!m) return null;
  return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) };
}

function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar key={i} size={size} stroke={0}
          fill={i <= rating ? '#F59E0B' : '#E5E7EB'}
          color={i <= rating ? '#F59E0B' : '#E5E7EB'} />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function CompanionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const [profile, setProfile]           = useState<CompanionProfile | null>(null);
  const [availability, setAvailability] = useState<CompanionAvailability[]>([]);
  const [reviews, setReviews]           = useState<Review[]>([]);
  const [loading, setLoading]           = useState(true);
  const [heroImgError, setHeroImgError] = useState(false);
  const [saved, setSaved]               = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [areaLabel, setAreaLabel]       = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      client.get<CompanionProfile>(`/companions/${id}`).then((r) => r.data),
      client.get<CompanionAvailability[]>(`/companions/${id}/availability`).then((r) => r.data),
      client.get<Review[]>(`/reviews/companion/${id}`).then((r) => r.data).catch(() => [] as Review[]),
    ])
      .then(([prof, avail, revs]) => {
        setProfile(prof);
        setAvailability(avail);
        setReviews(revs);
        setSelectedService(prof.services?.[0]?.serviceType ?? null);
        const coords = parseEwkt(prof.serviceAreaCentre);
        if (coords) {
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`, {
            headers: { 'Accept-Language': 'en' },
          })
            .then((r) => r.json())
            .then((d) => {
              const label = d.address?.city || d.address?.town || d.address?.village || d.address?.county || d.address?.state || '';
              setAreaLabel(label);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        toast.error('Companion not found');
        navigate('/browse', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-mint animate-pulse">
        <div className="hidden md:block max-w-[1180px] mx-auto px-6 pt-6">
          <div className="h-[400px] rounded-2xl bg-white border border-border" />
        </div>
        <div className="max-w-[1180px] mx-auto px-4 py-6 flex gap-8">
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-16 rounded-2xl bg-white border border-border" />
            <div className="h-40 rounded-2xl bg-white border border-border" />
          </div>
          <div className="hidden md:block w-[340px] h-[400px] rounded-2xl bg-white border border-border" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const services      = profile.services ?? [];
  const user          = profile.user;
  const age           = calcAge(user?.dateOfBirth);
  const rating        = Number(profile.ratingAvg ?? 0);
  const pricePerHr    = Math.round(profile.hourlyRatePaisa / 100);
  const activeService = selectedService ?? services[0]?.serviceType ?? null;
  const interests     = user?.interests?.filter(Boolean) ?? [];
  const userBio       = user?.bio ?? '';
  const promptQ       = PROMPTS.find((p) => userBio.startsWith(p)) ?? null;
  const promptA       = promptQ ? userBio.slice(promptQ.length + 1).trim() : null;
  const isSelf        = !!currentUser?.id && profile.userId === currentUser.id;
  const isVerified    = (profile.identityVerifiedByStripe ?? false) ||
                        (profile.identityVerifiedByVeriff ?? false) ||
                        (profile.identityVerifiedByAdmin  ?? false);

  const photos: string[] = [];
  if (profile.profilePhotoUrl) photos.push(profile.profilePhotoUrl);
  if (user?.photos) for (const p of user.photos) { if (p && !photos.includes(p)) photos.push(p); }

  const handleShare = async () => {
    const url = `${window.location.origin}/companions/${profile.id}`;
    const shareData = {
      title: `${profile.displayName} on Meytle`,
      text: `Check out ${profile.displayName}'s profile on Meytle`,
      url,
    };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!');
      }
    } catch {
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success('Link copied!');
    }
  };

  function bookNow() {
    const params = activeService ? `?service=${activeService}` : '';
    navigate(`/companions/${profile!.id}/book${params}`);
  }

  return (
    <div className="min-h-screen bg-surface-mint">

      {/* Desktop breadcrumb */}
      <div className="hidden md:block border-b border-border bg-white">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 h-[52px] flex items-center justify-between">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[13px] text-muted hover:text-heading transition-colors">
            <IconArrowLeft size={15} stroke={1.5} /> Back to results
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setSaved((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${saved ? 'border-amber-300 text-amber-600' : 'border-border text-muted hover:border-amber-300 hover:text-amber-600'}`}>
              <IconHeart size={14} stroke={1.5} className={saved ? 'fill-amber-500 text-amber-500' : ''} />
              {saved ? 'Saved' : 'Save'}
            </button>
            <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[12px] font-medium text-muted hover:border-heading hover:text-heading transition-colors">
              <IconShare size={14} stroke={1.5} /> Share
            </button>
          </div>
        </div>
      </div>

      {/* Mobile hero */}
      <div className="md:hidden relative h-[320px] bg-gray-100">
        {photos[0] && !heroImgError ? (
          <img src={photos[0]} alt={profile.displayName} className="w-full h-full object-cover"
            onError={() => setHeroImgError(true)} />
        ) : (
          <div className="w-full h-full gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-[64px]">{profile.displayName?.[0]?.toUpperCase()}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow">
            <IconArrowLeft size={18} stroke={1.5} className="text-heading" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setSaved((v) => !v)}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow">
              <IconHeart size={17} stroke={1.5}
                className={saved ? 'fill-amber-500 text-amber-500' : 'text-heading'} />
            </button>
            <button onClick={handleShare} className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow">
              <IconShare size={17} stroke={1.5} className="text-heading" />
            </button>
          </div>
        </div>
        {profile.isAvailableNow && (
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center gap-1.5 bg-white/95 rounded-full px-3 py-1.5 shadow">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-600">Available now</span>
            </div>
          </div>
        )}
      </div>

      {/* Desktop photo grid — Airbnb style */}
      <div className="hidden md:block max-w-[1180px] mx-auto px-6 lg:px-10 pt-6">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-2xl overflow-hidden">
          {/* Main photo: 2×2 */}
          <div className="col-span-2 row-span-2 relative bg-gray-100">
            {photos[0] && !heroImgError ? (
              <img src={photos[0]} alt={profile.displayName} className="w-full h-full object-cover"
                onError={() => setHeroImgError(true)} />
            ) : (
              <div className="w-full h-full gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-[80px]">{profile.displayName?.[0]?.toUpperCase()}</span>
              </div>
            )}
            {profile.isAvailableNow && (
              <div className="absolute bottom-3 left-3">
                <div className="flex items-center gap-1.5 bg-white/95 rounded-full px-3 py-1.5 shadow">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-semibold text-emerald-600">Available now</span>
                </div>
              </div>
            )}
          </div>
          {/* Slots 2–5 */}
          {[1, 2, 3, 4].map((slot) => {
            const photo  = photos[slot];
            const isLast = slot === 4;
            return (
              <div key={slot} className="relative bg-gray-100 overflow-hidden">
                {photo ? (
                  <img src={photo} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-50 to-blue-50" />
                )}
                {isLast && photos.length > 5 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-[13px] font-semibold">+{photos.length - 5} more</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">

          {/* LEFT COLUMN */}
          <div className="flex-1 min-w-0">

            {/* Name + meta */}
            <div className="flex items-start justify-between gap-3 mb-4 pb-5 border-b border-border">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-[26px] md:text-[30px] font-bold text-heading">{profile.displayName}</h1>
                  {age && <span className="text-[18px] text-muted font-light">{age}</span>}
                  {isVerified && (
                    <div className="flex items-center gap-1 bg-emerald-50 rounded-full px-2.5 py-1">
                      <IconShieldCheck size={12} stroke={1.5} className="text-emerald-600" />
                      <span className="text-[11px] font-semibold text-emerald-600">Verified</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <IconMapPin size={13} stroke={1.5} className="text-muted" />
                  <span className="text-[14px] text-muted">{areaLabel || 'Location set'}</span>
                </div>
              </div>
              <div className="md:hidden flex items-center gap-1 bg-amber-50 rounded-lg px-3 py-2 shrink-0">
                <IconStar size={14} stroke={0} fill="#F59E0B" color="#F59E0B" />
                <span className="text-[14px] font-bold text-amber-700">{rating > 0 ? rating.toFixed(1) : '—'}</span>
                <span className="text-[11px] text-amber-500">({profile.ratingCount ?? 0})</span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-border">
              {[
                { icon: <IconStar size={18} stroke={1.5} className="text-amber-500" />, value: rating > 0 ? rating.toFixed(1) : '—', label: 'Rating' },
                { icon: <IconCalendar size={18} stroke={1.5} className="text-amber-500" />, value: `${profile.ratingCount ?? 0}`, label: 'Reviews' },
                { icon: <IconClock size={18} stroke={1.5} className="text-amber-500" />, value: `$${pricePerHr.toLocaleString()}`, label: '/ hr' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1 bg-white rounded-xl border border-border py-3 px-2">
                  {stat.icon}
                  <p className="text-[16px] font-bold text-heading">{stat.value}</p>
                  <p className="text-[10px] text-muted">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6 pb-6 border-b border-border">
                <h2 className="text-[16px] font-semibold text-heading mb-2">About {profile.displayName}</h2>
                <p className="text-[14px] text-muted leading-[1.7]">{profile.bio}</p>
              </div>
            )}

            {/* Prompt */}
            {promptQ && promptA && (
              <div className="bg-white rounded-2xl p-5 border border-border mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <IconMessageDots size={15} className="text-accent-green" />
                  <p className="text-xs font-bold text-muted uppercase tracking-wide">Prompt</p>
                </div>
                <p className="text-sm font-bold text-heading mb-1.5">{promptQ}</p>
                <p className="text-sm text-body leading-relaxed">{promptA}</p>
              </div>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-border mb-6">
                <h2 className="text-[16px] font-semibold text-heading mb-3">Interests</h2>
                <div className="flex flex-wrap gap-2">
                  {interests.map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-surface-alt border border-border text-body">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {services.length > 0 && (
              <div className="mb-6 pb-6 border-b border-border">
                <div className="flex items-baseline gap-2 mb-3">
                  <h2 className="text-[16px] font-semibold text-heading">Services</h2>
                  <span className="text-[13px] text-muted">· ${pricePerHr.toLocaleString()} / hr for all</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((s) => {
                    const m    = SERVICE_META[s.serviceType];
                    const Icon = m.icon;
                    return (
                      <div key={s.id} className="flex items-center gap-3 rounded-xl border px-4 py-3.5"
                        style={{ background: m.bg, borderColor: `${m.color}20` }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${m.color}18` }}>
                          <Icon size={18} style={{ color: m.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold leading-tight" style={{ color: m.color }}>{m.label}</p>
                          <p className="text-[10px] text-muted mt-0.5 leading-tight">{m.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weekly availability */}
            {availability.length > 0 && (
              <div className="mb-6 pb-6 border-b border-border">
                <h2 className="text-[16px] font-semibold text-heading mb-3">Weekly Availability</h2>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS.map((day, i) => {
                    const slot = availability.find((a) => a.dayOfWeek === i);
                    return (
                      <div key={day}
                        className={`rounded-xl p-2 text-center ${slot ? 'bg-teal-50 border border-teal-100' : 'bg-gray-50 border border-gray-100 opacity-40'}`}>
                        <p className="text-[10px] font-bold text-heading">{day}</p>
                        {slot ? (
                          <>
                            <p className="text-[9px] text-teal-600 font-semibold mt-0.5">{slot.fromTime.slice(0, 5)}</p>
                            <p className="text-[9px] text-teal-600 font-semibold">{slot.toTime.slice(0, 5)}</p>
                          </>
                        ) : (
                          <p className="text-[9px] text-muted mt-0.5">Off</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[16px] font-semibold text-heading">Reviews</h2>
                {rating > 0 && <StarRow rating={Math.round(rating)} size={14} />}
                <span className="text-[13px] font-semibold text-heading">{rating > 0 ? rating.toFixed(1) : '—'}</span>
                <span className="text-[13px] text-muted">· {profile.ratingCount ?? 0} reviews</span>
              </div>
              {reviews.length === 0 ? (
                <p className="text-[13px] text-muted">No reviews yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((review) => {
                    const name     = review.reviewer?.fullName ?? 'User';
                    const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
                    const date     = new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    return (
                      <div key={review.id} className="bg-white rounded-xl border border-border p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold text-amber-700">{initials}</span>
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-heading">
                              {name.split(' ')[0]} {name.split(' ')[1]?.[0]}.
                            </p>
                            <div className="flex items-center gap-1.5">
                              <StarRow rating={review.starRating} size={11} />
                              <span className="text-[10px] text-muted">{date}</span>
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-[13px] text-muted leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {(profile.ratingCount ?? 0) > reviews.length && (
                <button className="mt-4 text-[13px] font-medium text-accent-green flex items-center gap-1 hover:underline">
                  See all {profile.ratingCount} reviews <IconChevronRight size={13} stroke={2} />
                </button>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN — Sticky booking panel */}
          <div className="hidden md:block w-[340px] shrink-0">
            <div className="sticky top-[76px]">
              <div className="bg-white rounded-[20px] border border-border shadow-lg overflow-hidden">

                {/* Price + rating */}
                <div className="px-6 pt-6 pb-4 border-b border-border">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-[24px] font-bold text-heading">${pricePerHr.toLocaleString()}</span>
                      <span className="text-[13px] text-muted ml-1">/ hr</span>
                    </div>
                    {rating > 0 && (
                      <div className="flex items-center gap-1.5 bg-amber-50 rounded-lg px-2.5 py-1.5">
                        <IconStar size={13} stroke={0} fill="#F59E0B" color="#F59E0B" />
                        <span className="text-[13px] font-bold text-amber-700">{rating.toFixed(1)}</span>
                        <span className="text-[11px] text-amber-500">({profile.ratingCount ?? 0})</span>
                      </div>
                    )}
                  </div>
                  {profile.isAvailableNow && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[12px] font-medium text-emerald-600">Available now</span>
                    </div>
                  )}
                </div>

                {/* Service selector */}
                {!isSelf && services.length > 0 && (
                  <div className="px-6 py-4 border-b border-border">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">Select a service</p>
                    <div className="flex flex-col gap-2">
                      {services.map((svc) => {
                        const isActive = activeService === svc.serviceType;
                        return (
                          <button key={svc.id} onClick={() => setSelectedService(svc.serviceType)}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors border ${isActive ? 'border-amber-300 bg-amber-50' : 'border-border hover:border-amber-200'}`}>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isActive ? 'border-amber-500 bg-amber-500' : 'border-border'}`}>
                              {isActive && <IconCheck size={9} stroke={3} color="white" />}
                            </div>
                            <span className={`text-[13px] font-medium ${isActive ? 'text-amber-700' : 'text-heading'}`}>
                              {SERVICE_META[svc.serviceType]?.label ?? svc.serviceType}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CTA */}
                {isSelf ? (
                  <div className="p-5 flex items-start gap-3">
                    <IconAlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-muted">This is your own companion profile.</p>
                  </div>
                ) : (
                  <div className="px-6 py-5">
                    <button onClick={bookNow}
                      className="w-full h-12 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
                      style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
                      Book Now
                    </button>
                    <p className="text-center text-[11px] text-muted mt-3">
                      You won't be charged until {profile.displayName} accepts
                    </p>
                  </div>
                )}

                {/* Trust badge */}
                <div className="px-6 pb-5">
                  <div className="flex items-center gap-2 bg-surface-alt rounded-xl px-3 py-2.5">
                    <IconShieldCheck size={15} stroke={1.5} className="text-emerald-600 shrink-0" />
                    <p className="text-[11px] text-muted">
                      {isVerified ? 'Identity & background verified by Meytle' : 'Verification pending'}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile sticky footer */}
      {!isSelf && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-3 z-30">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] text-muted">Hourly rate</p>
              <p className="text-[17px] font-bold text-heading">
                ${pricePerHr.toLocaleString()}
                <span className="text-[12px] font-normal text-muted">/hr</span>
              </p>
            </div>
            <button onClick={bookNow}
              className="flex-1 h-11 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#00D4AA,#4F8CFF)' }}>
              Book Now
            </button>
          </div>
        </div>
      )}
      {!isSelf && <div className="md:hidden h-20" />}

    </div>
  );
}
