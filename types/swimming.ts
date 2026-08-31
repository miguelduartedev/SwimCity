export type SwimmingStatus = 'good' | 'caution' | 'avoid' | 'unknown';
export type WaterQuality = 'excellent' | 'good' | 'satisfactory' | 'poor' | 'unknown';
export type AlgaeLevel = 'none' | 'small' | 'abundant' | 'very_abundant' | 'unknown';
export type Amenity = 'shower' | 'toilet' | 'cafe' | 'changing_room' | 'kiosk' | 'outdoor_gym';

export interface Coordinates { latitude: number; longitude: number }
export interface LifeguardInfo { available: boolean; seasonLabel?: string; hours?: string }
export interface AccessibilitySummary { available?: boolean; details?: string }
export type ObservationSource = 'fixture' | 'service-map';
export interface TimedValue<T> {
  value: T;
  observedAt: string;
  expiresAt?: string;
  source: ObservationSource;
  inferred?: boolean;
}
export interface OfficialNotice extends TimedValue<string> {
  severity?: 'caution' | 'avoid';
}
export interface SwimmingObservation {
  waterTemperature?: TimedValue<number>;
  waterQuality?: TimedValue<WaterQuality>;
  algae?: TimedValue<AlgaeLevel>;
  officialNotice?: OfficialNotice;
}
export interface SwimmingSpot {
  id: string;
  cityId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  description: string;
  amenities: Amenity[];
  accessible?: AccessibilitySummary;
  lifeguard?: LifeguardInfo;
  observation: SwimmingObservation;
}
export type SortOption = 'best' | 'nearest' | 'warmest';
export interface SpotFilters { status?: SwimmingStatus; lifeguard?: boolean; accessible?: boolean; amenity?: Amenity }
