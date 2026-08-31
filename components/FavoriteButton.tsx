import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Animated, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useRef } from 'react';
import { useFavoritesStore } from '../stores/useFavoritesStore';
import { Theme } from '../theme';

type FavoriteButtonProps = {
  spotId: string;
  spotName: string;
  theme: Theme;
  variant?: 'circle' | 'primary';
  style?: StyleProp<ViewStyle>;
};

/** A shared, persisted favorite toggle so every representation of a spot stays in sync. */
export function FavoriteButton({ spotId, spotName, theme, variant = 'circle', style }: FavoriteButtonProps) {
  const saved = useFavoritesStore((state) => state.favoriteIds.includes(spotId));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 170, useNativeDriver: true }),
    ]).start();
    toggleFavorite(spotId);
  };

  const label = saved ? `Remove ${spotName} from saved beaches` : `Save ${spotName}`;
  const iconName = saved ? 'heart' : 'heart-outline';
  const isPrimary = variant === 'primary';

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: saved }}
        onPress={handlePress}
        style={({ pressed }) => [
          isPrimary ? styles.primary : styles.circle,
          { backgroundColor: isPrimary ? theme.teal : theme.surface, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <MaterialCommunityIcons name={iconName} size={isPrimary ? 20 : 24} color={isPrimary ? '#fff' : theme.avoid} />
        {isPrimary && <Animated.Text style={styles.primaryLabel}>{saved ? 'Saved' : 'Save'}</Animated.Text>}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00131a',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primary: {
    minHeight: 52,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 14,
  },
  primaryLabel: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
