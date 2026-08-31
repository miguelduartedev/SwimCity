import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBadge } from "../../components/StatusBadge";
import { SwimmingMap } from "../../components/SwimmingMap";
import {
  calculateSwimmingStatus,
  formatFreshness,
  latestObservationAt,
} from "../../features/swimming-spots/domain";
import { filterSpots } from "../../features/swimming-spots/selectors";
import { useSwimmingSpots } from "../../hooks/useSwimmingSpots";
import { getTheme, radius, spacing, statusMeta } from "../../theme";
import { Coordinates, SpotFilters, SwimmingSpot } from "../../types/swimming";

export default function ExploreScreen() {
  const theme = getTheme(useColorScheme());
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data = [], isLoading, isError, refetch } = useSwimmingSpots();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SpotFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<SwimmingSpot | undefined>();
  const [userLocation, setUserLocation] = useState<Coordinates>();
  const spots = useMemo(
    () => filterSpots(data, query, filters),
    [data, query, filters],
  );
  const requestLocation = async () => {
    const response = await Location.requestForegroundPermissionsAsync();
    if (response.status === "granted") {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    }
  };
  if (isLoading)
    return <Centered label="Finding Helsinki swimming spots…" theme={theme} />;
  if (isError)
    return (
      <Centered
        label="We couldn’t refresh swimming spots right now."
        theme={theme}
        action="Try again"
        onAction={() => refetch()}
      />
    );
  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SwimmingMap
        spots={spots}
        theme={theme}
        userLocation={userLocation}
        onSelect={setSelected}
      />
      <View
        style={[
          styles.top,
          { paddingTop: Math.max(insets.top + spacing.xs, spacing.lg) },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.brand, { color: theme.text }]}>SwimCity</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Helsinki, Finland
            </Text>
          </View>
          <Pressable
            onPress={() => setShowFilters((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            style={[styles.circleButton, { backgroundColor: theme.surface }]}
          >
            <Text style={{ color: theme.text, fontSize: 20 }}>☷</Text>
          </Pressable>
        </View>
        <View
          style={[
            styles.search,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={{ color: theme.textMuted }}>⌕</Text>
          <TextInput
            accessibilityLabel="Search beaches"
            value={query}
            onChangeText={setQuery}
            placeholder="Search beaches"
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.text }]}
          />
          <Pressable
            onPress={() => router.push("/list")}
            accessibilityLabel="Open list view"
          >
            <Text style={{ color: theme.teal, fontWeight: "800" }}>List</Text>
          </Pressable>
        </View>
        {showFilters && (
          <View style={[styles.filters, { backgroundColor: theme.surface }]}>
            <Text style={[styles.filterTitle, { color: theme.text }]}>
              Quick filters
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <FilterChip
                label="Good"
                active={filters.status === "good"}
                onPress={() =>
                  setFilters((f) => ({
                    ...f,
                    status: f.status === "good" ? undefined : "good",
                  }))
                }
                theme={theme}
              />
              <FilterChip
                label="Lifeguard"
                active={filters.lifeguard}
                onPress={() =>
                  setFilters((f) => ({ ...f, lifeguard: !f.lifeguard }))
                }
                theme={theme}
              />
              <FilterChip
                label="Accessible"
                active={filters.accessible}
                onPress={() =>
                  setFilters((f) => ({ ...f, accessible: !f.accessible }))
                }
                theme={theme}
              />
              <FilterChip
                label="Shower"
                active={filters.amenity === "shower"}
                onPress={() =>
                  setFilters((f) => ({
                    ...f,
                    amenity: f.amenity === "shower" ? undefined : "shower",
                  }))
                }
                theme={theme}
              />
              <FilterChip
                label="Toilet"
                active={filters.amenity === "toilet"}
                onPress={() =>
                  setFilters((f) => ({
                    ...f,
                    amenity: f.amenity === "toilet" ? undefined : "toilet",
                  }))
                }
                theme={theme}
              />
            </ScrollView>
          </View>
        )}
      </View>
      <Pressable
        onPress={requestLocation}
        style={[styles.locationButton, { backgroundColor: theme.surface }]}
        accessibilityRole="button"
        accessibilityLabel="Use my location"
      >
        <Text style={{ color: theme.teal, fontSize: 20 }}>◎</Text>
      </Pressable>
      <View style={[styles.legend, { backgroundColor: theme.mapOverlay }]}>
        {(["good", "caution", "avoid", "unknown"] as const).map((status) => (
          <View key={status} style={styles.legendItem}>
            <Text style={{ color: theme[status] }}>●</Text>
            <Text style={[styles.legendText, { color: theme.text }]}>
              {statusMeta[status].shortLabel}
            </Text>
          </View>
        ))}
      </View>
      {selected ? (
        <SpotPreview
          spot={selected}
          theme={theme}
          onClose={() => setSelected(undefined)}
          onDetails={() =>
            router.push({ pathname: "/spot/[id]", params: { id: selected.id } })
          }
        />
      ) : (
        <View style={[styles.hint, { backgroundColor: theme.surface }]}>
          <Text style={{ color: theme.text, fontWeight: "700" }}>
            {spots.length} Helsinki swimming spots
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>
            Tap a marker to see conditions
          </Text>
        </View>
      )}
    </View>
  );
}
function SpotPreview({
  spot,
  theme,
  onClose,
  onDetails,
}: {
  spot: SwimmingSpot;
  theme: ReturnType<typeof getTheme>;
  onClose: () => void;
  onDetails: () => void;
}) {
  const status = calculateSwimmingStatus(spot.observation);
  const latest = latestObservationAt(spot.observation);
  return (
    <View style={[styles.preview, { backgroundColor: theme.surface }]}>
      <View style={styles.previewRow}>
        <View>
          <Text style={[styles.previewTitle, { color: theme.text }]}>
            {spot.name}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>
            {spot.address}
          </Text>
        </View>
        <Pressable onPress={onClose} accessibilityLabel="Close preview">
          <Text style={[styles.close, { color: theme.textMuted }]}>×</Text>
        </Pressable>
      </View>
      <StatusBadge status={status} theme={theme} />
      <View style={styles.metrics}>
        <Text style={[styles.metric, { color: theme.text }]}>
          {spot.observation.waterTemperature?.value.toFixed(1) ?? "—"}°{" "}
          <Text style={[styles.metricHint, { color: theme.textMuted }]}>
            water
          </Text>
        </Text>
        <Text style={[styles.metricHint, { color: theme.textMuted }]}>
          {formatFreshness(latest)}
        </Text>
      </View>
      <Pressable
        onPress={onDetails}
        accessibilityRole="button"
        style={[styles.detailsButton, { backgroundColor: theme.teal }]}
      >
        <Text style={styles.detailsButtonText}>View details</Text>
      </Pressable>
    </View>
  );
}
function FilterChip({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  theme: ReturnType<typeof getTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? theme.teal : theme.surfaceMuted },
      ]}
    >
      <Text
        style={{
          color: active ? "#fff" : theme.text,
          fontSize: 12,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
function Centered({
  label,
  theme,
  action,
  onAction,
}: {
  label: string;
  theme: ReturnType<typeof getTheme>;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <ActivityIndicator color={theme.teal} />
      <Text style={[styles.centerText, { color: theme.text }]}>{label}</Text>
      {action && (
        <Pressable onPress={onAction}>
          <Text style={{ color: theme.teal, fontWeight: "800" }}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    paddingHorizontal: spacing.md,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { fontSize: 25, fontWeight: "900", letterSpacing: -1 },
  subtitle: { fontSize: 12, fontWeight: "600" },
  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#001",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  search: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filters: {
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 8,
    shadowColor: "#001",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  filterTitle: { fontSize: 13, fontWeight: "800" },
  chip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 99 },
  marker: {
    height: 34,
    width: 34,
    borderWidth: 3,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#001",
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  markerText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  locationButton: {
    position: "absolute",
    right: 16,
    bottom: 218,
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  legend: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 164,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    elevation: 3,
  },
  legendItem: { flexDirection: "row", gap: 4, alignItems: "center" },
  legendText: { fontSize: 10, fontWeight: "700" },
  hint: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 3,
    elevation: 3,
  },
  preview: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    paddingBottom: 22,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: 11,
    elevation: 8,
  },
  previewRow: { flexDirection: "row", justifyContent: "space-between" },
  previewTitle: { fontSize: 21, fontWeight: "900" },
  close: { fontSize: 26, lineHeight: 24 },
  metrics: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  metric: { fontSize: 18, fontWeight: "900" },
  metricHint: { fontSize: 12, fontWeight: "500" },
  detailsButton: {
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: "center",
  },
  detailsButtonText: { color: "#fff", fontWeight: "800" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 14,
  },
  centerText: { fontSize: 16, textAlign: "center" },
});
