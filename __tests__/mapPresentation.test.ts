import {
  getContrastTextColor,
  getCurrentWaterTemperature,
  getMapDisplayMode,
  getOffSeasonId,
  getMapMarkerAppearance,
  getTemperatureColor,
  TEMPERATURE_COLOR_STOPS,
} from '../features/swimming-spots/mapPresentation';
import { getTheme } from '../theme';
import { SwimmingSpot } from '../types/swimming';

const now = new Date('2026-09-10T12:00:00Z');
const spot = (temperature?: number, observedAt = '2026-09-10T11:00:00Z'): SwimmingSpot => ({
  id: 'hietaranta',
  cityId: 'helsinki',
  name: 'Hietaranta',
  address: 'Helsinki',
  description: '',
  coordinates: { latitude: 60.17, longitude: 24.93 },
  amenities: [],
  observation: {
    waterTemperature: temperature === undefined
      ? undefined
      : { value: temperature, observedAt, source: 'fixture' },
    waterQuality: { value: 'good', observedAt, source: 'fixture' },
    algae: { value: 'none', observedAt, source: 'fixture' },
  },
});

describe('seasonal map presentation', () => {
  it('uses status mode only from June through August', () => {
    expect(getMapDisplayMode(new Date('2026-05-31T12:00:00'))).toBe('temperature');
    expect(getMapDisplayMode(new Date('2026-06-01T12:00:00'))).toBe('summer-status');
    expect(getMapDisplayMode(new Date('2026-08-31T12:00:00'))).toBe('summer-status');
    expect(getMapDisplayMode(new Date('2026-09-01T12:00:00'))).toBe('temperature');
  });

  it('uses a stable identifier for each non-summer season', () => {
    expect(getOffSeasonId(new Date('2026-09-01T12:00:00'))).toBe('2026-2027');
    expect(getOffSeasonId(new Date('2027-01-01T12:00:00'))).toBe('2026-2027');
    expect(getOffSeasonId(new Date('2027-05-31T12:00:00'))).toBe('2026-2027');
    expect(getOffSeasonId(new Date('2027-06-01T12:00:00'))).toBeUndefined();
    expect(getOffSeasonId(new Date('2027-09-01T12:00:00'))).toBe('2027-2028');
  });

  it('clamps and smoothly interpolates the water-temperature color scale', () => {
    expect(getTemperatureColor(4)).toBe(TEMPERATURE_COLOR_STOPS.cold.color);
    expect(getTemperatureColor(10)).toBe(TEMPERATURE_COLOR_STOPS.cold.color);
    expect(getTemperatureColor(18)).toBe(TEMPERATURE_COLOR_STOPS.moderate.color);
    expect(getTemperatureColor(25)).toBe(TEMPERATURE_COLOR_STOPS.hot.color);
    expect(getTemperatureColor(30)).toBe(TEMPERATURE_COLOR_STOPS.hot.color);
    expect(getTemperatureColor(14)).not.toBe(TEMPERATURE_COLOR_STOPS.cold.color);
    expect(getTemperatureColor(14)).not.toBe(TEMPERATURE_COLOR_STOPS.moderate.color);
  });

  it('uses contrast-safe text against both yellow and dark-blue marker colors', () => {
    expect(getContrastTextColor(TEMPERATURE_COLOR_STOPS.moderate.color, '#091B2A')).toBe('#091B2A');
    expect(getContrastTextColor(TEMPERATURE_COLOR_STOPS.cold.color, '#091B2A')).toBe('#FFFFFF');
  });

  it('only uses fresh or aging temperature measurements', () => {
    expect(getCurrentWaterTemperature(spot(18).observation, now)).toBe(18);
    expect(getCurrentWaterTemperature(spot(18, '2026-09-07T10:00:00Z').observation, now)).toBeUndefined();
  });

  it('shares temperature labels while changing only the marker color source by season', () => {
    const theme = getTheme('light');
    const summer = getMapMarkerAppearance(spot(18), 'summer-status', theme, now);
    const offSeason = getMapMarkerAppearance(spot(18), 'temperature', theme, now);

    expect(summer).toMatchObject({ label: '18°', fillColor: theme.good });
    expect(summer.accessibilityLabel).toContain('Good for swimming');
    expect(offSeason).toMatchObject({ label: '18°', fillColor: TEMPERATURE_COLOR_STOPS.moderate.color });
    expect(offSeason.accessibilityLabel).toContain('Water temperature 18°C');
  });

  it('uses a neutral marker and an explicit fallback label when temperature is unavailable', () => {
    const appearance = getMapMarkerAppearance(spot(), 'temperature', getTheme('light'), now);
    expect(appearance.label).toBe('—');
    expect(appearance.fillColor).toBe(getTheme('light').unknown);
    expect(appearance.accessibilityLabel).toContain('No recent water temperature');
  });
});
