import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconStar, IconMapPin, IconShieldCheck, IconShare,
  IconHeart, IconClock, IconCheck, IconCalendar, IconMessageCircle,
  IconChevronRight,
} from '@tabler/icons-react'
import { MOCK_COMPANIONS } from '../../data/mock'

const MOCK_REVIEWS = [
  {
    id: 'r1',
    initials: 'SM',
    name: 'Siddharth M.',
    rating: 5,
    date: 'April 2026',
    text: 'Had an amazing time! Very punctual, great conversationalist, and super easy to talk to. Would absolutely book again.',
  },
  {
    id: 'r2',
    initials: 'NP',
    name: 'Nisha P.',
    rating: 5,
    date: 'March 2026',
    text: 'Super fun evening at the coffee shop. We talked for hours — never felt awkward for a single second. Highly recommend.',
  },
  {
    id: 'r3',
    initials: 'VR',
    name: 'Vikram R.',
    rating: 4,
    date: 'March 2026',
    text: 'Great experience overall. Very easy going and comfortable to be around. The conversation flowed naturally.',
  },
]

const EXTRA_PHOTOS = [
  'https://images.unsplash.com/photo-1521566652839-697aa473761a?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=300&fit=crop',
]

function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <IconStar
          key={i}
          size={size}
          stroke={0}
          fill={i <= rating ? 'var(--color-amber)' : '#E8E4DC'}
          color={i <= rating ? 'var(--color-amber)' : '#E8E4DC'}
        />
      ))}
    </div>
  )
}

