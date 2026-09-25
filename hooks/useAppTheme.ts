import { useMemo } from 'react';
import { useThemePreferenceStore } from '../stores/useThemePreferenceStore';
import { getTheme } from '../theme';

export function useAppTheme() {
  const mode = useThemePreferenceStore((state) => state.mode);
  const theme = useMemo(() => getTheme(mode), [mode]);
  return { mode, theme };
}
