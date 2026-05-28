import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconStar, IconMapPin, IconShieldCheck, IconShare,
  IconHeart, IconClock, IconCheck, IconCalendar, IconMessageCircle,
  IconChevronRight,
} from '@tabler/icons-react'
import { api } from '../../lib/api'

interface ApiProfile {
  id: string
  displayName: string
  bio: string
  dateOfBirth: string
  profilePhotoUrl: string
  hourlyRatePaisa: number
  ratingAvg: number | null
  ratingCount: number
  isAvailableNow: boolean
  serviceAreaRadiusKm: number
  profileStatus: string
}

interface ApiService {
  id: string
  serviceType: string
}

interface ApiReview {
  id: string
  starRating: number
  comment: string
  createdAt: string
  reviewer?: { fullName: string }
}

const SERVICE_LABELS: Record<string, string> = {
  coffee: 'Coffee Dates',
  dining: 'Fine Dining',
  concert: 'Concerts',
  travel: 'Travel',
  fitness: 'Fitness',
  culture: 'Cultural Events',
  nature: 'Nature Walks',
  movies: 'Movies',
  shopping: 'Shopping',
  gaming: 'Gaming',
}

function calcAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--
  return age
}

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

const EXTRA_PHOTOS = [
  'https://images.unsplash.com/photo-1521566652839-697aa473761a?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=300&fit=crop',
]

