import { render } from '@testing-library/react-native';
import { SpotCard } from '../components/SpotCard';
import { getTheme } from '../theme';
import { SwimmingSpot } from '../types/swimming';

const spot: SwimmingSpot = {
  id: 'hietaranta', cityId: 'helsinki', name: 'Hietaranta', address: 'Helsinki', description: '', coordinates: { latitude: 60.17, longitude: 24.93 }, amenities: [],
  observation: {
    algae: { value: 'none', observedAt: '2026-08-30T10:00:00Z', source: 'fixture' },
    waterQuality: { value: 'good', observedAt: '2026-08-30T10:00:00Z', source: 'fixture' },
  },
};

describe('SpotCard', () => {
  it('labels algae observations with their context', () => {
    const screen = render(<SpotCard spot={spot} theme={getTheme('light')} onPress={jest.fn()} />);
    expect(screen.getByText('Algae: None observed')).toBeTruthy();
  });
});
