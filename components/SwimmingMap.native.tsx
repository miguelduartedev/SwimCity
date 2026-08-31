import MapView, { Marker, Region } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';
import { calculateSwimmingStatus } from '../features/swimming-spots/domain';
import { helsinkiCity } from '../services/api/helsinki';
import { Theme, statusMeta } from '../theme';
import { Coordinates, SwimmingSpot } from '../types/swimming';

const initialRegion: Region = helsinkiCity.initialRegion;

export function SwimmingMap({ spots, theme, userLocation, onSelect }: { spots: SwimmingSpot[]; theme: Theme; userLocation?: Coordinates; onSelect: (spot: SwimmingSpot) => void }) {
  return <MapView style={StyleSheet.absoluteFill} initialRegion={initialRegion} showsUserLocation={Boolean(userLocation)} showsMyLocationButton={false} accessibilityLabel="Interactive map of Helsinki swimming spots">
    {spots.map((spot) => { const status = calculateSwimmingStatus(spot.observation); return <Marker key={spot.id} coordinate={spot.coordinates} title={spot.name} description={statusMeta[status].label} onPress={() => onSelect(spot)}><View accessible accessibilityLabel={`${spot.name}: ${statusMeta[status].label}`} style={[styles.marker, { borderColor: theme.surface, backgroundColor: theme[status] }]}><Text style={styles.markerText}>{status === 'good' ? '✓' : status === 'caution' ? '!' : status === 'avoid' ? '×' : '?'}</Text></View></Marker>; })}
  </MapView>;
}
const styles = StyleSheet.create({ marker: { height: 34, width: 34, borderWidth: 3, borderRadius: 17, alignItems: 'center', justifyContent: 'center', shadowColor: '#001', shadowOpacity: .2, shadowRadius: 4 }, markerText: { color: '#fff', fontWeight: '900', fontSize: 18 } });
