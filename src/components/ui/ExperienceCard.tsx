import {
  IconCoffee, IconChefHat, IconMusic, IconPlane,
  IconRun, IconBuildingArch, IconTree, IconMovie,
  IconShoppingBag, IconDeviceGamepad2,
} from '@tabler/icons-react'
import { cn } from '../../lib/cn'
import type { ExperienceType } from '../../types'

interface ExperienceCardProps {
  type: ExperienceType
  label: string
  imageUrl?: string
  onClick?: () => void
  size?: 'sm' | 'md'
  className?: string
}

const iconMap: Record<ExperienceType, React.ReactNode> = {
  coffee:   <IconCoffee size={18} stroke={1.5} color="white" />,
  dining:   <IconChefHat size={18} stroke={1.5} color="white" />,
  concert:  <IconMusic size={18} stroke={1.5} color="white" />,
  travel:   <IconPlane size={18} stroke={1.5} color="white" />,
  fitness:  <IconRun size={18} stroke={1.5} color="white" />,
  culture:  <IconBuildingArch size={18} stroke={1.5} color="white" />,
  nature:   <IconTree size={18} stroke={1.5} color="white" />,
  movies:   <IconMovie size={18} stroke={1.5} color="white" />,
  shopping: <IconShoppingBag size={18} stroke={1.5} color="white" />,
  gaming:   <IconDeviceGamepad2 size={18} stroke={1.5} color="white" />,
}

const gradientMap: Record<ExperienceType, string> = {
  coffee:   'from-[#c8a060] to-[#7a5020]',
  dining:   'from-[#607880] to-[#2a4858]',
  concert:  'from-[#8060a8] to-[#402060]',
  travel:   'from-[#6080c8] to-[#203080]',
  fitness:  'from-[#c07060] to-[#802030]',
  culture:  'from-[#508870] to-[#205840]',
  nature:   'from-[#6a9860] to-[#2a5820]',
  movies:   'from-[#887060] to-[#483828]',
  shopping: 'from-[#c080a0] to-[#804060]',
  gaming:   'from-[#6060a8] to-[#202068]',
}

export default function ExperienceCard({ type, label, imageUrl, onClick, size = 'md', className }: ExperienceCardProps) {
  const dimensions = size === 'sm' ? 'w-[90px] h-[70px]' : 'w-[150px] h-[120px]'
  return (
    <div
      className={cn(
        'flex-shrink-0 rounded-[10px] overflow-hidden relative cursor-pointer',
        'transition-transform duration-200 hover:scale-[1.03]',
        dimensions,
        className,
      )}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      role="button"
      aria-label={`Browse ${label} experiences`}
    >
      {imageUrl
        ? <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        : <div className={cn('w-full h-full bg-gradient-to-br', gradientMap[type])} />
      }
      <div className="absolute bottom-0 left-0 p-2 flex flex-col gap-0.5">
        {iconMap[type]}
        <span className="text-[11px] font-medium text-white leading-tight">{label}</span>
      </div>
    </div>
  )
}
