import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useThemePreferenceStore } from '../stores/useThemePreferenceStore';
import { radius, Theme } from '../theme';

export function ThemeToggle({ theme }: { theme: Theme }) {
  const mode = useThemePreferenceStore((state) => state.mode);
  const toggleMode = useThemePreferenceStore((state) => state.toggleMode);
  const nextMode = mode === 'dark' ? 'light' : 'dark';

  return (
    <Pressable
      onPress={toggleMode}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${nextMode} mode`}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={nextMode === 'light' ? 'weather-sunny' : 'weather-night'}
        size={20}
        color={theme.teal}
        accessible={false}
      />
      <Text style={[styles.label, { color: theme.text }]}>
        {nextMode === 'light' ? 'Light' : 'Dark'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 78,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  label: { fontSize: 12, fontWeight: '700' },
});
