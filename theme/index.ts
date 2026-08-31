import { ColorSchemeName } from 'react-native';

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 44 } as const;
export const radius = { sm: 12, md: 18, lg: 26, pill: 999 } as const;

const common = {
  teal: '#007A7A', navy: '#091B2A', blue: '#1677E8',
  good: '#16B864', caution: '#EEA800', avoid: '#E54B3C', unknown: '#8B9AA5',
};
export type Theme = typeof common & { background: string; surface: string; surfaceMuted: string; text: string; textMuted: string; border: string; mapOverlay: string };
export const getTheme = (scheme: ColorSchemeName): Theme => ({
  ...common,
  background: scheme === 'dark' ? '#07141D' : '#F5F8F8',
  surface: scheme === 'dark' ? '#10222D' : '#FFFFFF',
  surfaceMuted: scheme === 'dark' ? '#19313D' : '#EDF3F2',
  text: scheme === 'dark' ? '#F7FBFC' : common.navy,
  textMuted: scheme === 'dark' ? '#B2C1C7' : '#667985',
  border: scheme === 'dark' ? '#28404B' : '#DCE5E5',
  mapOverlay: scheme === 'dark' ? '#0B1821' : '#FFFFFF',
});

export const statusMeta = {
  good: { label: 'Good for swimming', shortLabel: 'Good', icon: '●' },
  caution: { label: 'Some caution advised', shortLabel: 'Caution', icon: '●' },
  avoid: { label: 'Swimming not recommended', shortLabel: 'Avoid', icon: '●' },
  unknown: { label: 'No recent observations', shortLabel: 'Unknown', icon: '●' },
} as const;
