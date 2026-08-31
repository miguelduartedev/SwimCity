import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  calculateSwimmingStatus,
  formatFreshness,
  algaeLabel,
  latestObservationAt,
} from "../features/swimming-spots/domain";
import { distanceKm } from "../features/swimming-spots/selectors";
import { StatusBadge } from "./StatusBadge";
import { Coordinates, SwimmingSpot } from "../types/swimming";
import { Theme, radius, spacing } from "../theme";

export function SpotCard({
  spot,
  theme,
  userLocation,
  onPress,
}: {
  spot: SwimmingSpot;
  theme: Theme;
  userLocation?: Coordinates;
  onPress: () => void;
}) {
  const status = calculateSwimmingStatus(spot.observation);
  const distance = userLocation
    ? distanceKm(userLocation, spot.coordinates)
    : undefined;
  const latest = latestObservationAt(spot.observation);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${spot.name}, ${status}`}
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={[styles.photo, { backgroundColor: theme.surfaceMuted }]}>
        <Text style={styles.photoIcon}>⌇</Text>
        <Text style={[styles.photoText, { color: theme.teal }]}>SWIM</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
            {spot.name}
          </Text>
          {spot.observation.waterTemperature && (
            <Text style={[styles.temp, { color: theme.text }]}>
              {spot.observation.waterTemperature.value.toFixed(1)}°
            </Text>
          )}
        </View>
        <StatusBadge status={status} theme={theme} compact />
        <Text
          numberOfLines={1}
          style={[styles.detail, { color: theme.textMuted }]}
        >
          Algae: {algaeLabel(spot.observation.algae?.value)}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.update, { color: theme.textMuted }]}>
            {formatFreshness(latest)}
          </Text>
          {distance !== undefined && (
            <Text style={[styles.update, { color: theme.textMuted }]}>
              {distance.toFixed(1)} km
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  photo: {
    width: 66,
    height: 76,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  photoIcon: {
    color: "#55C3DB",
    fontSize: 28,
    lineHeight: 21,
    fontWeight: "900",
    transform: [{ rotate: "90deg" }],
  },
  photoText: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  content: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 16, fontWeight: "800", flex: 1 },
  temp: { fontSize: 15, fontWeight: "800" },
  detail: { fontSize: 12, marginTop: 4 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  update: { fontSize: 11 },
});
