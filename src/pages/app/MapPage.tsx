import MapView from '../../components/ui/MapView'

export default function MapPage() {
  return (
    <div style={{ height: 'calc(100vh - 52px)' }} className="relative overflow-hidden md:h-[calc(100vh-60px)]">
      <MapView drawMode={false} fullscreen />
    </div>
  )
}
