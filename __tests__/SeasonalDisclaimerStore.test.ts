jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  };
  return { __esModule: true, default: storage };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitFor } from '@testing-library/react-native';
import { useSeasonalDisclaimerStore } from '../stores/useSeasonalDisclaimerStore';

describe('seasonal disclaimer persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSeasonalDisclaimerStore.setState({
      dismissedOffSeasonDisclaimerFor: undefined,
      hasHydrated: true,
    });
  });

  it('persists the dismissed off-season ID', async () => {
    useSeasonalDisclaimerStore.getState().dismissFor('2026-2027');

    expect(
      useSeasonalDisclaimerStore.getState().dismissedOffSeasonDisclaimerFor,
    ).toBe('2026-2027');
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'swimcity-seasonal-disclaimer',
        expect.stringContaining('2026-2027'),
      ),
    );
  });
});
