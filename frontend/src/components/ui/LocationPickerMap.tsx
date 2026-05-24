import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { IconSearch, IconX } from '@tabler/icons-react'

interface LngLat { lng: number; lat: number }

interface LocationPickerMapProps {
  centerLng: number
  centerLat: number
  radiusKm?: number
  onSelect: (label: string, coords: LngLat) => void
  selected?: LngLat | null
}

function circlePolygon(center: LngLat, radiusKm: number, steps = 64): number[][] {
  const coords: number[][] = []
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    const dx = (radiusKm / 111.32) / Math.cos((center.lat * Math.PI) / 180)
    const dy = radiusKm / 110.574
    coords.push([center.lng + dx * Math.cos(angle), center.lat + dy * Math.sin(angle)])
  }
  return coords
}

// Haversine distance in km
function distanceKm(a: LngLat, b: LngLat): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

async function reverseGeocode(lng: number, lat: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const a = data.address ?? {}
    // Build a short readable label: shop/amenity/road + suburb/city
    const place = a.shop ?? a.amenity ?? a.cafe ?? a.tourism ?? a.leisure ?? a.road ?? a.pedestrian ?? ''
    const area  = a.suburb ?? a.neighbourhood ?? a.city_district ?? a.city ?? ''
    return [place, area].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 2).join(',').trim() || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

export default function LocationPickerMap({
  centerLng,
  centerLat,
  radiusKm = 3,
  onSelect,
  selected,
}: LocationPickerMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<maplibregl.Map | null>(null)
  const markerRef     = useRef<maplibregl.Marker | null>(null)
  const [ready, setReady]         = useState(false)
  const [search, setSearch]       = useState('')
  const [searching, setSearching] = useState(false)
  const [outsideWarn, setOutsideWarn] = useState(false)
  const [resolving, setResolving] = useState(false)

  const center = { lng: centerLng, lat: centerLat }

  // Forward geocode search → fly to result
  async function doSearch(query: string) {
    if (!query.trim() || !mapRef.current) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data[0]) {
        const pt = { lng: parseFloat(data[0].lon), lat: parseFloat(data[0].lat) }
        mapRef.current.flyTo({ center: [pt.lng, pt.lat], zoom: 15, duration: 800 })
        // Auto-select if within radius
        if (distanceKm(center, pt) <= radiusKm) {
          setResolving(true)
          const label = await reverseGeocode(pt.lng, pt.lat)
          onSelect(label, pt)
          setResolving(false)
        }
      }
    } finally {
      setSearching(false)
    }
  }

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }],
      } as maplibregl.StyleSpecification,
      center: [centerLng, centerLat],
      zoom: 13,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    map.on('load', () => {
      const circle = circlePolygon({ lng: centerLng, lat: centerLat }, radiusKm)

      // Outside dimming — full world minus the circle
      map.addSource('mask', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            // world box with hole cut out for the companion's area
            coordinates: [
              [[-180,-90],[180,-90],[180,90],[-180,90],[-180,-90]],
              circle,
            ],
          },
        },
      })
      map.addLayer({
        id: 'mask-fill',
        type: 'fill',
        source: 'mask',
        paint: { 'fill-color': '#000000', 'fill-opacity': 0.18 },
      })

      // Area border
      map.addSource('area', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [circle] },
        },
      })
      map.addLayer({
        id: 'area-border',
        type: 'line',
        source: 'area',
        paint: { 'line-color': '#E8A000', 'line-width': 2, 'line-dasharray': [5, 3] },
      })

      // Companion's home dot
      const homeEl = document.createElement('div')
      homeEl.style.cssText = 'width:10px;height:10px;border-radius:50%;background:#E8A000;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3);'
      new maplibregl.Marker({ element: homeEl }).setLngLat([centerLng, centerLat]).addTo(map)

      setReady(true)
    })

    map.on('click', async e => {
      const pt = { lng: e.lngLat.lng, lat: e.lngLat.lat }
      if (distanceKm({ lng: centerLng, lat: centerLat }, pt) > radiusKm) {
        setOutsideWarn(true)
        setTimeout(() => setOutsideWarn(false), 2000)
        return
      }
      setResolving(true)
      const label = await reverseGeocode(pt.lng, pt.lat)
      onSelect(label, pt)
      setResolving(false)
    })

    map.getCanvas().style.cursor = 'crosshair'
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Sync pin marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
    if (!selected) return

    const el = document.createElement('div')
    el.style.cssText = 'width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#E8A000;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);'
    markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([selected.lng, selected.lat])
      .addTo(map)
  }, [selected, ready])

  return (
    <div className="relative rounded-[12px] overflow-hidden border border-[var(--color-border)]" style={{ height: 260 }}>
      <div ref={containerRef} className="absolute inset-0 h-full" />

      {/* Search bar */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 w-[240px] pointer-events-auto">
        <div className="relative">
          <button onClick={() => doSearch(search)} className="absolute left-2.5 top-1/2 -translate-y-1/2">
            {searching
              ? <span className="w-3 h-3 border-2 border-[var(--color-amber)] border-t-transparent rounded-full animate-spin block" />
              : <IconSearch size={12} stroke={1.5} className="text-[var(--color-gray)]" />
            }
          </button>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(search)}
            placeholder="Search a place…"
            className="w-full h-8 pl-8 pr-7 rounded-full bg-white shadow-md border border-[var(--color-border)] text-[11px] text-[var(--color-dark)] placeholder:text-[var(--color-gray)] focus:outline-none focus:border-[var(--color-amber)] transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <IconX size={11} stroke={1.5} className="text-[var(--color-gray)]" />
            </button>
          )}
        </div>
      </div>

      {/* Outside-circle warning */}
      {outsideWarn && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="bg-black/70 text-white text-[11px] font-medium rounded-full px-3 py-1.5 whitespace-nowrap">
            Outside companion's area
          </div>
        </div>
      )}

      {/* Resolving geocode spinner */}
      {resolving && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-white/90 rounded-full px-3 py-1 border border-[var(--color-border)] shadow-sm">
            <span className="w-2.5 h-2.5 border-2 border-[var(--color-amber)] border-t-transparent rounded-full animate-spin block" />
            <span className="text-[10px] text-[var(--color-gray)]">Getting address…</span>
          </div>
        </div>
      )}

      {/* Hint */}
      <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 border border-[var(--color-border)] shadow-sm">
          <div className="w-3 h-3 rounded-full border-2 border-dashed border-[var(--color-amber)] flex-shrink-0" />
          <span className="text-[10px] text-[var(--color-gray)]">Tap inside the zone to set meeting spot</span>
        </div>
      </div>

      <style>{`
        .maplibregl-ctrl-bottom-right { bottom: 28px !important; right: 4px !important; }
        .maplibregl-ctrl-group { box-shadow: 0 1px 4px rgba(0,0,0,.12) !important; border: 0.5px solid #E8E4DC !important; border-radius: 8px !important; }
      `}</style>
    </div>
  )
}
