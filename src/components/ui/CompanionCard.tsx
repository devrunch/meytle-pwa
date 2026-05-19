import { IconMapPin, IconCheck, IconStar } from '@tabler/icons-react'
import { cn } from '../../lib/cn'
import type { Companion } from '../../types'

interface CompanionCardProps {
  companion: Companion
  onClick?: () => void
  className?: string
}

export default function CompanionCard({ companion, onClick, className }: CompanionCardProps) {
  return (
    <article
      className={cn(
        'group flex flex-col bg-white rounded-[16px] overflow-hidden cursor-pointer',
        'transition-all duration-200',
        'hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
        'shadow-[0_0_0_1px_#E8E4DC]',
        'hover:shadow-[0_0_0_1.5px_var(--color-amber),0_8px_32px_rgba(201,146,10,0.15)]',
        className,
      )}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      role="button"
      aria-label={`View ${companion.name}'s profile`}
    >
      {/* ── Photo — fixed height ───────────────────────────────────── */}
      <div className="relative h-[200px] flex-shrink-0 bg-[var(--color-gray-light)] overflow-hidden">
        {companion.avatarUrl ? (
          <img
            src={companion.avatarUrl}
            alt={companion.name}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-amber-light)]">
            <span className="text-[48px] font-bold text-[var(--color-amber)]">{companion.initials}</span>
          </div>
        )}

        {/* Gradient fade over bottom of photo */}
        <div className="absolute inset-x-0 bottom-0 h-[80px] bg-gradient-to-t from-black/60 to-transparent" />

        {/* Name + location on photo */}
        <div className="absolute bottom-0 inset-x-0 px-3 pb-2.5">
          <p className="text-white text-[14px] font-bold leading-snug drop-shadow font-heading">
            {companion.name}, {companion.age}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <IconMapPin size={10} stroke={1.5} color="rgba(255,255,255,0.75)" />
            <span className="text-[10px] text-white/75 leading-none">{companion.neighbourhood}</span>
          </div>
        </div>

        {/* Verified dot */}
        {companion.isVerified && (
          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[var(--color-amber)] flex items-center justify-center shadow">
            <IconCheck size={11} stroke={2.5} color="white" />
          </div>
        )}

        {/* Available pill */}
        {companion.isAvailableNow && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full px-2 py-[3px] shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
            <span className="text-[9px] font-semibold text-[var(--color-success)]">Available</span>
          </div>
        )}
      </div>

      {/* ── Info — flex-grow so all cards stretch equally ─────────── */}
      <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3">

        {/* Bio — always exactly 2 lines, fixed height */}
        <p className="text-[11px] text-[var(--color-gray)] leading-[1.55] line-clamp-2 h-[34px] mb-2.5">
          {companion.bio}
        </p>

        {/* Tags — always exactly 2, fixed single row */}
        <div className="flex gap-1 mb-2.5 h-[20px] overflow-hidden">
          {companion.services.slice(0, 2).map(s => (
            <span
              key={s.type}
              className="text-[10px] bg-[var(--color-amber-light)] text-[var(--color-amber-dark)] rounded-full px-2 py-[2px] font-semibold whitespace-nowrap"
            >
              {s.label}
            </span>
          ))}
        </div>

        {/* Price + rating — pinned to bottom */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--color-border)]">
          <span className="text-[14px] font-bold text-[var(--color-dark)]">
            ₹{companion.priceFrom.toLocaleString()}
            <span className="text-[10px] font-normal text-[var(--color-gray)]">/hr</span>
          </span>
          <div className="flex items-center gap-0.5">
            <IconStar size={11} stroke={0} fill="var(--color-amber)" color="var(--color-amber)" />
            <span className="text-[11px] font-semibold text-[var(--color-dark)]">{companion.rating}</span>
          </div>
        </div>

      </div>
    </article>
  )
}
