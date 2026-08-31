import {
  AlgaeLevel,
  Amenity,
  LifeguardInfo,
  OfficialNotice,
  SwimmingObservation,
  SwimmingSpot,
  TimedValue,
  WaterQuality,
} from '../../types/swimming';

export interface CityCatalogProvider { getSpots(): Promise<SwimmingSpot[]> }
export interface ConditionsProvider { name: string; getObservations(): Promise<Record<string, SwimmingObservation>> }

export const helsinkiCity = {
  id: 'helsinki',
  name: 'Helsinki',
  country: 'Finland',
  initialRegion: { latitude: 60.1847, longitude: 24.942, latitudeDelta: 0.16, longitudeDelta: 0.22 },
  sourceUrl: 'https://api.hel.fi/servicemap/v2/',
};

const BEACH_QUERY = `${helsinkiCity.sourceUrl}unit/?service=731&municipality=helsinki&page_size=100&include=observations`;
const BEACH_TERMS = /\buimaranta\b|\bbadstrand\b|\bbeach\b/i;

type LocalizedText = Record<string, string | undefined>;
export interface ServiceMapObservation {
  property?: string;
  time?: string;
  expiration_time?: string | null;
  value?: unknown;
  name?: LocalizedText;
  quality?: string;
}
export interface ServiceMapConnection {
  section_type?: string;
  name?: LocalizedText;
  tags?: string[];
}
export interface ServiceMapUnit {
  id: number;
  name: LocalizedText;
  street_address?: LocalizedText;
  address_zip?: string;
  description?: LocalizedText;
  location?: { coordinates?: [number, number] };
  connections?: ServiceMapConnection[];
  observations?: ServiceMapObservation[] | null;
}
interface ServiceMapResponse { results?: ServiceMapUnit[] }

const localized = (value?: LocalizedText) => value?.en ?? value?.fi ?? value?.sv ?? '';
const allLocalized = (value?: LocalizedText) => Object.values(value ?? {}).filter((item): item is string => typeof item === 'string').join(' ');
const observationFor = (unit: ServiceMapUnit, property: string) => unit.observations?.find((item) => item.property === property);
const validTimestamp = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(new Date(value).getTime());

const asTimedValue = <T,>(value: T, source: 'service-map', observation?: ServiceMapObservation): TimedValue<T> | undefined => {
  if (!validTimestamp(observation?.time)) return undefined;
  return { value, observedAt: observation.time, ...(validTimestamp(observation.expiration_time) ? { expiresAt: observation.expiration_time } : {}), source };
};

const normalizeTemperature = (observation?: ServiceMapObservation): TimedValue<number> | undefined => {
  const value = typeof observation?.value === 'number' ? observation.value : Number(observation?.value);
  return Number.isFinite(value) ? asTimedValue(value, 'service-map', observation) : undefined;
};

const normalizeAlgae = (observation?: ServiceMapObservation): TimedValue<AlgaeLevel> | undefined => {
  const levels: Record<string, AlgaeLevel> = { '0': 'none', '1': 'small', '2': 'abundant', '3': 'very_abundant' };
  const level = levels[String(observation?.value ?? '')];
  return level ? asTimedValue(level, 'service-map', observation) : undefined;
};

const normalizeQuality = (observation?: ServiceMapObservation): TimedValue<WaterQuality> | undefined => {
  const value = typeof observation?.value === 'string' ? observation.value.toLowerCase() : '';
  const quality = (['excellent', 'good', 'satisfactory', 'poor'] as const).find((item) => item === value);
  return quality ? asTimedValue(quality, 'service-map', observation) : undefined;
};

const inferQualityFromAlgae = (algae?: TimedValue<AlgaeLevel>): TimedValue<WaterQuality> | undefined => {
  if (!algae || (algae.value !== 'none' && algae.value !== 'small')) return undefined;
  return {
    value: 'good',
    observedAt: algae.observedAt,
    ...(algae.expiresAt ? { expiresAt: algae.expiresAt } : {}),
    source: algae.source,
    inferred: true,
  };
};

const noticeSeverity = (notice: string): OfficialNotice['severity'] | undefined => {
  const text = notice.toLowerCase();
  const conditionalRisk = /heavy rain|runs[a-z]*iden sateiden|sateiden jälkeen/.test(text);
  if (/swimming is not recommended|uimista ei suositella|swimming (is )?prohibited|uiminen kielletty/.test(text)) return conditionalRisk ? 'caution' : 'avoid';
  if (/water quality (may have|has) (deteriorated|decreased)|veden laatu on mahdollisesti heikentynyt|enterokokk/.test(text)) return 'caution';
  return undefined;
};

const normalizeNotice = (observation?: ServiceMapObservation): OfficialNotice | undefined => {
  if (!validTimestamp(observation?.time)) return undefined;
  const text = typeof observation?.value === 'string' ? observation.value : localized(observation?.value as LocalizedText | undefined);
  if (!text) return undefined;
  return {
    value: text,
    observedAt: observation.time,
    ...(validTimestamp(observation.expiration_time) ? { expiresAt: observation.expiration_time } : {}),
    source: 'service-map',
    severity: noticeSeverity(text),
  };
};

