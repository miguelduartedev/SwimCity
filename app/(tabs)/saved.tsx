import { useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SpotCard } from "../../components/SpotCard";
import { useSwimmingSpots } from "../../hooks/useSwimmingSpots";
import { useFavoritesStore } from "../../stores/useFavoritesStore";
import { getTheme, spacing } from "../../theme";

export default function SavedScreen() {
  const theme = getTheme(useColorScheme());
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data = [], isLoading } = useSwimmingSpots();
  const ids = useFavoritesStore((state) => state.favoriteIds);
  const spots = data.filter((spot) => ids.includes(spot.id));
  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={[styles.title, { color: theme.text }]}>Saved</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Your favorite swimming spots, kept on this device.
        </Text>
      </View>
      {isLoading ? (
        <Text style={[styles.loading, { color: theme.textMuted }]}>
          Loading saved spots…
        </Text>
      ) : (
        <FlatList
          data={spots}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: spacing.md + insets.bottom },
          ]}
          keyExtractor={(spot) => spot.id}
          renderItem={({ item }) => (
            <SpotCard
              spot={item}
              theme={theme}
              onPress={() =>
                router.push({ pathname: "/spot/[id]", params: { id: item.id } })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.illustration}>☂</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Save your favorite spots
              </Text>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Tap the heart on any beach to find it here later.
              </Text>
              <Pressable
                onPress={() => router.replace("/")}
                style={[styles.explore, { backgroundColor: theme.teal }]}
              >
                <Text style={styles.exploreText}>Explore beaches</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: spacing.lg, paddingBottom: spacing.sm, gap: 6 },
  title: { fontSize: 28, fontWeight: "900" },
  subtitle: { fontSize: 14, lineHeight: 20 },
  list: { paddingHorizontal: spacing.md, paddingBottom: 20 },
  loading: { textAlign: "center", padding: 30 },
  empty: {
    paddingTop: 95,
    alignItems: "center",
    paddingHorizontal: 35,
    gap: 10,
  },
  illustration: { fontSize: 66, color: "#55C3DB" },
  emptyTitle: { fontSize: 21, fontWeight: "900" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  explore: {
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
  },
  exploreText: { color: "#fff", fontWeight: "800" },
});
