import 'leaflet/dist/leaflet.css';
import { CSSProperties, useEffect } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { latLngBounds } from 'leaflet';
import { calculateSwimmingStatus } from '../features/swimming-spots/domain';
import { Theme, statusMeta } from '../theme';
import { Coordinates, SwimmingSpot } from '../types/swimming';

const HELSINKI_CENTER: [number, number] = [60.1699, 24.9384];
const HELSINKI_ZOOM = 11;

type SwimmingMapProps = {
  spots: SwimmingSpot[];
  theme: Theme;
  userLocation?: Coordinates;
  onSelect: (spot: SwimmingSpot) => void;
};

/** Web-only renderer. The shared Explore screen and native map retain the same contract. */
export function SwimmingMap({ spots, theme, userLocation, onSelect }: SwimmingMapProps) {
  return <MapContainer center={HELSINKI_CENTER} zoom={HELSINKI_ZOOM} scrollWheelZoom zoomControl={false} style={mapStyle} aria-label="Interactive map of Helsinki swimming spots">
    <TileLayer
      attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    <FitToSpots spots={spots} />
    {spots.map((spot) => {
      const status = calculateSwimmingStatus(spot.observation);
      return <CircleMarker
        key={spot.id}
        center={[spot.coordinates.latitude, spot.coordinates.longitude]}
        radius={12}
        pathOptions={{ color: theme.surface, weight: 3, fillColor: theme[status], fillOpacity: 1 }}
        eventHandlers={{ click: () => onSelect(spot) }}
      >
        <Tooltip direction="top" offset={[0, -8]}>{spot.name} — {statusMeta[status].label}</Tooltip>
      </CircleMarker>;
    })}
    {userLocation && <CircleMarker center={[userLocation.latitude, userLocation.longitude]} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: theme.blue, fillOpacity: 1 }}><Tooltip>Your location</Tooltip></CircleMarker>}
  </MapContainer>;
}

function FitToSpots({ spots }: { spots: SwimmingSpot[] }) {
  const map = useMap();
  useEffect(() => {
    if (spots.length === 0) {
      map.setView(HELSINKI_CENTER, HELSINKI_ZOOM);
      return;
    }
    map.fitBounds(latLngBounds(spots.map((spot) => [spot.coordinates.latitude, spot.coordinates.longitude])), { padding: [32, 32], maxZoom: 13, animate: true });
  }, [map, spots]);
  return null;
}

const mapStyle: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 };
