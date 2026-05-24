import { cn } from '../../lib/cn'

interface AvatarProps {
  src?: string | null
  initials: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
  className?: string
  alt?: string
}

const sizeClasses = {
  sm:  'w-8 h-8 text-[12px]',
  md:  'w-10 h-10 text-[14px]',
  lg:  'w-14 h-14 text-[20px]',
  xl:  'w-20 h-20 text-[28px]',
}

const dotSize = {
  sm: 'w-2 h-2 -bottom-0.5 -right-0.5',
  md: 'w-2.5 h-2.5 bottom-0 right-0',
  lg: 'w-3 h-3 bottom-0.5 right-0.5',
  xl: 'w-4 h-4 bottom-1 right-1',
}

const bgColors = [
  'bg-[#c8a96e]', 'bg-[#8fa8c8]', 'bg-[#c8a0a0]',
  'bg-[#90c8a0]', 'bg-[#a0a0c8]', 'bg-[#c8b090]',
]

function pickBg(initials: string) {
  return bgColors[initials.charCodeAt(0) % bgColors.length]
}

export default function Avatar({ src, initials, size = 'md', online, className, alt }: AvatarProps) {
  const imgEl = src ? (
    <img
      src={src}
      alt={alt ?? initials}
      className={cn('rounded-full object-cover flex-shrink-0', sizeClasses[size], className)}
    />
  ) : (
    <div
      className={cn('rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white', pickBg(initials), sizeClasses[size], className)}
      aria-label={alt ?? initials}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  )

  if (online === undefined) return imgEl

  return (
    <div className="relative flex-shrink-0 inline-flex">
      {imgEl}
      <div className={cn(
        'absolute rounded-full border-2 border-white',
        dotSize[size],
        online ? 'bg-[var(--color-success)]' : 'bg-[var(--color-gray)]'
      )} />
    </div>
  )
}
