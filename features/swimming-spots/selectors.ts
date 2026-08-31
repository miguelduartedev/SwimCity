import { calculateSwimmingStatus } from './domain';
import { Amenity, Coordinates, SortOption, SpotFilters, SwimmingSpot } from '../../types/swimming';

export const statusRank = { good: 0, caution: 1, unknown: 2, avoid: 3 } as const;
export const distanceKm = (from: Coordinates, to: Coordinates) => {
  const radians = (value: number) => value * Math.PI / 180;
  const earthKm = 6371;
  const dLat = radians(to.latitude - from.latitude); const dLon = radians(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
export const filterSpots = (spots: SwimmingSpot[], query: string, filters: SpotFilters, now = new Date()) => spots.filter((spot) => {
  const status = calculateSwimmingStatus(spot.observation, now);
  return spot.name.toLowerCase().includes(query.trim().toLowerCase()) &&
    (!filters.status || status === filters.status) &&
    (!filters.lifeguard || spot.lifeguard?.available) &&
    (!filters.accessible || spot.accessible?.available) &&
    (!filters.amenity || spot.amenities.includes(filters.amenity as Amenity));
});
export const sortSpots = (spots: SwimmingSpot[], option: SortOption, location?: Coordinates, now = new Date()) => [...spots].sort((a, b) => {
  if (option === 'nearest' && location) return distanceKm(location, a.coordinates) - distanceKm(location, b.coordinates);
  if (option === 'warmest') return (b.observation.waterTemperature?.value ?? -999) - (a.observation.waterTemperature?.value ?? -999);
  return statusRank[calculateSwimmingStatus(a.observation, now)] - statusRank[calculateSwimmingStatus(b.observation, now)];
});