export default function CompanionProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ApiProfile | null>(null)
  const [services, setServices] = useState<ApiService[]>([])
  const [reviews, setReviews] = useState<ApiReview[]>([])
  const [heroImgError, setHeroImgError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [selectedService, setSelectedService] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get<ApiProfile>(`/companions/${id}`),
      api.get<ApiService[]>(`/companions/${id}/services`),
      api.get<ApiReview[]>(`/reviews/companion/${id}`),
    ])
      .then(([p, s, r]) => {
        setProfile(p.data)
        setServices(s.data)
        setReviews(r.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] animate-pulse">
        <div className="hidden md:block border-b bg-white h-[52px]" />
        <div className="hidden md:block max-w-[1180px] mx-auto px-6 pt-6">
          <div className="h-[400px] rounded-[16px] bg-[var(--color-gray-light)]" />
        </div>
        <div className="max-w-[1180px] mx-auto px-4 py-6 flex gap-8">
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-16 rounded-[12px] bg-white border border-[var(--color-border)]" />
            <div className="h-40 rounded-[12px] bg-white border border-[var(--color-border)]" />
          </div>
          <div className="hidden md:block w-[340px] h-[400px] rounded-[20px] bg-white border border-[var(--color-border)]" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-[15px] text-[var(--color-dark)]">Companion not found</p>
        <button onClick={() => navigate('/app')} className="mt-3 text-[var(--color-amber)] text-[13px]">Go back</button>
      </div>
    )
  }

  const age = calcAge(profile.dateOfBirth)
  const rating = profile.ratingAvg ?? 0
  const pricePerHr = Math.round(profile.hourlyRatePaisa / 100)
  const activeService = selectedService ?? services[0]?.serviceType ?? null
  const isVerified = profile.profileStatus === 'active'

  function bookNow() {
    const params = activeService ? `?service=${activeService}` : ''
    navigate(`/app/bookings/new/${profile!.id}${params}`)
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">

      {/* Desktop breadcrumb */}
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

      {/* Mobile hero */}
      <div className="md:hidden relative h-[320px] bg-[var(--color-gray-light)]">
        {profile.profilePhotoUrl && !heroImgError ? (
          <img src={profile.profilePhotoUrl} alt={profile.displayName} className="w-full h-full object-cover" onError={() => setHeroImgError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--color-amber)] to-[#4F8CFF] flex items-center justify-center">
            <span className="text-white font-bold text-[64px]">{profile.displayName?.[0]?.toUpperCase()}</span>
          </div>
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
        {profile.isAvailableNow && (
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center gap-1.5 bg-white/95 rounded-full px-3 py-1.5 shadow">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
              <span className="text-[11px] font-semibold text-[var(--color-success)]">Available now</span>
            </div>
          </div>
        )}
      </div>

      {/* Desktop photo grid */}
      <div className="hidden md:block max-w-[1180px] mx-auto px-6 lg:px-10 pt-6">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-[16px] overflow-hidden">
          <div className="col-span-2 row-span-2 relative bg-[var(--color-gray-light)]">
            {profile.profilePhotoUrl && !heroImgError ? (
              <img src={profile.profilePhotoUrl} alt={profile.displayName} className="w-full h-full object-cover" onError={() => setHeroImgError(true)} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--color-amber)] to-[#4F8CFF] flex items-center justify-center">
                <span className="text-white font-bold text-[80px]">{profile.displayName?.[0]?.toUpperCase()}</span>
              </div>
            )}
            {profile.isAvailableNow && (
              <div className="absolute bottom-3 left-3">
                <div className="flex items-center gap-1.5 bg-white/95 rounded-full px-3 py-1.5 shadow">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                  <span className="text-[11px] font-semibold text-[var(--color-success)]">Available now</span>
                </div>
              </div>
            )}
          </div>
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

      {/* Main layout */}
      <div className="max-w-[1180px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">

          {/* LEFT COLUMN */}
          <div className="flex-1 min-w-0">

            {/* Name + meta */}
            <div className="flex items-start justify-between gap-3 mb-4 pb-5 border-b border-[var(--color-border)]">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-[26px] md:text-[30px] font-bold text-[var(--color-dark)]">{profile.displayName}</h1>
                  <span className="text-[18px] text-[var(--color-gray)] font-light">{age}</span>
                  {isVerified && (
                    <div className="flex items-center gap-1 bg-[var(--color-success-bg)] rounded-full px-2.5 py-1">
                      <IconShieldCheck size={12} stroke={1.5} className="text-[var(--color-success)]" />
                      <span className="text-[11px] font-semibold text-[var(--color-success)]">Verified</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <IconMapPin size={13} stroke={1.5} className="text-[var(--color-gray)]" />
                  <span className="text-[14px] text-[var(--color-gray)]">Delhi NCR · {profile.serviceAreaRadiusKm} km radius</span>
                </div>
              </div>
              <div className="md:hidden flex items-center gap-1 bg-[var(--color-amber-light)] rounded-[8px] px-3 py-2 flex-shrink-0">
                <IconStar size={14} stroke={0} fill="var(--color-amber)" color="var(--color-amber)" />
                <span className="text-[14px] font-bold text-[var(--color-amber-dark)]">{rating > 0 ? rating.toFixed(1) : '—'}</span>
                <span className="text-[11px] text-[var(--color-amber)]">({profile.ratingCount})</span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-[var(--color-border)]">
              {[
                { icon: <IconStar size={18} stroke={1.5} className="text-[var(--color-amber)]" />, value: rating > 0 ? rating.toFixed(1) : '—', label: 'Rating' },
                { icon: <IconCalendar size={18} stroke={1.5} className="text-[var(--color-amber)]" />, value: `${profile.ratingCount}`, label: 'Reviews' },
                { icon: <IconClock size={18} stroke={1.5} className="text-[var(--color-amber)]" />, value: `₹${pricePerHr.toLocaleString()}`, label: '/ hr' },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center gap-1 bg-white rounded-[12px] border border-[var(--color-border)] py-3 px-2">
                  {stat.icon}
                  <p className="text-[16px] font-bold text-[var(--color-dark)]">{stat.value}</p>
                  <p className="text-[10px] text-[var(--color-gray)]">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6 pb-6 border-b border-[var(--color-border)]">
                <h2 className="text-[16px] font-semibold text-[var(--color-dark)] mb-2">About {profile.displayName}</h2>
                <p className="text-[14px] text-[var(--color-gray)] leading-[1.7]">{profile.bio}</p>
              </div>
            )}

            {/* Services */}
            {services.length > 0 && (
              <div className="mb-6 pb-6 border-b border-[var(--color-border)]">
                <div className="flex items-baseline gap-2 mb-3">
                  <h2 className="text-[16px] font-semibold text-[var(--color-dark)]">Services</h2>
                  <span className="text-[13px] text-[var(--color-gray)]">· ₹{pricePerHr.toLocaleString()} / hr for all</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map(svc => (
                    <div
                      key={svc.id}
                      className="flex items-center gap-3 bg-white rounded-[12px] border border-[var(--color-border)] px-4 py-3.5 hover:border-[var(--color-amber)] transition-colors cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-[10px] bg-[var(--color-amber-light)] flex items-center justify-center flex-shrink-0">
                        <IconClock size={16} stroke={1.5} className="text-[var(--color-amber)]" />
                      </div>
                      <p className="text-[13px] font-semibold text-[var(--color-dark)]">{SERVICE_LABELS[svc.serviceType] ?? svc.serviceType}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-semibold text-[var(--color-dark)]">Reviews</h2>
                  {rating > 0 && <StarRow rating={Math.round(rating)} size={14} />}
                  <span className="text-[13px] font-semibold text-[var(--color-dark)]">{rating > 0 ? rating.toFixed(1) : '—'}</span>
                  <span className="text-[13px] text-[var(--color-gray)]">· {profile.ratingCount} reviews</span>
                </div>
              </div>
              {reviews.length === 0 ? (
                <p className="text-[13px] text-[var(--color-gray)]">No reviews yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map(review => {
                    const name = review.reviewer?.fullName ?? 'User'
                    const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                    const date = new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                    return (
                      <div key={review.id} className="bg-white rounded-[14px] border border-[var(--color-border)] p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-[var(--color-amber-light)] flex items-center justify-center flex-shrink-0">
                            <span className="text-[11px] font-bold text-[var(--color-amber-dark)]">{initials}</span>
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[var(--color-dark)]">{name.split(' ')[0]} {name.split(' ')[1]?.[0]}.</p>
                            <div className="flex items-center gap-1.5">
                              <StarRow rating={review.starRating} size={11} />
                              <span className="text-[10px] text-[var(--color-gray)]">{date}</span>
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-[13px] text-[var(--color-gray)] leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {profile.ratingCount > reviews.length && (
                <button className="mt-4 text-[13px] font-medium text-[var(--color-amber)] flex items-center gap-1 hover:underline">
                  See all {profile.ratingCount} reviews <IconChevronRight size={13} stroke={2} />
                </button>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN — Booking panel */}
          <div className="hidden md:block w-[340px] flex-shrink-0">
            <div className="sticky top-[76px]">
              <div className="bg-white rounded-[20px] border border-[var(--color-border)] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">

                <div className="px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-[24px] font-bold text-[var(--color-dark)]">₹{pricePerHr.toLocaleString()}</span>
                      <span className="text-[13px] text-[var(--color-gray)] ml-1">/ hr</span>
                    </div>
                    {rating > 0 && (
                      <div className="flex items-center gap-1.5 bg-[var(--color-amber-light)] rounded-[8px] px-2.5 py-1.5">
                        <IconStar size={13} stroke={0} fill="var(--color-amber)" color="var(--color-amber)" />
                        <span className="text-[13px] font-bold text-[var(--color-amber-dark)]">{rating.toFixed(1)}</span>
                        <span className="text-[11px] text-[var(--color-amber)]">({profile.ratingCount})</span>
                      </div>
                    )}
                  </div>
                  {profile.isAvailableNow && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                      <span className="text-[12px] font-medium text-[var(--color-success)]">Available now</span>
                    </div>
                  )}
                </div>

                {services.length > 0 && (
                  <div className="px-6 py-4 border-b border-[var(--color-border)]">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-gray)] mb-3">Select a service</p>
                    <div className="flex flex-col gap-2">
                      {services.map(svc => {
                        const isActive = activeService === svc.serviceType
                        return (
                          <button
                            key={svc.id}
                            onClick={() => setSelectedService(svc.serviceType)}
                            className={`flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-left transition-colors border ${
                              isActive
                                ? 'border-[var(--color-amber)] bg-[var(--color-amber-light)]'
                                : 'border-[var(--color-border)] hover:border-[var(--color-amber)]'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isActive ? 'border-[var(--color-amber)] bg-[var(--color-amber)]' : 'border-[var(--color-border)]'
                            }`}>
                              {isActive && <IconCheck size={9} stroke={3} color="white" />}
                            </div>
                            <span className={`text-[13px] font-medium ${isActive ? 'text-[var(--color-amber-dark)]' : 'text-[var(--color-dark)]'}`}>
                              {SERVICE_LABELS[svc.serviceType] ?? svc.serviceType}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="px-6 py-5">
                  <button
                    onClick={bookNow}
                    className="btn-gradient-primary w-full h-12 rounded-[12px] text-white text-[14px] font-semibold shadow-[0_2px_12px_rgba(0,212,170,0.45)] hover:opacity-90 transition-opacity mb-3"
                  >
                    Book Now
                  </button>
                  <button
                    onClick={() => navigate('/app/messages')}
                    className="w-full h-11 rounded-[12px] border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-dark)] hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] transition-colors flex items-center justify-center gap-2"
                  >
                    <IconMessageCircle size={15} stroke={1.5} />
                    Message {profile.displayName}
                  </button>
                  <p className="text-center text-[11px] text-[var(--color-gray)] mt-3">
                    You won't be charged until {profile.displayName} accepts
                  </p>
                </div>

                <div className="px-6 pb-5">
                  <div className="flex items-center gap-2 bg-[var(--color-gray-light)] rounded-[10px] px-3 py-2.5">
                    <IconShieldCheck size={15} stroke={1.5} className="text-[var(--color-success)] flex-shrink-0" />
                    <p className="text-[11px] text-[var(--color-gray)]">
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] px-4 py-3 z-30">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] text-[var(--color-gray)]">Hourly rate</p>
            <p className="text-[17px] font-bold text-[var(--color-dark)]">
              ₹{pricePerHr.toLocaleString()}
              <span className="text-[12px] font-normal text-[var(--color-gray)]">/hr</span>
            </p>
          </div>
          <button
            onClick={bookNow}
            className="btn-gradient-primary flex-1 h-11 rounded-[12px] text-white text-[14px] font-semibold"
          >
            Book Now
          </button>
        </div>
      </div>
      <div className="md:hidden h-20" />

    </div>
  )
}
