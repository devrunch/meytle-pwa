import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { IconPencil, IconCircle, IconTrash, IconSearch, IconAdjustmentsHorizontal, IconHandStop } from '@tabler/icons-react'
import { cn } from '../../lib/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LngLat { lng: number; lat: number }

interface BlobArea {
  id: string
  kind: 'blob'
  coords: LngLat[]   // geographic coordinates
  label: string
}

interface CircleArea {
  id: string
  kind: 'circle'
  center: LngLat
  radiusKm: number
  label: string
}

type Area = BlobArea | CircleArea

// ─── Geo helpers ──────────────────────────────────────────────────────────────

// Generate circle polygon as GeoJSON coords
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

function lngLatToGeoJSON(coords: LngLat[]): number[][] {
  return coords.map((c) => [c.lng, c.lat])
}

// ─── Mock companion pins ──────────────────────────────────────────────────────

const COMPANION_PINS = [
  { id: '1', name: 'Aanya',  price: 800,  available: true,  lng: 72.826, lat: 19.054 },
  { id: '2', name: 'Rohan',  price: 1200, available: false, lng: 72.835, lat: 19.064 },
  { id: '3', name: 'Priya',  price: 700,  available: true,  lng: 72.820, lat: 19.044 },
  { id: '4', name: 'Kabir',  price: 1000, available: true,  lng: 72.843, lat: 19.058 },
  { id: '5', name: 'Meera',  price: 750,  available: true,  lng: 72.815, lat: 19.060 },
  { id: '6', name: 'Arjun',  price: 800,  available: false, lng: 72.831, lat: 19.070 },
]

// ─── Layer IDs ────────────────────────────────────────────────────────────────

const FILL_LAYER   = 'meytle-area-fill'
const BORDER_LAYER = 'meytle-area-border'
const LIVE_FILL    = 'meytle-live-fill'
const LIVE_BORDER  = 'meytle-live-border'
const SOURCE_ID    = 'meytle-areas'
const LIVE_SOURCE  = 'meytle-live'

type DrawTool = 'move' | 'blob' | 'circle'

interface MapViewProps {
  height?: number
  drawMode?: boolean
  className?: string
  fullscreen?: boolean
}