const amenityMatchers: Array<[Amenity, RegExp]> = [
  ['shower', /\bshowers?\b|suihku/],
  ['toilet', /\btoilet|\bwc\b|vessa/],
  ['cafe', /\bcaf(?:e|é)|kahvila/],
  ['changing_room', /changing (shelters?|rooms?)|dressing rooms?|pukusuoja|pukuhuone/],
  ['kiosk', /kiosk|jäätelökioski/],
  ['outdoor_gym', /outdoor gym|ulkokuntosali/],
];

const normalizeAmenities = (unit: ServiceMapUnit): Amenity[] => {
  const text = [allLocalized(unit.description), ...(unit.connections ?? []).filter((item) => item.section_type === 'OTHER_INFO').map((item) => allLocalized(item.name))].join(' ').toLowerCase();
  return amenityMatchers.filter(([, matcher]) => matcher.test(text)).map(([amenity]) => amenity);
};

const normalizeAccessibility = (unit: ServiceMapUnit) => {
  const details = unit.connections?.map((item) => localized(item.name)).find((item) => /^(accessibility|esteettömyys|tillgänglighet)\s*:/i.test(item));
  return details ? { details } : undefined;
};

const isSwimmingBeachUnit = (unit: ServiceMapUnit) => {
  const identity = [allLocalized(unit.name), allLocalized(unit.description)].join(' ');
  return BEACH_TERMS.test(identity);
};

