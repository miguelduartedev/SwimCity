import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SpotCard } from "../../components/SpotCard";
import {
  filterSpots,
  sortSpots,
} from "../../features/swimming-spots/selectors";
import { useSwimmingSpots } from "../../hooks/useSwimmingSpots";
import { getTheme, radius, spacing } from "../../theme";
import { Coordinates, SortOption } from "../../types/swimming";

const options: { key: SortOption; label: string }[] = [
  { key: "best", label: "Best conditions" },
  { key: "nearest", label: "Nearest" },
  { key: "warmest", label: "Warmest" },
];
export default function ListScreen() {
  const theme = getTheme(useColorScheme());
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data = [], isLoading, isError, refetch } = useSwimmingSpots();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("best");
  const [location, setLocation] = useState<Coordinates>();
  const spots = useMemo(
    () => sortSpots(filterSpots(data, query, {}), sort, location),
    [data, query, sort, location],
  );
  const fixtureMode = data.some((spot) =>
    Object.values(spot.observation).some(
      (signal) =>
        typeof signal === "object" &&
        signal !== null &&
        "source" in signal &&
        signal.source === "fixture",
    ),
  );
  const useLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status === "granted") {
      const point = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: point.coords.latitude,
        longitude: point.coords.longitude,
      });
      setSort("nearest");
    }
  };
  if (isLoading)
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.teal} />
      </View>
    );
  if (isError)
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>
          Unable to load swimming spots.
        </Text>
        <Pressable onPress={() => refetch()}>
          <Text style={{ color: theme.teal, fontWeight: "800" }}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          Explore Helsinki
        </Text>
        <Text style={[styles.caption, { color: theme.textMuted }]}>
          {fixtureMode
            ? "Development fixture conditions — not live"
            : "Live observations from City of Helsinki Service Map"}
        </Text>
        <View
          style={[
            styles.search,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={{ color: theme.textMuted }}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search swimming spots"
            placeholder="Search beaches"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.text }]}
          />
        </View>
        <View style={styles.sorts}>
          {options.map((option) => (
            <Pressable
              key={option.key}
              onPress={() =>
                option.key === "nearest" && !location
                  ? useLocation()
                  : setSort(option.key)
              }
              style={[
                styles.sort,
                {
                  backgroundColor:
                    sort === option.key ? theme.navy : theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={{
                  color: sort === option.key ? "#fff" : theme.text,
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        contentContainerStyle={[
          styles.list,
          { paddingBottom: spacing.md + insets.bottom },
        ]}
        data={spots}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SpotCard
            spot={item}
            theme={theme}
            userLocation={location}
            onPress={() =>
              router.push({ pathname: "/spot/[id]", params: { id: item.id } })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No beaches match that search
            </Text>
            <Text style={{ color: theme.textMuted }}>
              Try a different name or clear the search.
            </Text>
          </View>
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: spacing.md, paddingBottom: spacing.sm, gap: 10 },
  title: { fontSize: 27, fontWeight: "900", letterSpacing: -0.8 },
  caption: { fontSize: 12 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 13,
    gap: 9,
    height: 48,
  },
  input: { flex: 1, fontSize: 15 },
  sorts: { flexDirection: "row", gap: 7 },
  sort: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: 18 },
  empty: { alignItems: "center", paddingTop: 52, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
});
