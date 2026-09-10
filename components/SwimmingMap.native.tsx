import MapView, { Marker, Region } from 'react-native-maps';
import { ComponentRef, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  getMapMarkerAppearance,
  MapDisplayMode,
} from '../features/swimming-spots/mapPresentation';
import { helsinkiCity } from '../services/api/helsinki';
import { Theme } from '../theme';
import { Coordinates, SwimmingSpot } from '../types/swimming';

const initialRegion: Region = helsinkiCity.initialRegion;

type SwimmingMapProps = {
  spots: SwimmingSpot[];
  theme: Theme;
  displayMode: MapDisplayMode;
  selectedSpotId?: string;
  userLocation?: Coordinates;
  bottomContentInset?: number;
  onSelect: (spot: SwimmingSpot) => void;
};

export function SwimmingMap({
  spots,
  theme,
  displayMode,
  selectedSpotId,
  userLocation,
  bottomContentInset = 0,
  onSelect,
}: SwimmingMapProps) {
  const mapInsets = { top: 0, right: 0, bottom: bottomContentInset, left: 0 };
  const markerRefs = useRef<Record<string, ComponentRef<typeof Marker> | null>>({});

  useEffect(() => {
    Object.entries(markerRefs.current).forEach(([spotId, marker]) => {
      if (!marker) return;
      if (spotId === selectedSpotId) marker.showCallout();
      else marker.hideCallout();
    });
  }, [selectedSpotId]);

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion}
      showsUserLocation={Boolean(userLocation)}
      showsMyLocationButton={false}
      mapPadding={mapInsets}
      legalLabelInsets={mapInsets}
      appleLogoInsets={mapInsets}
      accessibilityLabel="Interactive map of Helsinki swimming spots"
    >
      {spots.map((spot) => {
        const appearance = getMapMarkerAppearance(spot, displayMode, theme);

        return (
          <Marker
            key={spot.id}
            ref={(marker) => {
              markerRefs.current[spot.id] = marker;
            }}
            coordinate={spot.coordinates}
            title={spot.name}
            description={appearance.tooltip}
            onPress={() => onSelect(spot)}
          >
            <View
              accessible
              accessibilityLabel={appearance.accessibilityLabel}
              style={[
                styles.marker,
                { borderColor: theme.surface, backgroundColor: appearance.fillColor },
              ]}
            >
              <Text style={[styles.markerText, { color: appearance.textColor }]}>
                {appearance.label}
              </Text>
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  marker: {
    height: 40,
    width: 40,
    borderWidth: 3,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#001',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  markerText: { fontWeight: '900', fontSize: 13 },
});
