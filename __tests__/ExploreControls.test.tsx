jest.mock("expo-location", () => ({
  Accuracy: { Balanced: "balanced" },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ name, size }: { name: string; size: number }) =>
      React.createElement(Text, { testID: "vector-icon" }, `${name}:${size}`),
  };
});

jest.mock("../components/SwimmingMap", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    SwimmingMap: ({ bottomContentInset = 0 }: { bottomContentInset?: number }) =>
      React.createElement(
        Text,
        { testID: "swimming-map" },
        `bottom-inset:${bottomContentInset}`,
      ),
  };
});

jest.mock("../hooks/useSwimmingSpots", () => ({
  useSwimmingSpots: () => ({ data: [], isLoading: false, isError: false, refetch: jest.fn() }),
}));

import { fireEvent, render } from "@testing-library/react-native";
import ExploreScreen from "../app/(tabs)/index";

describe("Explore map controls", () => {
  it("uses a balanced search icon and measures the full lower overlay for the map", () => {
    const screen = render(<ExploreScreen />);

    expect(screen.getByText("magnify:21")).toBeTruthy();
    expect(screen.getByTestId("swimming-status-legend")).toBeTruthy();
    expect(screen.getByLabelText("Use my location")).toBeTruthy();

    fireEvent(screen.getByTestId("explore-bottom-overlay"), "layout", {
      nativeEvent: { layout: { height: 184, width: 320, x: 0, y: 0 } },
    });

    expect(screen.getByText("bottom-inset:184")).toBeTruthy();
  });
});
