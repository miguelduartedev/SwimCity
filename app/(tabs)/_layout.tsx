import { Tabs } from "expo-router";
import { ColorValue, Text, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTheme } from "../../theme";

const Icon = ({ symbol, color }: { symbol: string; color: ColorValue }) => (
  <>
    {/* native text avoids a larger icon dependency */}
    <TabsIcon symbol={symbol} color={color} />
  </>
);
const TabsIcon = ({ symbol, color }: { symbol: string; color: ColorValue }) => (
  <Text style={{ color, fontSize: 18 }}>{symbol}</Text>
);
export default function TabLayout() {
  const theme = getTheme(useColorScheme());
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.teal,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 68 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => <Icon symbol="●" color={color} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: "List",
          tabBarIcon: ({ color }) => <Icon symbol="☷" color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color }) => <Icon symbol="♡" color={color} />,
        }}
      />
    </Tabs>
  );
}
