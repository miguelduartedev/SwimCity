import { calculateSwimmingStatus, freshness, latestObservationAt } from '../features/swimming-spots/domain';
import { filterSpots, sortSpots } from '../features/swimming-spots/selectors';
import { normalizeServiceMapUnit } from '../services/api/helsinki';
import { SwimmingObservation, SwimmingSpot, TimedValue } from '../types/swimming';

const now = new Date('2026-08-30T12:00:00Z');
const timed = <T,>(value: T, observedAt = '2026-08-30T11:00:00Z'): TimedValue<T> => ({ value, observedAt, source: 'fixture' });
const observation = (overrides: Partial<SwimmingObservation> = {}): SwimmingObservation => ({ waterQuality: timed('good'), algae: timed('none'), ...overrides });
const spot = (id: string, name: string, current = observation()): SwimmingSpot => ({ id, cityId: 'helsinki', name, address: 'Helsinki', coordinates: { latitude: 60.17, longitude: 24.94 }, description: '', amenities: ['shower'], observation: current });

describe('swimming condition policy', () => {
  it('only permits green when favorable quality and algae signals are fresh', () => expect(calculateSwimmingStatus(observation(), now)).toBe('good'));
  it('prioritizes a current official avoidance notice and significant algae', () => {
    expect(calculateSwimmingStatus(observation({ officialNotice: { ...timed('Swimming is not recommended'), severity: 'avoid' } }), now)).toBe('avoid');
    expect(calculateSwimmingStatus(observation({ algae: timed('abundant') }), now)).toBe('avoid');
  });
  it('keeps favorable observations green for up to 72 hours and marks older data unknown', () => {
    const aging = '2026-08-29T11:00:00Z';
    expect(calculateSwimmingStatus(observation({ waterQuality: timed('good', aging), algae: timed('none', aging) }), now)).toBe('good');
    expect(calculateSwimmingStatus(observation({ waterQuality: timed('good', '2026-08-26T11:00:00Z'), algae: timed('none', '2026-08-26T11:00:00Z') }), now)).toBe('unknown');
  });
  it('uses fresh no-algae observations to infer good quality when it is unreported', () => {
    expect(freshness(undefined, now)).toBe('missing');
    expect(calculateSwimmingStatus({ algae: timed('none') }, now)).toBe('good');
    expect(calculateSwimmingStatus({ algae: timed('small') }, now)).toBe('caution');
    expect(calculateSwimmingStatus({}, now)).toBe('unknown');
    expect(calculateSwimmingStatus(observation({ algae: { ...timed('abundant'), expiresAt: '2026-08-29T11:00:00Z' } }), now)).toBe('unknown');
  });
  it('keeps per-signal timestamps while providing a latest-signal display helper', () => {
    expect(latestObservationAt({ waterTemperature: timed(17, '2026-08-30T11:30:00Z'), algae: timed('none', '2026-08-30T10:00:00Z') })).toBe('2026-08-30T11:30:00Z');
  });
});

describe('spot selectors', () => {
  const spots = [spot('a', 'Aurinkolahti', observation({ waterTemperature: timed(18) })), spot('b', 'Hietaranta', observation({ waterTemperature: timed(21) }))];
  it('filters by search and amenity', () => expect(filterSpots(spots, 'hieta', { amenity: 'shower' }, now)).toHaveLength(1));
  it('sorts warmest first', () => expect(sortSpots(spots, 'warmest', undefined, now)[0].id).toBe('b'));
});

describe('Helsinki Service Map normalization', () => {
  it('normalizes public observations, amenities, and a cautious official notice', () => {
    const result = normalizeServiceMapUnit({
      id: 40559,
      name: { en: 'Mustikkamaa beach' },
      street_address: { en: 'Mustikkamaanpolku 2' },
      address_zip: '00570',
      location: { coordinates: [24.99305, 60.17906] },
      connections: [{ section_type: 'OTHER_INFO', name: { en: 'Lifeguard on duty. Services: dressing rooms, shower, toilet facilities and café.' }, tags: ['#valvonta'] }],
      observations: [
        { property: 'measured_swimming_water_temperature', time: '2026-08-30T11:00:00Z', value: 16.5 },
        { property: 'swimming_water_cyanobacteria', time: '2026-08-30T10:00:00Z', expiration_time: '2026-09-04T10:00:00Z', value: '1' },
        { property: 'notice', time: '2026-08-30T11:00:00Z', value: { fi: 'Rantavalvonta 1.6.-9.8.2026 klo: 10:00-18:00.', en: 'Water quality may have deteriorated.' } },
      ],
    }, now);
    expect(result).toMatchObject({
      id: '40559',
      name: 'Mustikkamaa beach',
      coordinates: { latitude: 60.17906, longitude: 24.99305 },
      amenities: ['shower', 'toilet', 'cafe', 'changing_room'],
      lifeguard: { available: false, seasonLabel: 'Not currently in season' },
      observation: { waterTemperature: { value: 16.5, source: 'service-map' }, waterQuality: { value: 'good', inferred: true }, algae: { value: 'small' }, officialNotice: { severity: 'caution' } },
    });
  });
  it('keeps unknown source values unavailable and rejects records without point coordinates', () => {
    expect(normalizeServiceMapUnit({ id: 1, name: { en: 'Broken' } })).toBeUndefined();
    expect(normalizeServiceMapUnit({ id: 2, name: { en: 'Unknown' }, location: { coordinates: [24.9, 60.1] }, observations: [{ property: 'swimming_water_cyanobacteria', time: '2026-08-30T10:00:00Z', value: 'unexpected' }] })?.observation.algae).toBeUndefined();
  });
  it('excludes non-swimming entries accidentally returned by the beach service', () => {
    const cafe = normalizeServiceMapUnit({
      id: 62953,
      name: { en: 'Cafe Kobben' },
      description: { en: 'A café restaurant on a small public island.' },
      location: { coordinates: [24.98, 60.16] },
    });
    const beach = normalizeServiceMapUnit({
      id: 41470,
      name: { en: 'Mustasaari / Beach' },
      location: { coordinates: [24.87, 60.14] },
    });

    expect(cafe).toBeUndefined();
    expect(beach).toMatchObject({ id: '41470', name: 'Mustasaari / Beach' });
  });
});
