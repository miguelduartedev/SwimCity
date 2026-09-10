import * as Location from "expo-location"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useMemo, useState } from "react"
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { StatusBadge } from "../../components/StatusBadge"
import { SwimmingMap } from "../../components/SwimmingMap"
import {
  calculateSwimmingStatus,
  formatFreshness,
  latestObservationAt,
} from "../../features/swimming-spots/domain"
import {
  getMapDisplayMode,
  getOffSeasonId,
  MapDisplayMode,
  TEMPERATURE_GRADIENT_COLORS,
  TEMPERATURE_GRADIENT_LOCATIONS,
} from "../../features/swimming-spots/mapPresentation"
import { filterSpots } from "../../features/swimming-spots/selectors"
import { useSwimmingSpots } from "../../hooks/useSwimmingSpots"
import { useSeasonalDisclaimerStore } from "../../stores/useSeasonalDisclaimerStore"
import { getTheme, radius, spacing, statusMeta } from "../../theme"
import { Coordinates, SwimmingSpot } from "../../types/swimming"

export default function ExploreScreen() {
  const theme = getTheme(useColorScheme())
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { data = [], isLoading, isError, refetch } = useSwimmingSpots()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<SwimmingSpot | undefined>()
  const [userLocation, setUserLocation] = useState<Coordinates>()
  const [bottomContentInset, setBottomContentInset] = useState(0)
  const displayMode = getMapDisplayMode()
  const offSeasonId = getOffSeasonId()
  const dismissedOffSeasonDisclaimerFor = useSeasonalDisclaimerStore(
    (state) => state.dismissedOffSeasonDisclaimerFor,
  )
  const hasDismissalHydrated = useSeasonalDisclaimerStore(
    (state) => state.hasHydrated,
  )
  const dismissSeasonalDisclaimer = useSeasonalDisclaimerStore(
    (state) => state.dismissFor,
  )
  const shouldShowSeasonalDisclaimer =
    displayMode === "temperature" &&
    hasDismissalHydrated &&
    Boolean(offSeasonId) &&
    dismissedOffSeasonDisclaimerFor !== offSeasonId
  const spots = useMemo(
    () => filterSpots(data, query, {}),
    [data, query],
  )
  const requestLocation = async () => {
    const response = await Location.requestForegroundPermissionsAsync()
    if (response.status === "granted") {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      })
    }
  }
  const updateBottomContentInset = (event: LayoutChangeEvent) => {
    const nextInset = Math.ceil(event.nativeEvent.layout.height)
    setBottomContentInset((currentInset) =>
      currentInset === nextInset ? currentInset : nextInset,
    )
  }
  if (isLoading)
    return <Centered label="Finding Helsinki swimming spots…" theme={theme} />
  if (isError)
    return (
      <Centered
        label="We couldn’t refresh swimming spots right now."
        theme={theme}
        action="Try again"
        onAction={() => refetch()}
      />
    )
  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SwimmingMap
        spots={spots}
        theme={theme}
        displayMode={displayMode}
        selectedSpotId={selected?.id}
        userLocation={userLocation}
        bottomContentInset={bottomContentInset}
        onSelect={setSelected}
      />
      <View
        style={[
          styles.top,
          { paddingTop: Math.max(insets.top + spacing.xs, spacing.lg) },
        ]}
      >
        <View>
          <Text style={[styles.brand, { color: theme.text }]}>SwimCity</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Helsinki, Finland
          </Text>
        </View>
        <View
          style={[
            styles.search,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={21}
            color={theme.textMuted}
            accessible={false}
          />
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
      </View>
      <View
        testID="explore-bottom-overlay"
        style={styles.bottomOverlay}
        onLayout={updateBottomContentInset}
      >
        <View style={styles.mapControlsRow}>
          <MapLegend displayMode={displayMode} theme={theme} />
          <Pressable
            onPress={requestLocation}
            style={[styles.locationButton, { backgroundColor: theme.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Use my location"
            testID="use-location-button"
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={22}
              color={theme.teal}
              accessible={false}
            />
          </Pressable>
        </View>
        {selected ? (
          <SpotPreview
            spot={selected}
            theme={theme}
            onClose={() => setSelected(undefined)}
            onDetails={() =>
              router.push({
                pathname: "/spot/[id]",
                params: { id: selected.id },
              })
            }
          />
        ) : shouldShowSeasonalDisclaimer ? (
          <View
            testID="seasonal-data-disclaimer"
            style={[
              styles.seasonalDisclaimer,
              { backgroundColor: theme.surfaceMuted },
            ]}
          >
            <View style={styles.seasonalDisclaimerRow}>
              <Text
                style={[styles.seasonalDisclaimerText, { color: theme.textMuted }]}
              >
                Beach observations are seasonal. Outside the swimming season,
                some data may be unavailable or outdated.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss seasonal data notice"
                onPress={() => {
                  if (offSeasonId) dismissSeasonalDisclaimer(offSeasonId)
                }}
                style={styles.dismissDisclaimerButton}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={theme.textMuted}
                  accessible={false}
                />
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  )
}
function MapLegend({
  displayMode,
  theme,
}: {
  displayMode: MapDisplayMode
  theme: ReturnType<typeof getTheme>
}) {
  if (displayMode === "summer-status") {
    return (
      <View
        testID="swimming-status-legend"
        style={[
          styles.legend,
          styles.statusLegend,
          { backgroundColor: theme.mapOverlay },
        ]}
      >
        {(["good", "caution", "avoid", "unknown"] as const).map((status) => (
          <View key={status} style={styles.legendItem}>
            <Text style={{ color: theme[status] }}>●</Text>
            <Text style={[styles.legendText, { color: theme.text }]}>
              {statusMeta[status].shortLabel}
            </Text>
          </View>
        ))}
      </View>
    )
  }

  return (
    <View
      testID="temperature-legend"
      style={[
        styles.legend,
        styles.temperatureLegend,
        { backgroundColor: theme.mapOverlay },
      ]}
    >
      <Text style={[styles.temperatureLegendTitle, { color: theme.text }]}>
        Water temperature
      </Text>
      <LinearGradient
        testID="temperature-gradient"
        colors={TEMPERATURE_GRADIENT_COLORS}
        locations={TEMPERATURE_GRADIENT_LOCATIONS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.temperatureGradient}
      />
      <View style={styles.temperatureLegendLabels}>
        <Text style={[styles.legendText, { color: theme.textMuted }]}>
          ≤10°C — Very cold
        </Text>
        <Text style={[styles.legendText, { color: theme.textMuted }]}>18°C</Text>
        <Text style={[styles.legendText, { color: theme.textMuted }]}>
          ≥25°C — Warm
        </Text>
      </View>
    </View>
  )
}
function SpotPreview({
  spot,
  theme,
  onClose,
  onDetails,
}: {
  spot: SwimmingSpot
  theme: ReturnType<typeof getTheme>
  onClose: () => void
  onDetails: () => void
}) {
  const status = calculateSwimmingStatus(spot.observation)
  const latest = latestObservationAt(spot.observation)
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
  )
}
function Centered({
  label,
  theme,
  action,
  onAction,
}: {
  label: string
  theme: ReturnType<typeof getTheme>
  action?: string
  onAction?: () => void
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
  )
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
    gap: spacing.sm,
  },
  brand: { fontSize: 25, fontWeight: "900", letterSpacing: -1 },
  subtitle: { fontSize: 12, fontWeight: "600" },
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
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  legend: {
    flex: 1,
    borderRadius: 14,
    elevation: 3,
  },
  statusLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  legendItem: { flexDirection: "row", gap: 4, alignItems: "center" },
  legendText: { fontSize: 10, fontWeight: "700" },
  temperatureLegend: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  temperatureLegendTitle: { fontSize: 10, fontWeight: "800" },
  temperatureGradient: { height: 8, borderRadius: radius.pill },
  temperatureLegendLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bottomOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 10,
  },
  mapControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  seasonalDisclaimer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.sm,
    elevation: 3,
  },
  seasonalDisclaimerRow: { flexDirection: "row", alignItems: "flex-start" },
  seasonalDisclaimerText: { flex: 1, fontSize: 12, lineHeight: 17 },
  dismissDisclaimerButton: {
    width: 44,
    height: 44,
    marginTop: -spacing.sm,
    marginRight: -spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
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
})
