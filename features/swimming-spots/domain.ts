import { AlgaeLevel, SwimmingObservation, SwimmingStatus, WaterQuality } from '../../types/swimming';

export const FRESH_HOURS = 24;
export const STALE_HOURS = 72;
export const hoursSince = (at?: string, now = new Date()): number | undefined => at ? Math.max(0, (now.getTime() - new Date(at).getTime()) / 3_600_000) : undefined;
export const freshness = (at?: string, now = new Date()): 'fresh' | 'aging' | 'stale' | 'missing' => {
  const hours = hoursSince(at, now);
  if (hours === undefined) return 'missing';
  if (hours <= FRESH_HOURS) return 'fresh';
  if (hours <= STALE_HOURS) return 'aging';
  return 'stale';
};
const isExpired = (at: string | undefined, now: Date) => at !== undefined && new Date(at).getTime() < now.getTime();
const isCurrent = (observedAt: string | undefined, expiresAt: string | undefined, now: Date) => !isExpired(expiresAt, now) && freshness(observedAt, now) !== 'stale' && freshness(observedAt, now) !== 'missing';

export const calculateSwimmingStatus = (observation: SwimmingObservation, now = new Date()): SwimmingStatus => {
  const algae = observation.algae?.value ?? 'unknown';
  const algaeIsCurrent = isCurrent(observation.algae?.observedAt, observation.algae?.expiresAt, now);
  const inferredGoodQuality = !observation.waterQuality && algaeIsCurrent && (algae === 'none' || algae === 'small');
  const quality = observation.waterQuality?.value ?? (inferredGoodQuality ? 'good' : 'unknown');
  const qualityIsCurrent = isCurrent(observation.waterQuality?.observedAt, observation.waterQuality?.expiresAt, now);
  const noticeIsCurrent = isCurrent(observation.officialNotice?.observedAt, observation.officialNotice?.expiresAt, now);

  if (noticeIsCurrent && observation.officialNotice?.severity === 'avoid') return 'avoid';
  if (algaeIsCurrent && isSignificantAlgae(algae)) return 'avoid';
  if (qualityIsCurrent && quality === 'poor') return 'avoid';
  if (noticeIsCurrent && observation.officialNotice?.severity === 'caution') return 'caution';
  if (algaeIsCurrent && algae === 'small') return 'caution';
  if (qualityIsCurrent && quality === 'satisfactory') return 'caution';
  if ((qualityIsCurrent || inferredGoodQuality) && algaeIsCurrent && (quality === 'good' || quality === 'excellent') && algae === 'none') return 'good';
  return 'unknown';
};
export const isSignificantAlgae = (value: AlgaeLevel) => value === 'abundant' || value === 'very_abundant';
export const formatFreshness = (at?: string, now = new Date()): string => {
  const hours = hoursSince(at, now);
  if (hours === undefined || hours > STALE_HOURS) return 'No recent observations';
  if (hours < 1) return 'Updated just now';
  if (hours < 24) return `Updated ${Math.round(hours)}h ago`;
  return `Updated ${Math.round(hours / 24)}d ago`;
};
export const latestObservationAt = (observation: SwimmingObservation): string | undefined => {
  const timestamps = [observation.waterTemperature?.observedAt, observation.waterQuality?.observedAt, observation.algae?.observedAt, observation.officialNotice?.observedAt]
    .filter((value): value is string => Boolean(value));
  return timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
};
export const qualityLabel = (value: WaterQuality = 'unknown') => ({ excellent: 'Excellent', good: 'Good', satisfactory: 'Satisfactory', poor: 'Poor', unknown: 'Not reported' })[value];
export const algaeLabel = (value: AlgaeLevel = 'unknown') => ({ none: 'None observed', small: 'Small amount', abundant: 'Abundant', very_abundant: 'Very abundant', unknown: 'Not reported' })[value];
