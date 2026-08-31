import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ComponentProps } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FavoriteButton } from "../../components/FavoriteButton";
import { StatusBadge } from "../../components/StatusBadge";
import {
  algaeLabel,
  calculateSwimmingStatus,
  formatFreshness,
  latestObservationAt,
  qualityLabel,
} from "../../features/swimming-spots/domain";
import { useSwimmingSpots } from "../../hooks/useSwimmingSpots";
import { getTheme, radius, spacing, Theme } from "../../theme";
import { goBackOrExplore } from "../../utils/navigation";

const amenityLabels = {
  shower: "Shower",
  toilet: "Toilet",
  cafe: "Café",
  changing_room: "Changing room",
  kiosk: "Kiosk",
  outdoor_gym: "Outdoor gym",
};
type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export default function DetailScreen() {
  const theme = getTheme(useColorScheme());
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data = [] } = useSwimmingSpots();
  const spot = data.find((item) => item.id === id);
  const heroHeight = 190 + insets.top;

  const goBack = () => goBackOrExplore(router);

  if (!spot)
    return (
      <View
        style={[
          styles.notFound,
          { backgroundColor: theme.background, paddingTop: insets.top },
        ]}
      >
        <Text style={{ color: theme.text }}>Swimming spot not found.</Text>
        <Pressable onPress={goBack}>
          <Text style={{ color: theme.teal, fontWeight: "800" }}>Go back</Text>
        </Pressable>
      </View>
    );

  const status = calculateSwimmingStatus(spot.observation);
  const directions = () =>
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${spot.coordinates.latitude},${spot.coordinates.longitude}`,
    );
  const algaeLevel = spot.observation.algae?.value;
  const algaeColor =
    algaeLevel === "abundant" || algaeLevel === "very_abundant"
      ? theme.avoid
      : algaeLevel === "small"
        ? theme.caution
        : theme.teal;
  const latest = latestObservationAt(spot.observation);
  const fixtureMode = Object.values(spot.observation).some(
    (signal) =>
      typeof signal === "object" &&
      signal !== null &&
      "source" in signal &&
      signal.source === "fixture",
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.hero,
          { backgroundColor: theme.teal, height: heroHeight },
        ]}
      >
        <View style={styles.heroWave}>
          <Text style={styles.wave}>≈</Text>
        </View>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.back, { top: insets.top + spacing.sm }]}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={theme.navy}
          />
        </Pressable>
      </View>
      <FavoriteButton
        spotId={spot.id}
        spotName={spot.name}
        theme={theme}
        style={[styles.floatingFavorite, { top: heroHeight - 26 }]}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 110 + insets.bottom },
        ]}
      >
        <Text style={[styles.name, { color: theme.text }]}>{spot.name}</Text>
        <Text style={[styles.address, { color: theme.textMuted }]}>
          {spot.address}
        </Text>
        <View
          style={[styles.summary, { backgroundColor: `${theme[status]}18` }]}
        >
          <StatusBadge status={status} theme={theme} />
          <Text style={[styles.summaryText, { color: theme.textMuted }]}>
            SwimCity’s summary of available information — not an official safety
            classification.
          </Text>
        </View>
        <View style={[styles.grid, { borderColor: theme.border }]}>
          <Fact
            icon="waves"
            iconColor={theme.blue}
            label={`Water temperature · ${formatFreshness(spot.observation.waterTemperature?.observedAt)}`}
            value={
              spot.observation.waterTemperature
                ? `${spot.observation.waterTemperature.value.toFixed(1)}°C`
                : "Not reported"
            }
            theme={theme}
          />
          <Fact
            icon="shield-check"
            iconColor={theme.good}
            label={
              spot.observation.waterQuality?.inferred
                ? `Water-quality estimate based on algae · ${formatFreshness(spot.observation.waterQuality.observedAt)}`
                : `Water quality · ${formatFreshness(spot.observation.waterQuality?.observedAt)}`
            }
            value={
              spot.observation.waterQuality?.inferred
                ? "Good (based on algae)"
                : qualityLabel(spot.observation.waterQuality?.value)
            }
            theme={theme}
          />
          <Fact
            icon="water-alert"
            iconColor={algaeColor}
            label={`Blue-green algae · ${formatFreshness(spot.observation.algae?.observedAt)}`}
            value={algaeLabel(algaeLevel)}
            theme={theme}
          />
          <Fact
            icon="clock-outline"
            iconColor={theme.teal}
            label="Latest available signal"
            value={formatFreshness(latest)}
            theme={theme}
          />
        </View>
        {spot.observation.officialNotice?.severity && (
          <View
            style={[
              styles.advisory,
              {
                backgroundColor: `${spot.observation.officialNotice.severity === "avoid" ? theme.avoid : theme.caution}16`,
              },
            ]}
          >
            <Text
              style={{
                color:
                  spot.observation.officialNotice.severity === "avoid"
                    ? theme.avoid
                    : theme.caution,
                fontWeight: "800",
              }}
            >
              Official City advisory
            </Text>
            <Text style={{ color: theme.textMuted }}>
              {spot.observation.officialNotice.value}
            </Text>
          </View>
        )}
        <Section title="Lifeguard" theme={theme}>
          <Text style={[styles.sectionValue, { color: theme.text }]}>
            {spot.lifeguard?.available
              ? (spot.lifeguard.hours ?? "Available during beach season")
              : (spot.lifeguard?.seasonLabel ?? "Not currently in season")}
          </Text>
        </Section>
        <Section title="Amenities" theme={theme}>
          {spot.amenities.length ? (
            <View style={styles.amenities}>
              {spot.amenities.map((amenity) => (
                <View
                  key={amenity}
                  style={[
                    styles.amenity,
                    { backgroundColor: theme.surfaceMuted },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color={theme.teal}
                  />
                  <Text style={[styles.amenityText, { color: theme.text }]}>
                    {amenityLabels[amenity]}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.sectionDetail, { color: theme.textMuted }]}>
              Amenities not reported by the City Service Map.
            </Text>
          )}
        </Section>
        <Section title="Accessibility" theme={theme}>
          {spot.accessible?.details ? (
            <Text style={[styles.sectionDetail, { color: theme.textMuted }]}>
              {spot.accessible.details}
            </Text>
          ) : (
            <Text style={[styles.sectionDetail, { color: theme.textMuted }]}>
              No verified accessibility information from the City Service Map.
            </Text>
          )}
        </Section>
        <View
          style={[styles.sourceNote, { backgroundColor: theme.surfaceMuted }]}
        >
          <Text style={[styles.sourceTitle, { color: theme.text }]}>
            Data source
          </Text>
          <Text
            style={{ color: theme.textMuted, fontSize: 12, lineHeight: 17 }}
          >
            {fixtureMode
              ? "Development fixture observations. They are not current real-world measurements."
              : "Live temperature and algae observations from City of Helsinki Service Map. UiRaS may supply a recent temperature fallback. This is not official safety advice."}
          </Text>
        </View>
      </ScrollView>
      <View
        style={[
          styles.actions,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: spacing.md + insets.bottom,
          },
        ]}
      >
        <Pressable
          onPress={directions}
          accessibilityRole="button"
          accessibilityLabel={`Get directions to ${spot.name}`}
          style={[styles.secondary, { borderColor: theme.teal }]}
        >
          <Text style={{ color: theme.teal, fontWeight: "800" }}>
            Directions
          </Text>
        </Pressable>
        <FavoriteButton
          spotId={spot.id}
          spotName={spot.name}
          theme={theme}
          variant="primary"
          style={styles.actionFavorite}
        />
      </View>
    </View>
  );
}

function Fact({
  icon,
  iconColor,
  label,
  value,
  theme,
}: {
  icon: IconName;
  iconColor: string;
  label: string;
  value: string;
  theme: Theme;
}) {
  return (
    <View style={styles.fact}>
      <View style={styles.factIcon}>
        <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.factCopy}>
        <Text style={[styles.factValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.factLabel, { color: theme.textMuted }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function Section({
  title,
  theme,
  children,
}: {
  title: string;
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { borderTopColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: { overflow: "hidden", justifyContent: "flex-end" },
  heroWave: { alignItems: "center", paddingBottom: 20 },
  wave: {
    color: "#B5F0F4",
    fontSize: 150,
    fontWeight: "900",
    transform: [{ rotate: "-8deg" }],
  },
  back: {
    position: "absolute",
    left: 18,
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  floatingFavorite: {
    position: "absolute",
    right: 18,
    zIndex: 20,
    elevation: 10,
  },
  content: { padding: spacing.lg, paddingTop: spacing.lg + 8, gap: 16 },
  name: { fontSize: 30, fontWeight: "900", letterSpacing: -1 },
  address: { fontSize: 14, marginTop: -12 },
  summary: { padding: spacing.md, borderRadius: radius.md, gap: 8 },
  summaryText: { fontSize: 12, lineHeight: 17 },
  grid: { borderBottomWidth: 1, gap: 16, paddingBottom: 14 },
  fact: { flexDirection: "row", gap: 12, alignItems: "center", minHeight: 40 },
  factIcon: { width: 28, alignItems: "center" },
  factCopy: { flex: 1 },
  factValue: { fontSize: 15, fontWeight: "800" },
  factLabel: { fontSize: 12, marginTop: 1 },
  advisory: { padding: spacing.md, borderRadius: radius.md, gap: 4 },
  section: { borderTopWidth: 1, paddingTop: 16, gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "900" },
  sectionValue: { fontSize: 14, fontWeight: "700" },
  sectionDetail: { fontSize: 13, lineHeight: 18 },
  amenities: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenity: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 99,
    alignItems: "center",
  },
  amenityText: { fontSize: 12, fontWeight: "700" },
  sourceNote: { padding: spacing.sm, borderRadius: radius.sm, gap: 3 },
  sourceTitle: { fontSize: 12, fontWeight: "800" },
  actions: {
    padding: spacing.md,
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
  },
  secondary: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  actionFavorite: { flex: 1 },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
});
