import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IconLoader2, IconMapPin, IconX } from '@tabler/icons-react';

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

// ── Reverse geocode via Nominatim ─────────────────────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } },
    );
    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const json = await res.json();
    const a = json.address ?? {};
    // Build a concise label: neighbourhood / road, city
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

// ── Click handler inside the map ──────────────────────────────────────────────
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// ── Re-center helper ──────────────────────────────────────────────────────────
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
  /** Centre of companion's service area [lat, lng] */
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  value: PickedLocation | null;
  onChange: (v: PickedLocation) => void;
  onClear?: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────
export function LocationPickerMap({ centerLat, centerLng, radiusKm, value, onChange, onClear }: Props) {
  const [geocoding, setGeocoding] = useState(false);

  const handlePick = async (lat: number, lng: number) => {
    setGeocoding(true);
    const text = await reverseGeocode(lat, lng);
    onChange({ lat, lng, text });
    setGeocoding(false);
  };

  return (
    <div className="space-y-2">
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

          {/* Service area circle */}
          <Circle
            center={[centerLat, centerLng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#00D4AA', fillColor: '#00D4AA', fillOpacity: 0.08, weight: 1.5, dashArray: '5,5' }}
          />

          {/* Picked pin */}
          {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}

          <ClickHandler onPick={handlePick} />
        </MapContainer>

        {/* Hint overlay */}
        {!value && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
            Tap map to drop meeting pin
          </div>
        )}

        {/* Geocoding spinner */}
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
