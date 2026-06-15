import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IconLoader2, IconMapPin, IconX, IconSearch } from '@tabler/icons-react';

// ── Fix Leaflet default icon in Vite ─────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#00D4AA,#4F8CFF);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);transform:rotate(-45deg)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -22],
});

// ── Reverse geocode ───────────────────────────────────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } },
    );
    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const json = await res.json();
    const a = json.address ?? {};
    const parts: string[] = [];
    const primary = a.neighbourhood || a.suburb || a.road || a.pedestrian || a.hamlet;
    const city = a.city || a.town || a.village || a.county;
    if (primary) parts.push(primary);
    if (city && city !== primary) parts.push(city);
    return parts.length ? parts.join(', ') : (json.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

// ── Forward geocode search ────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

async function searchPlaces(query: string): Promise<NominatimResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ── Map sub-components ────────────────────────────────────────────────────────
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 15, { duration: 1 }); }, [lat, lng, map]);
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prevRef = useRef<string>('');
  useEffect(() => {
    const key = `${lat},${lng}`;
    if (key !== prevRef.current) { map.setView([lat, lng], map.getZoom()); prevRef.current = key; }
  }, [lat, lng, map]);
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PickedLocation {
  lat: number;
  lng: number;
  text: string;
}

interface Props {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  value: PickedLocation | null;
  onChange: (v: PickedLocation) => void;
  onClear?: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────
export function LocationPickerMap({ centerLat, centerLng, radiusKm, value, onChange, onClear }: Props) {
  const [geocoding, setGeocoding]     = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults]         = useState<NominatimResult[]>([]);
  const [searching, setSearching]     = useState(false);
  const [flyTarget, setFlyTarget]     = useState<{ lat: number; lng: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePick = async (lat: number, lng: number) => {
    setGeocoding(true);
    const text = await reverseGeocode(lat, lng);
    onChange({ lat, lng, text });
    setGeocoding(false);
    setResults([]);
    setSearchQuery('');
  };

  const handleSearchInput = useCallback((q: string) => {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const r = await searchPlaces(q);
      setResults(r);
      setSearching(false);
    }, 400);
  }, []);

  const handleSelectResult = (r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    const label = r.display_name.split(',').slice(0, 3).join(',').trim();
    onChange({ lat, lng, text: label });
    setFlyTarget({ lat, lng });
    setSearchQuery('');
    setResults([]);
  };

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="relative">
        <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Search a place or address…"
          className="w-full h-10 pl-9 pr-9 rounded-xl bg-white border border-border text-[13px] text-heading placeholder:text-muted focus:outline-none focus:border-accent-green transition-colors"
        />
        {searching && (
          <IconLoader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted animate-spin" />
        )}
        {searchQuery && !searching && (
          <button onClick={() => { setSearchQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2">
            <IconX size={14} className="text-muted" />
          </button>
        )}

        {/* Dropdown results */}
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-1000 overflow-hidden">
            {results.map((r) => (
              <button key={r.place_id} onClick={() => handleSelectResult(r)}
                className="w-full text-left px-3 py-2.5 hover:bg-surface-alt transition-colors border-b border-border/50 last:border-0 flex items-start gap-2">
                <IconMapPin size={13} className="text-accent-green shrink-0 mt-0.5" />
                <span className="text-[12px] text-heading leading-snug line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: 220 }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Recenter lat={centerLat} lng={centerLng} />
          {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}

          <Circle
            center={[centerLat, centerLng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#00D4AA', fillColor: '#00D4AA', fillOpacity: 0.08, weight: 1.5, dashArray: '5,5' }}
          />

          {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
          <ClickHandler onPick={handlePick} />
        </MapContainer>

        {!value && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
            Search above or tap map to drop pin
          </div>
        )}

        {geocoding && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
            <IconLoader2 size={20} className="animate-spin text-teal-500" />
          </div>
        )}
      </div>

      {/* Selected location label */}
      {value && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-teal-50 border border-teal-100">
          <IconMapPin size={14} className="text-teal-500 shrink-0 mt-0.5" />
          <span className="text-xs font-semibold text-teal-700 flex-1 leading-relaxed">{value.text}</span>
          {onClear && (
            <button onClick={onClear} className="text-teal-400 hover:text-teal-600 transition-colors shrink-0">
              <IconX size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
