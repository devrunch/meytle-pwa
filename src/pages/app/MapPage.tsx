import { IconSearch } from '@tabler/icons-react'
import { useState } from 'react'
import MapView from '../../components/ui/MapView'

export default function MapPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Search overlay */}
      <div className="absolute top-12 left-0 right-0 z-10 px-4">
        <div className="relative">
          <IconSearch size={15} stroke={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray)]" />
          <input
            type="text"
            placeholder="Search area..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-[10px] bg-white border border-[var(--color-border)] shadow-sm text-[13px] text-[var(--color-dark)] placeholder:text-[var(--color-gray)] focus:outline-none focus:border-[var(--color-amber)] transition-colors"
          />
        </div>
      </div>

      {/* Map — browse mode (drawMode=false shows companion pins) */}
      <MapView
        drawMode={false}
        className="absolute inset-0"
        height={window.innerHeight - 52}
      />
    </div>
  )
}