export default function CompanionProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const companion = MOCK_COMPANIONS.find(c => c.id === id)
  const [saved, setSaved] = useState(false)
  const [selectedService, setSelectedService] = useState<string | null>(null)

  if (!companion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-[15px] text-[var(--color-dark)]">Companion not found</p>
        <button onClick={() => navigate('/app')} className="mt-3 text-[var(--color-amber)] text-[13px]">
          Go back
        </button>
      </div>
    )
  }

  const activeService = companion.services.find(s => s.type === selectedService) ?? companion.services[0]

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">

      {/* ── Top breadcrumb bar (desktop) ─────────────────────────────── */}
      <div className="hidden md:block border-b border-[var(--color-border)] bg-white">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 h-[52px] flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[13px] text-[var(--color-gray)] hover:text-[var(--color-dark)] transition-colors"
          >
            <IconArrowLeft size={15} stroke={1.5} />
            Back to results
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSaved(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[var(--color-border)] text-[12px] font-medium text-[var(--color-gray)] hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] transition-colors"
            >
              <IconHeart size={14} stroke={1.5} className={saved ? 'fill-[var(--color-amber)] text-[var(--color-amber)]' : ''} />
              {saved ? 'Saved' : 'Save'}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[var(--color-border)] text-[12px] font-medium text-[var(--color-gray)] hover:border-[var(--color-dark)] hover:text-[var(--color-dark)] transition-colors">
              <IconShare size={14} stroke={1.5} />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile hero (full bleed, overlay nav) ────────────────────── */}
      <div className="md:hidden relative h-[320px] bg-[var(--color-gray-light)]">
        {companion.avatarUrl && (
          <img src={companion.avatarUrl} alt={companion.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow"
          >
            <IconArrowLeft size={18} stroke={1.5} className="text-[var(--color-dark)]" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSaved(v => !v)}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow"
            >
              <IconHeart size={17} stroke={1.5} className={saved ? 'fill-[var(--color-amber)] text-[var(--color-amber)]' : 'text-[var(--color-dark)]'} />
            </button>
            <button className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow">
              <IconShare size={17} stroke={1.5} className="text-[var(--color-dark)]" />
            </button>
          </div>
        </div>
        {companion.isAvailableNow && (
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center gap-1.5 bg-white/95 rounded-full px-3 py-1.5 shadow">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
              <span className="text-[11px] font-semibold text-[var(--color-success)]">Available now</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop photo grid ────────────────────────────────────────── */}
      <div className="hidden md:block max-w-[1180px] mx-auto px-6 lg:px-10 pt-6">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-[16px] overflow-hidden">
          {/* Main photo */}
          <div className="col-span-2 row-span-2 relative bg-[var(--color-gray-light)]">
            {companion.avatarUrl && (
              <img src={companion.avatarUrl} alt={companion.name} className="w-full h-full object-cover" />
            )}
            {companion.isAvailableNow && (
              <div className="absolute bottom-3 left-3">
                <div className="flex items-center gap-1.5 bg-white/95 rounded-full px-3 py-1.5 shadow">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                  <span className="text-[11px] font-semibold text-[var(--color-success)]">Available now</span>
                </div>
              </div>
            )}
          </div>
          {/* Smaller photos */}
          {EXTRA_PHOTOS.map((url, i) => (
            <div key={i} className="relative bg-[var(--color-gray-light)] overflow-hidden">
              <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              {i === 3 && (
                <button className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[13px] font-semibold hover:bg-black/50 transition-colors">
                  Show all photos
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main layout ──────────────────────────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">

          {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Name + meta */}
            <div className="flex items-start justify-between gap-3 mb-4 pb-5 border-b border-[var(--color-border)]">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-[26px] md:text-[30px] font-bold text-[var(--color-dark)]">{companion.name}</h1>
                  <span className="text-[18px] text-[var(--color-gray)] font-light">{companion.age}</span>
                  {companion.isVerified && (
                    <div className="flex items-center gap-1 bg-[var(--color-success-bg)] rounded-full px-2.5 py-1">
                      <IconShieldCheck size={12} stroke={1.5} className="text-[var(--color-success)]" />
                      <span className="text-[11px] font-semibold text-[var(--color-success)]">Verified</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <IconMapPin size={13} stroke={1.5} className="text-[var(--color-gray)]" />
                  <span className="text-[14px] text-[var(--color-gray)]">{companion.neighbourhood}, {companion.city}</span>
                </div>
              </div>
              {/* Rating — visible on mobile here, on desktop in panel */}
              <div className="md:hidden flex items-center gap-1 bg-[var(--color-amber-light)] rounded-[8px] px-3 py-2 flex-shrink-0">
                <IconStar size={14} stroke={0} fill="var(--color-amber)" color="var(--color-amber)" />
                <span className="text-[14px] font-bold text-[var(--color-amber-dark)]">{companion.rating}</span>
                <span className="text-[11px] text-[var(--color-amber)]">({companion.reviewCount})</span>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-[var(--color-border)]">
              {[
                { icon: <IconStar size={18} stroke={1.5} className="text-[var(--color-amber)]" />, value: companion.rating.toString(), label: 'Rating' },
                { icon: <IconCalendar size={18} stroke={1.5} className="text-[var(--color-amber)]" />, value: `${companion.reviewCount}`, label: 'Reviews' },
                { icon: <IconClock size={18} stroke={1.5} className="text-[var(--color-amber)]" />, value: `₹${companion.priceFrom.toLocaleString()}`, label: 'From / hr' },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center gap-1 bg-white rounded-[12px] border border-[var(--color-border)] py-3 px-2">
                  {stat.icon}
                  <p className="text-[16px] font-bold text-[var(--color-dark)]">{stat.value}</p>
                  <p className="text-[10px] text-[var(--color-gray)]">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Bio */}
            <div className="mb-6 pb-6 border-b border-[var(--color-border)]">
              <h2 className="text-[16px] font-semibold text-[var(--color-dark)] mb-2">About {companion.name}</h2>
              <p className="text-[14px] text-[var(--color-gray)] leading-[1.7]">{companion.bio}</p>
            </div>

            {/* Services */}
            <div className="mb-6 pb-6 border-b border-[var(--color-border)]">
              <h2 className="text-[16px] font-semibold text-[var(--color-dark)] mb-3">Services & Pricing</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {companion.services.map(service => (
                  <div
                    key={service.type}
                    className="flex items-center justify-between bg-white rounded-[12px] border border-[var(--color-border)] px-4 py-3.5 hover:border-[var(--color-amber)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] bg-[var(--color-amber-light)] flex items-center justify-center">
                        <IconClock size={16} stroke={1.5} className="text-[var(--color-amber)]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--color-dark)]">{service.label}</p>
                        <p className="text-[11px] text-[var(--color-gray)]">per hour</p>
                      </div>
                    </div>
                    <p className="text-[15px] font-bold text-[var(--color-amber-dark)]">
                      ₹{service.pricePerHour.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-semibold text-[var(--color-dark)]">Reviews</h2>
                  <StarRow rating={Math.round(companion.rating)} size={14} />
                  <span className="text-[13px] font-semibold text-[var(--color-dark)]">{companion.rating}</span>
                  <span className="text-[13px] text-[var(--color-gray)]">· {companion.reviewCount} reviews</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_REVIEWS.map(review => (
                  <div key={review.id} className="bg-white rounded-[14px] border border-[var(--color-border)] p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--color-amber-light)] flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-bold text-[var(--color-amber-dark)]">{review.initials}</span>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--color-dark)]">{review.name}</p>
                        <div className="flex items-center gap-1.5">
                          <StarRow rating={review.rating} size={11} />
                          <span className="text-[10px] text-[var(--color-gray)]">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[13px] text-[var(--color-gray)] leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-[13px] font-medium text-[var(--color-amber)] flex items-center gap-1 hover:underline">
                See all {companion.reviewCount} reviews <IconChevronRight size={13} stroke={2} />
              </button>
            </div>

          </div>

          {/* ── RIGHT COLUMN — Booking panel (desktop only) ──────────── */}
          <div className="hidden md:block w-[340px] flex-shrink-0">
            <div className="sticky top-[76px]">
              <div className="bg-white rounded-[20px] border border-[var(--color-border)] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">

                {/* Panel header */}
                <div className="px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-[24px] font-bold text-[var(--color-dark)]">₹{companion.priceFrom.toLocaleString()}</span>
                      <span className="text-[13px] text-[var(--color-gray)] ml-1">/ hr</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[var(--color-amber-light)] rounded-[8px] px-2.5 py-1.5">
                      <IconStar size={13} stroke={0} fill="var(--color-amber)" color="var(--color-amber)" />
                      <span className="text-[13px] font-bold text-[var(--color-amber-dark)]">{companion.rating}</span>
                      <span className="text-[11px] text-[var(--color-amber)]">({companion.reviewCount})</span>
                    </div>
                  </div>
                  {companion.isAvailableNow && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                      <span className="text-[12px] font-medium text-[var(--color-success)]">Available now</span>
                    </div>
                  )}
                </div>

                {/* Service selector */}
                <div className="px-6 py-4 border-b border-[var(--color-border)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-gray)] mb-3">Select a service</p>
                  <div className="flex flex-col gap-2">
                    {companion.services.map(service => {
                      const isActive = (selectedService ?? companion.services[0].type) === service.type
                      return (
                        <button
                          key={service.type}
                          onClick={() => setSelectedService(service.type)}
                          className={`flex items-center justify-between rounded-[10px] px-3 py-2.5 text-left transition-colors border ${
                            isActive
                              ? 'border-[var(--color-amber)] bg-[var(--color-amber-light)]'
                              : 'border-[var(--color-border)] hover:border-[var(--color-amber)]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isActive ? 'border-[var(--color-amber)] bg-[var(--color-amber)]' : 'border-[var(--color-border)]'
                            }`}>
                              {isActive && <IconCheck size={9} stroke={3} color="white" />}
                            </div>
                            <span className={`text-[13px] font-medium ${isActive ? 'text-[var(--color-amber-dark)]' : 'text-[var(--color-dark)]'}`}>
                              {service.label}
                            </span>
                          </div>
                          <span className={`text-[12px] font-semibold ${isActive ? 'text-[var(--color-amber)]' : 'text-[var(--color-gray)]'}`}>
                            ₹{service.pricePerHour.toLocaleString()}/hr
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 py-5">
                  <button
                    onClick={() => navigate(`/app/bookings/new/${companion.id}`)}
                    className="btn-gradient-gold w-full h-12 rounded-[12px] text-white text-[14px] font-semibold shadow-[0_2px_12px_rgba(232,160,0,0.45)] hover:opacity-90 transition-opacity mb-3"
                  >
                    Book Now
                  </button>
                  <button
                    onClick={() => navigate('/app/messages/1')}
                    className="w-full h-11 rounded-[12px] border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-dark)] hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] transition-colors flex items-center justify-center gap-2"
                  >
                    <IconMessageCircle size={15} stroke={1.5} />
                    Message {companion.name}
                  </button>
                  <p className="text-center text-[11px] text-[var(--color-gray)] mt-3">
                    You won't be charged until {companion.name} accepts
                  </p>
                </div>

                {/* Identity badge */}
                <div className="px-6 pb-5">
                  <div className="flex items-center gap-2 bg-[var(--color-gray-light)] rounded-[10px] px-3 py-2.5">
                    <IconShieldCheck size={15} stroke={1.5} className="text-[var(--color-success)] flex-shrink-0" />
                    <p className="text-[11px] text-[var(--color-gray)]">
                      {companion.isVerified ? 'Identity & background verified by Meytle' : 'Verification pending'}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile sticky footer ─────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] px-4 py-3 z-30">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] text-[var(--color-gray)]">Starting from</p>
            <p className="text-[17px] font-bold text-[var(--color-dark)]">
              ₹{companion.priceFrom.toLocaleString()}
              <span className="text-[12px] font-normal text-[var(--color-gray)]">/hr</span>
            </p>
          </div>
          <button
            onClick={() => navigate(`/app/bookings/new/${companion.id}`)}
            className="btn-gradient-gold flex-1 h-11 rounded-[12px] text-white text-[14px] font-semibold"
          >
            Book Now
          </button>
        </div>
      </div>
      {/* Spacer for mobile footer */}
      <div className="md:hidden h-20" />

    </div>
  )
}
