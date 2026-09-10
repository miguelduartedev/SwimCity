import { Theme, statusMeta } from '../../theme';
import { SwimmingObservation, SwimmingSpot } from '../../types/swimming';
import { calculateSwimmingStatus, freshness } from './domain';

export type MapDisplayMode = 'summer-status' | 'temperature';

export const SUMMER_MONTHS = [5, 6, 7] as const;
export const TEMPERATURE_COLOR_STOPS = {
  cold: { temperature: 10, color: '#0B3D91' },
  moderate: { temperature: 18, color: '#F5C542' },
  hot: { temperature: 25, color: '#E54B3C' },
} as const;
export const TEMPERATURE_GRADIENT_COLORS = [
  TEMPERATURE_COLOR_STOPS.cold.color,
  TEMPERATURE_COLOR_STOPS.moderate.color,
  TEMPERATURE_COLOR_STOPS.hot.color,
] as const;
export const TEMPERATURE_GRADIENT_LOCATIONS = [
  0,
  (TEMPERATURE_COLOR_STOPS.moderate.temperature - TEMPERATURE_COLOR_STOPS.cold.temperature) /
    (TEMPERATURE_COLOR_STOPS.hot.temperature - TEMPERATURE_COLOR_STOPS.cold.temperature),
  1,
] as const;

export type MapMarkerAppearance = {
  fillColor: string;
  textColor: string;
  label: string;
  tooltip: string;
  accessibilityLabel: string;
};

export const getMapDisplayMode = (now = new Date()): MapDisplayMode =>
  SUMMER_MONTHS.includes(now.getMonth() as (typeof SUMMER_MONTHS)[number])
    ? 'summer-status'
    : 'temperature';

export const getOffSeasonId = (now = new Date()): string | undefined => {
  if (getMapDisplayMode(now) === 'summer-status') return undefined;

  const year = now.getFullYear();
  return now.getMonth() >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

export const getCurrentWaterTemperature = (
  observation: SwimmingObservation,
  now = new Date(),
): number | undefined => {
  const measurement = observation.waterTemperature;
  if (!measurement) return undefined;
  if (measurement.expiresAt && new Date(measurement.expiresAt).getTime() < now.getTime()) {
    return undefined;
  }

  const state = freshness(measurement.observedAt, now);
  return state === 'fresh' || state === 'aging' ? measurement.value : undefined;
};

export const getTemperatureColor = (temperature: number): string => {
  const { cold, moderate, hot } = TEMPERATURE_COLOR_STOPS;
  if (temperature <= cold.temperature) return cold.color;
  if (temperature >= hot.temperature) return hot.color;

  if (temperature <= moderate.temperature) {
    return interpolateHexColor(
      cold.color,
      moderate.color,
      (temperature - cold.temperature) / (moderate.temperature - cold.temperature),
    );
  }

  return interpolateHexColor(
    moderate.color,
    hot.color,
    (temperature - moderate.temperature) / (hot.temperature - moderate.temperature),
  );
};

export const getMapMarkerAppearance = (
  spot: SwimmingSpot,
  mode: MapDisplayMode,
  theme: Theme,
  now = new Date(),
): MapMarkerAppearance => {
  const temperature = getCurrentWaterTemperature(spot.observation, now);
  const label = temperature === undefined ? '—' : `${Math.round(temperature)}°`;

  if (mode === 'summer-status') {
    const status = calculateSwimmingStatus(spot.observation, now);
    const fillColor = theme[status];
    const temperatureCopy = temperature === undefined
      ? 'No current water temperature'
      : `Water temperature ${Math.round(temperature)}°C`;

    return {
      fillColor,
      textColor: getContrastTextColor(fillColor, theme.navy),
      label,
      tooltip: `${spot.name} — ${statusMeta[status].label}. ${temperatureCopy}.`,
      accessibilityLabel: `${spot.name}: ${statusMeta[status].label}. ${temperatureCopy}.`,
    };
  }

  const fillColor = temperature === undefined ? theme.unknown : getTemperatureColor(temperature);
  const temperatureCopy = temperature === undefined
    ? 'No recent water temperature'
    : `Water temperature ${Math.round(temperature)}°C`;

  return {
    fillColor,
    textColor: getContrastTextColor(fillColor, theme.navy),
    label,
    tooltip: `${spot.name} — ${temperatureCopy}.`,
    accessibilityLabel: `${spot.name}: ${temperatureCopy}.`,
  };
};

export const getContrastTextColor = (backgroundColor: string, darkColor: string): string => {
  const backgroundLuminance = relativeLuminance(backgroundColor);
  const whiteContrast = contrastRatio(backgroundLuminance, 1);
  const darkContrast = contrastRatio(backgroundLuminance, relativeLuminance(darkColor));
  return whiteContrast >= darkContrast ? '#FFFFFF' : darkColor;
};

const interpolateHexColor = (start: string, end: string, amount: number): string => {
  const startChannels = hexChannels(start);
  const endChannels = hexChannels(end);
  const channels = startChannels.map((channel, index) =>
    Math.round(channel + (endChannels[index] - channel) * amount),
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
};

const hexChannels = (color: string): [number, number, number] => [
  Number.parseInt(color.slice(1, 3), 16),
  Number.parseInt(color.slice(3, 5), 16),
  Number.parseInt(color.slice(5, 7), 16),
];

const relativeLuminance = (color: string): number => {
  const [red, green, blue] = hexChannels(color).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrastRatio = (first: number, second: number) =>
  (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
