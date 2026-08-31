jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ name }: { name: string }) => React.createElement(Text, null, name);
});

import { fireEvent, render } from '@testing-library/react-native';
import { FavoriteButton } from '../components/FavoriteButton';
import { useFavoritesStore } from '../stores/useFavoritesStore';
import { getTheme } from '../theme';

describe('FavoriteButton', () => {
  beforeEach(() => useFavoritesStore.setState({ favoriteIds: [] }));

  it('immediately changes its accessible saved state and toggles back', () => {
    const screen = render(<FavoriteButton spotId="hietaranta" spotName="Hietaranta" theme={getTheme('light')} />);
    fireEvent.press(screen.getByLabelText('Save Hietaranta'));
    expect(screen.getByLabelText('Remove Hietaranta from saved beaches')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Remove Hietaranta from saved beaches'));
    expect(screen.getByLabelText('Save Hietaranta')).toBeTruthy();
  });
});
