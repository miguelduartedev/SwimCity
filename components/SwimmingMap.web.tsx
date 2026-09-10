import './leaflet-swimcity.css';
import { CSSProperties, useEffect } from 'react';
import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { divIcon, latLngBounds } from 'leaflet';
import {
  getMapMarkerAppearance,
  MapDisplayMode,
  MapMarkerAppearance,
} from '../features/swimming-spots/mapPresentation';
import { Theme } from '../theme';
import { Coordinates, SwimmingSpot } from '../types/swimming';

const HELSINKI_CENTER: [number, number] = [60.1699, 24.9384];
const HELSINKI_ZOOM = 11;

type SwimmingMapProps = {
  spots: SwimmingSpot[];
  theme: Theme;
  displayMode: MapDisplayMode;
  selectedSpotId?: string;
  userLocation?: Coordinates;
  bottomContentInset?: number;
  onSelect: (spot: SwimmingSpot) => void;
};

/** Web-only renderer. The shared Explore screen and native map retain the same contract. */
export function SwimmingMap({
  spots,
  theme,
  displayMode,
  selectedSpotId,
  userLocation,
  bottomContentInset = 0,
  onSelect,
}: SwimmingMapProps) {
  return (
    <MapContainer
      center={HELSINKI_CENTER}
      zoom={HELSINKI_ZOOM}
      scrollWheelZoom
      zoomControl={false}
      style={mapStyle}
      aria-label="Interactive map of Helsinki swimming spots"
    >
      <TileLayer
        attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToSpots spots={spots} bottomContentInset={bottomContentInset} />
      <PositionAttribution bottomContentInset={bottomContentInset} />
      {spots.map((spot) => {
        const appearance = getMapMarkerAppearance(spot, displayMode, theme);

        return (
          <Marker
            key={spot.id}
            position={[spot.coordinates.latitude, spot.coordinates.longitude]}
            icon={createSpotMarkerIcon(appearance, theme.surface)}
            title={appearance.tooltip}
            alt={appearance.accessibilityLabel}
            eventHandlers={{ click: () => onSelect(spot) }}
          >
            {selectedSpotId === spot.id && (
              <Tooltip permanent direction="top" offset={[0, -8]}>
                {appearance.tooltip}
              </Tooltip>
            )}
          </Marker>
        );
      })}
      {userLocation && (
        <CircleMarker
          center={[userLocation.latitude, userLocation.longitude]}
          radius={8}
          pathOptions={{ color: '#fff', weight: 3, fillColor: theme.blue, fillOpacity: 1 }}
        >
          <Tooltip>Your location</Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}

function createSpotMarkerIcon(appearance: MapMarkerAppearance, borderColor: string) {
  return divIcon({
    className: 'swimcity-spot-marker-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `<span style="background:${appearance.fillColor};border-color:${borderColor};color:${appearance.textColor}">${appearance.label}</span>`,
  });
}

function FitToSpots({
  spots,
  bottomContentInset,
}: {
  spots: SwimmingSpot[];
  bottomContentInset: number;
}) {
  const map = useMap();

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      map.invalidateSize();

      if (spots.length === 0) {
        map.setView(HELSINKI_CENTER, HELSINKI_ZOOM);
        return;
      }

      map.fitBounds(
        latLngBounds(spots.map((spot) => [spot.coordinates.latitude, spot.coordinates.longitude])),
        {
          paddingTopLeft: [32, 32],
          paddingBottomRight: [32, bottomContentInset + 32],
          maxZoom: 13,
          animate: true,
        },
      );
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [bottomContentInset, map, spots]);

  return null;
}

function PositionAttribution({ bottomContentInset }: { bottomContentInset: number }) {
  const map = useMap();

  useEffect(() => {
    const container = map.attributionControl?.getContainer();
    if (!container) return;

    container.style.marginBottom = `${bottomContentInset + 8}px`;
    return () => {
      container.style.marginBottom = '';
    };
  }, [bottomContentInset, map]);

  return null;
}

const mapStyle: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 };
