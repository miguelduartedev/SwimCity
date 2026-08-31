import { StyleSheet, Text, View } from "react-native";
import { SwimmingStatus } from "../types/swimming";
import { statusMeta, Theme } from "../theme";

export function StatusBadge({
  status,
  theme,
  compact = false,
}: {
  status: SwimmingStatus;
  theme: Theme;
  compact?: boolean;
}) {
  const meta = statusMeta[status];
  const color = theme[status];
  return (
    <View
      accessibilityLabel={`Swimming status: ${meta.label}`}
      style={[styles.badge, { backgroundColor: `${color}18` }]}
    >
      <Text style={[styles.dot, { color }]}>{meta.icon}</Text>
      <Text
        style={[styles.label, { color: compact ? theme.textMuted : color }]}
      >
        {compact ? meta.shortLabel : meta.label}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
  },
  dot: { fontSize: 13 },
  label: { fontSize: 12, fontWeight: "700" },
});