export default function MapView({ height = 400, drawMode = false, className, fullscreen = false }: MapViewProps) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const mapRef         = useRef<maplibregl.Map | null>(null)
  const markersRef     = useRef<maplibregl.Marker[]>([])
  const isDrawingRef   = useRef(false)

  const [mapReady, setMapReady]   = useState(false)
  const [tool, setTool]           = useState<DrawTool>('move')
  const [areas, setAreas]         = useState<Area[]>([])
  const [liveCoords, setLiveCoords] = useState<LngLat[]>([])
  const [selectedPin, setSelectedPin] = useState<typeof COMPANION_PINS[number] | null>(null)
  const [search, setSearch]       = useState('')
  const [searching, setSearching] = useState(false)

  async function geocodeSearch(query: string) {
    if (!query.trim() || !mapRef.current) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data[0]) {
        mapRef.current.flyTo({ center: [parseFloat(data[0].lon), parseFloat(data[0].lat)], zoom: 14, duration: 800 })
      }
    } finally {
      setSearching(false)
    }
  }

  // Circle placement state

  // ── Init map ────────────────────────────────────────────────────────────────

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
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }],
      } as maplibregl.StyleSpecification,
      center: [72.829, 19.057],
      zoom: 13.5,
      attributionControl: false,
    })

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    map.on('load', () => {
      // Areas source + layers
      map.addSource(SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: FILL_LAYER,   type: 'fill',   source: SOURCE_ID, paint: { 'fill-color': '#BA7517', 'fill-opacity': 0.18 } })
      map.addLayer({ id: BORDER_LAYER, type: 'line',   source: SOURCE_ID, paint: { 'line-color': '#BA7517', 'line-width': 1.5, 'line-dasharray': [4, 2] } })

      // Live drawing source + layers
      map.addSource(LIVE_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: LIVE_FILL,   type: 'fill', source: LIVE_SOURCE, paint: { 'fill-color': '#BA7517', 'fill-opacity': 0.10 } })
      map.addLayer({ id: LIVE_BORDER, type: 'line', source: LIVE_SOURCE, paint: { 'line-color': '#BA7517', 'line-width': 1, 'line-dasharray': [3, 2] } })

      setMapReady(true)
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // ── Add companion pins (browse mode) ────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapRef.current || drawMode) return
    const map = mapRef.current
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    COMPANION_PINS.forEach((pin) => {
      const el = document.createElement('div')
      el.className = [
        'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold shadow-md border-[1.5px] cursor-pointer transition-all duration-150',
        pin.available
          ? 'bg-white text-[#1A1A1A] border-[#E8E4DC] hover:border-[#BA7517] hover:scale-105'
          : 'bg-[#F5F2EC] text-[#666] border-[#E8E4DC]',
      ].join(' ')
      el.style.cssText = 'display:flex;align-items:center;gap:4px;white-space:nowrap;'
      el.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>₹${pin.price >= 1000 ? (pin.price/1000).toFixed(1)+'k' : pin.price}`

      el.addEventListener('click', () =>
        setSelectedPin((prev) => prev?.id === pin.id ? null : pin)
      )

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map)
      markersRef.current.push(marker)
    })

    return () => { markersRef.current.forEach((m) => m.remove()); markersRef.current = [] }
  }, [mapReady, drawMode])

  // ── Sync areas → map source ──────────────────────────────────────────────────

  const syncAreas = useCallback((areaList: Area[]) => {
    const map = mapRef.current
    if (!map || !map.getSource(SOURCE_ID)) return
    const features = areaList.map((area): GeoJSON.Feature => {
      if (area.kind === 'blob') {
        const coords = lngLatToGeoJSON(area.coords)
        return { type: 'Feature', properties: { id: area.id, label: area.label }, geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] } }
      } else {
        return { type: 'Feature', properties: { id: area.id, label: area.label }, geometry: { type: 'Polygon', coordinates: [circlePolygon(area.center, area.radiusKm)] } }
      }
    });
    (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features })
  }, [])

  useEffect(() => { syncAreas(areas) }, [areas, syncAreas])

  // ── Sync live drawing ────────────────────────────────────────────────────────

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getSource(LIVE_SOURCE)) return
    if (liveCoords.length < 2) {
      ;(map.getSource(LIVE_SOURCE) as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] })
      return
    }
    const coords = lngLatToGeoJSON(liveCoords)
    ;(map.getSource(LIVE_SOURCE) as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] } }],
    })
  }, [liveCoords])

  // ── Draw mode map event handlers ─────────────────────────────────────────────

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !drawMode) return

    // Move tool — just pan normally, no drawing hooks needed
    if (tool === 'move') {
      map.dragPan.enable()
      map.getCanvas().style.cursor = 'grab'
      return () => { map.getCanvas().style.cursor = '' }
    }

    // Blob freehand drawing
    function onMouseDown(e: maplibregl.MapMouseEvent) {
      if (tool !== 'blob') return
      isDrawingRef.current = true
      map!.dragPan.disable()
      setLiveCoords([{ lng: e.lngLat.lng, lat: e.lngLat.lat }])
    }

    function onMouseMove(e: maplibregl.MapMouseEvent) {
      if (!isDrawingRef.current || tool !== 'blob') return
      setLiveCoords((prev) => {
        const last = prev[prev.length - 1]
        const dx = e.lngLat.lng - last.lng
        const dy = e.lngLat.lat - last.lat
        if (Math.sqrt(dx * dx + dy * dy) < 0.0001) return prev
        return [...prev, { lng: e.lngLat.lng, lat: e.lngLat.lat }]
      })
    }

    function onMouseUp() {
      if (tool !== 'blob') return
      map!.dragPan.enable()
      if (!isDrawingRef.current) return
      isDrawingRef.current = false
      setLiveCoords((prev) => {
        if (prev.length > 5) {
          const id = Math.random().toString(36).slice(2)
          setAreas((a) => [...a, { id, kind: 'blob' as const, coords: prev, label: `Area ${a.length + 1}` }])
        }
        return []
      })
    }

    // Circle placement — click only, pan works normally between clicks
    function onClick(e: maplibregl.MapMouseEvent) {
      if (tool !== 'circle') return
      const center = { lng: e.lngLat.lng, lat: e.lngLat.lat }
      const id = Math.random().toString(36).slice(2)
      setAreas((prev) => [...prev, { id, kind: 'circle', center, radiusKm: 0.5, label: `Area ${prev.length + 1}` }])
    }

    map.on('mousedown', onMouseDown)
    map.on('mousemove', onMouseMove)
    map.on('mouseup',   onMouseUp)
    map.on('click',     onClick)
    map.getCanvas().style.cursor = tool === 'blob' ? 'crosshair' : 'cell'

    return () => {
      map.off('mousedown', onMouseDown)
      map.off('mousemove', onMouseMove)
      map.off('mouseup',   onMouseUp)
      map.off('click',     onClick)
      map.getCanvas().style.cursor = ''
      map.dragPan.enable()
      isDrawingRef.current = false
    }
  }, [mapReady, drawMode, tool])

  // ── Delete area ───────────────────────────────────────────────────────────────

  function deleteArea(id: string) {
    setAreas((prev) => prev.filter((a) => a.id !== id))
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(!fullscreen && 'rounded-[var(--radius-xl)] border border-[var(--color-border)]', 'relative overflow-hidden', className)}
      style={fullscreen ? { width: '100%', height: '100%' } : { height }}
    >

      {/* Map container */}
      <div ref={containerRef} className="absolute inset-0 h-full" />

      {/* ── Browse mode UI ── */}
      {!drawMode && (
        <>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[260px]">
            <div className="relative">
              <button
                onClick={() => geocodeSearch(search)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2"
              >
                {searching
                  ? <span className="w-3 h-3 border-2 border-[var(--color-amber)] border-t-transparent rounded-full animate-spin block" />
                  : <IconSearch size={13} stroke={1.5} className="text-[var(--color-gray)]" />
                }
              </button>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && geocodeSearch(search)}
                placeholder="Search area..."
                className="w-full h-9 pl-8 pr-3 rounded-full bg-white shadow-md border border-[var(--color-border)] text-[12px] text-[var(--color-dark)] placeholder:text-[var(--color-gray)] focus:outline-none focus:border-[var(--color-amber)] transition-colors"
              />
            </div>
          </div>

          <button type="button" className="absolute bottom-14 right-3 z-30 w-10 h-10 rounded-full bg-white shadow-md border border-[var(--color-border)] flex items-center justify-center pointer-events-auto">
            <IconAdjustmentsHorizontal size={16} stroke={1.5} />
          </button>
        </>
      )}

      {/* Browse: selected pin bottom sheet */}
      {!drawMode && selectedPin && (
        <div className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-[var(--radius-xl)] border-t border-[var(--color-border)] px-4 py-3 shadow-xl pointer-events-auto" style={{ animation: 'slideUp 150ms ease-out' }}>
          <div className="w-8 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold text-[var(--color-dark)]">{selectedPin.name}</div>
              <div className="text-[12px] text-[var(--color-gray)]">₹{selectedPin.price}/hr · {selectedPin.available ? 'Available now' : 'Unavailable'}</div>
            </div>
            <button type="button" onClick={() => setSelectedPin(null)} className="px-4 py-2 bg-[var(--color-amber)] text-white text-[12px] font-medium rounded-[var(--radius-md)] pointer-events-auto">
              View Profile
            </button>
          </div>
        </div>
      )}

      {/* ── Draw mode toolbar ── */}
      {drawMode && (
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-2 pointer-events-auto">
          {/* Tool toggle */}
          <div className="flex bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-md overflow-hidden flex-shrink-0">
            <button
              type="button"
              onClick={() => setTool('move')}
              className={cn('flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors',
                tool === 'move' ? 'bg-[var(--color-dark)] text-white' : 'text-[var(--color-gray)] hover:bg-[var(--color-bg)]')}
              title="Pan / move map"
            >
              <IconHandStop size={13} stroke={1.5} />
              Move
            </button>
            <button
              type="button"
              onClick={() => setTool('blob')}
              className={cn('flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors border-l border-[var(--color-border)]',
                tool === 'blob' ? 'bg-[var(--color-amber)] text-white' : 'text-[var(--color-gray)] hover:bg-[var(--color-bg)]')}
              title="Freehand draw"
            >
              <IconPencil size={13} stroke={1.5} />
              Draw
            </button>
            <button
              type="button"
              onClick={() => setTool('circle')}
              className={cn('flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors border-l border-[var(--color-border)]',
                tool === 'circle' ? 'bg-[var(--color-amber)] text-white' : 'text-[var(--color-gray)] hover:bg-[var(--color-bg)]')}
              title="Place circle"
            >
              <IconCircle size={13} stroke={1.5} />
              Circle
            </button>
          </div>

          {/* Hint */}
          <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-[var(--radius-md)] px-2.5 py-1.5 text-[11px] text-[var(--color-dark)] shadow-sm border border-[var(--color-border)] truncate">
            {tool === 'move'   ? 'Drag to pan the map' :
             tool === 'blob'   ? 'Hold and drag to draw your area' :
                                 'Click to place a circle'}
          </div>

          {/* Clear all */}
          {areas.length > 0 && (
            <button
              type="button"
              onClick={() => setAreas([])}
              className="flex items-center gap-1 bg-white rounded-[var(--radius-md)] px-2.5 py-1.5 text-[11px] text-[var(--color-error)] shadow-sm border border-[var(--color-border)] flex-shrink-0"
            >
              <IconTrash size={12} stroke={1.5} />
              Clear
            </button>
          )}
        </div>
      )}

      {/* Draw mode: area list + delete */}
      {drawMode && areas.length > 0 && (
        <div className="absolute bottom-3 left-3 z-30 flex flex-col gap-1.5 pointer-events-auto max-w-[180px]">
          {areas.map((area) => (
            <div key={area.id} className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-[var(--radius-md)] px-2.5 py-1.5 shadow-sm border border-[var(--color-border)]">
              <div className="w-3 h-3 rounded-sm bg-[var(--color-amber)] opacity-70 flex-shrink-0" />
              <span className="text-[11px] text-[var(--color-dark)] font-medium flex-1 truncate">{area.label}</span>
              <button
                type="button"
                onClick={() => deleteArea(area.id)}
                className="text-[var(--color-gray)] hover:text-[var(--color-error)] transition-colors flex-shrink-0"
                aria-label={`Delete ${area.label}`}
              >
                <IconTrash size={11} stroke={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Circle: radius hint */}
      {drawMode && tool === 'circle' && areas.filter((a) => a.kind === 'circle').length > 0 && (
        <div className="absolute bottom-3 right-3 z-30 bg-white/90 backdrop-blur-sm rounded-[var(--radius-md)] px-2.5 py-1.5 text-[10px] text-[var(--color-gray)] border border-[var(--color-border)] shadow-sm pointer-events-none">
          Circles placed: {areas.filter((a) => a.kind === 'circle').length}
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .maplibregl-ctrl-bottom-right { bottom: 4px !important; right: 4px !important; }
        .maplibregl-ctrl-group { box-shadow: 0 2px 8px rgba(0,0,0,0.10) !important; border: 0.5px solid #E8E4DC !important; border-radius: 8px !important; }
      `}</style>
    </div>
  )
}