const parseFinnishSeason = (text: string) => {
  const match = text.match(/(\d{1,2})\.(\d{1,2})\.?\s*[-–]\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return undefined;
  const [, startDay, startMonth, endDay, endMonth, year] = match;
  return { start: new Date(Number(year), Number(startMonth) - 1, Number(startDay)), end: new Date(Number(year), Number(endMonth) - 1, Number(endDay), 23, 59, 59) };
};

const parseEnglishSeason = (text: string) => {
  const match = text.match(/(?:from\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|-|–)\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?[^\d]*(\d{4})/i);
  if (!match) return undefined;
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const [, startMonth, startDay, endMonth, endDay, year] = match;
  return { start: new Date(Number(year), months.indexOf(startMonth.toLowerCase()), Number(startDay)), end: new Date(Number(year), months.indexOf(endMonth.toLowerCase()), Number(endDay), 23, 59, 59) };
};

const formatTime = (hours: string, minutes?: string) => `${hours.padStart(2, '0')}:${(minutes ?? '00').padStart(2, '0')}`;
const parseHours = (text: string) => {
  const finnish = text.match(/klo\s*:?\s*(\d{1,2})(?:[.:](\d{2}))?\s*[-–]\s*(\d{1,2})(?:[.:](\d{2}))?/i);
  if (finnish) return `${formatTime(finnish[1], finnish[2])}–${formatTime(finnish[3], finnish[4])}`;
  const english = text.match(/(?:daily|from)\s+(\d{1,2})(?::(\d{2}))?\s*(?:a\.?m\.?)?\s*(?:to|-|–)\s*(\d{1,2})(?::(\d{2}))?\s*(?:p\.?m\.?)?/i);
  if (english) return `${formatTime(english[1], english[2])}–${formatTime(english[3], english[4])}`;
  return undefined;
};

const normalizeLifeguard = (unit: ServiceMapUnit, now = new Date()): LifeguardInfo | undefined => {
  const connectionListsLifeguard = unit.connections?.some((item) => item.tags?.includes('#valvonta') || /lifeguard|rantapelast|badbevak/i.test(allLocalized(item.name)));
  const notices = unit.observations?.filter((item) => item.property === 'notice').map((item) => allLocalized(item.value as LocalizedText | undefined)).filter(Boolean) ?? [];
  const notice = notices.find((item) => /lifeguard|rantavalvonta|badbevak|valvonta/i.test(item));
  if (!connectionListsLifeguard && !notice) return undefined;
  const season = notice ? parseFinnishSeason(notice) ?? parseEnglishSeason(notice) : undefined;
  const hours = notice ? parseHours(notice) : undefined;
  if (!season) return { available: false, seasonLabel: 'Lifeguard service listed — check City information' };
  const available = now >= season.start && now <= season.end;
  return { available, hours: available ? hours : undefined, seasonLabel: available ? 'In season' : 'Not currently in season' };
};

export const normalizeServiceMapUnit = (unit: ServiceMapUnit, now = new Date()): SwimmingSpot | undefined => {
  const [longitude, latitude] = unit.location?.coordinates ?? [];
  if (!unit.id || typeof latitude !== 'number' || typeof longitude !== 'number' || !isSwimmingBeachUnit(unit)) return undefined;
  const street = localized(unit.street_address);
  const algae = normalizeAlgae(observationFor(unit, 'swimming_water_cyanobacteria'));
  const waterQuality = normalizeQuality(observationFor(unit, 'live_swimming_water_quality')) ?? inferQualityFromAlgae(algae);
  return {
    id: String(unit.id),
    cityId: helsinkiCity.id,
    name: localized(unit.name) || 'Unnamed swimming spot',
    address: [street, unit.address_zip].filter(Boolean).join(', ') || 'Helsinki',
    coordinates: { latitude, longitude },
    description: localized(unit.description),
    amenities: normalizeAmenities(unit),
    accessible: normalizeAccessibility(unit),
    lifeguard: normalizeLifeguard(unit, now),
    observation: {
      waterTemperature: normalizeTemperature(observationFor(unit, 'measured_swimming_water_temperature')),
      waterQuality,
      algae,
      officialNotice: normalizeNotice(observationFor(unit, 'notice')),
    },
  };
};

export const helsinkiCatalogProvider: CityCatalogProvider = {
  async getSpots() {
    const response = await fetch(BEACH_QUERY);
    if (!response.ok) throw new Error('Official Helsinki beach request failed');
    const payload = await response.json() as ServiceMapResponse;
    const spots = (payload.results ?? []).map((unit) => normalizeServiceMapUnit(unit)).filter((spot): spot is SwimmingSpot => Boolean(spot));
    if (!spots.length) throw new Error('Official Helsinki beach catalog returned no spots');
    return spots;
  },
};

export const serviceMapConditionsProvider: ConditionsProvider = {
  name: 'City of Helsinki Service Map observations',
  async getObservations() {
    const spots = await helsinkiCatalogProvider.getSpots();
    return Object.fromEntries(spots.map((spot) => [spot.id, spot.observation]));
  },
};

const fixtureAt = <T,>(value: T, hoursAgo: number): TimedValue<T> => ({ value, observedAt: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(), source: 'fixture' });

// Explicit development/test data only. It is never used as an automatic fallback for live data.
export const fixtureSpots: SwimmingSpot[] = [
  { id: '40142', cityId: 'helsinki', name: 'Hietaranta', address: 'Hiekkarannantie 11, Helsinki', coordinates: { latitude: 60.1724, longitude: 24.9135 }, description: 'Development fixture beach.', amenities: ['shower', 'toilet', 'cafe', 'changing_room'], lifeguard: { available: true, hours: '10:00–18:00' }, observation: { waterTemperature: fixtureAt(18.7, .5), waterQuality: fixtureAt('good', .5), algae: fixtureAt('none', .5) } },
  { id: '40258', cityId: 'helsinki', name: 'Aurinkolahti', address: 'Aurinkolahden puistotie 1, Helsinki', coordinates: { latitude: 60.2071, longitude: 25.1475 }, description: 'Development fixture beach.', amenities: ['shower', 'toilet', 'cafe', 'changing_room', 'kiosk'], lifeguard: { available: true, hours: '10:00–18:00' }, observation: { waterTemperature: fixtureAt(20.1, .2), waterQuality: fixtureAt('excellent', .2), algae: fixtureAt('none', .2) } },
  { id: '40559', cityId: 'helsinki', name: 'Mustikkamaa', address: 'Mustikkamaanpolku 2, Helsinki', coordinates: { latitude: 60.17906, longitude: 24.99305 }, description: 'Development fixture beach.', amenities: ['shower', 'toilet', 'cafe', 'changing_room', 'outdoor_gym'], lifeguard: { available: true, hours: '10:00–18:00' }, observation: { waterTemperature: fixtureAt(19.3, 1.3), waterQuality: fixtureAt('good', 1.3), algae: fixtureAt('none', 1.3) } },
  { id: '41960', cityId: 'helsinki', name: 'Pikkukoski', address: 'Pikkukoskentie, Helsinki', coordinates: { latitude: 60.2535, longitude: 24.9883 }, description: 'Development fixture beach.', amenities: ['shower', 'toilet', 'changing_room'], observation: { waterTemperature: fixtureAt(19.5, 31), waterQuality: fixtureAt('satisfactory', 31), algae: fixtureAt('small', 31) } },
  { id: '40150', cityId: 'helsinki', name: 'Kallahdenniemi', address: 'Kallahdenniemi, Helsinki', coordinates: { latitude: 60.2126, longitude: 25.1561 }, description: 'Development fixture beach.', amenities: ['toilet', 'changing_room'], observation: { waterTemperature: fixtureAt(17.8, .8), waterQuality: fixtureAt('poor', .8), algae: fixtureAt('abundant', .8), officialNotice: { ...fixtureAt('Fixture swimming warning example', .8), severity: 'avoid' } } },
  { id: '40802', cityId: 'helsinki', name: 'Laajasalo', address: 'Reposalmentie, Helsinki', coordinates: { latitude: 60.1759, longitude: 25.0552 }, description: 'Development fixture beach.', amenities: ['shower', 'toilet'], observation: {} },
];

export const fixtureConditionsProvider: ConditionsProvider = {
  name: 'Development fixtures — not live observations',
  async getObservations() { return Object.fromEntries(fixtureSpots.map((spot) => [spot.id, spot.observation])); },
};

const useFixtures = process.env.EXPO_PUBLIC_SWIMCITY_DATA_MODE === 'fixtures';
export const getSwimmingSpots = () => useFixtures ? Promise.resolve(fixtureSpots) : helsinkiCatalogProvider.getSpots();
