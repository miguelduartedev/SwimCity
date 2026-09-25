jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, renderHook, waitFor } from '@testing-library/react-native';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAppTheme } from '../hooks/useAppTheme';
import { useThemePreferenceStore } from '../stores/useThemePreferenceStore';
import { getTheme } from '../theme';

describe('theme preference', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await act(async () => {
      await useThemePreferenceStore.persist.rehydrate();
    });
    useThemePreferenceStore.setState({ mode: 'dark' });
  });

  it('starts dark, then immediately switches the shared palette and toggle label', async () => {
    const screen = render(<ThemeToggle theme={getTheme('dark')} />);
    const { result } = renderHook(useAppTheme);

    expect(result.current.mode).toBe('dark');
    expect(result.current.theme.background).toBe(getTheme('dark').background);
    expect(screen.getByLabelText('Switch to light mode')).toBeTruthy();
    expect(screen.getByText('weather-sunny')).toBeTruthy();

    act(() => {
      screen.getByLabelText('Switch to light mode').props.onClick();
    });

    expect(useThemePreferenceStore.getState().mode).toBe('light');
    expect(result.current.mode).toBe('light');
    expect(result.current.theme.background).toBe(getTheme('light').background);
    expect(screen.getByLabelText('Switch to dark mode')).toBeTruthy();
    expect(screen.getByText('weather-night')).toBeTruthy();
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'swimcity-theme',
        expect.stringContaining('"mode":"light"'),
      ),
    );

    act(() => {
      screen.getByLabelText('Switch to dark mode').props.onClick();
    });
    expect(result.current.mode).toBe('dark');
    expect(screen.getByLabelText('Switch to light mode')).toBeTruthy();
  });

  it('restores a saved light choice on relaunch', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ state: { mode: 'light' }, version: 0 }),
    );

    await act(async () => {
      await useThemePreferenceStore.persist.rehydrate();
    });

    expect(useThemePreferenceStore.getState().mode).toBe('light');
  });
});
