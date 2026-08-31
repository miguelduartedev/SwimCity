jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "40142" }),
  useRouter: () => ({ canGoBack: () => true, back: jest.fn(), replace: jest.fn() }),
}));
jest.mock("expo-linking", () => ({ openURL: jest.fn() }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }: { name: string }) => React.createElement(Text, null, name);
});
jest.mock("../components/FavoriteButton", () => ({
  FavoriteButton: () => null,
}));

import { render } from "@testing-library/react-native";
import DetailScreen from "../app/spot/[id]";
import { useSwimmingSpots } from "../hooks/useSwimmingSpots";

jest.mock("../hooks/useSwimmingSpots", () => ({
  useSwimmingSpots: jest.fn(),
}));

const mockedUseSwimmingSpots = jest.mocked(useSwimmingSpots);

describe("DetailScreen", () => {
  it("labels algae-derived quality as an estimate rather than a laboratory result", () => {
    mockedUseSwimmingSpots.mockReturnValue({
      data: [
        {
          id: "40142",
          cityId: "helsinki",
          name: "Hietaranta beach",
          address: "Helsinki",
          description: "",
          coordinates: { latitude: 60.17, longitude: 24.93 },
          amenities: [],
          observation: {
            algae: {
              value: "none",
              observedAt: new Date().toISOString(),
              source: "service-map",
            },
            waterQuality: {
              value: "good",
              observedAt: new Date().toISOString(),
              source: "service-map",
              inferred: true,
            },
          },
        },
      ],
    } as unknown as ReturnType<typeof useSwimmingSpots>);

    const screen = render(<DetailScreen />);

    expect(screen.getByText("Good (based on algae)")).toBeTruthy();
    expect(
      screen.getByText(/Water-quality estimate based on algae/),
    ).toBeTruthy();
  });
});
