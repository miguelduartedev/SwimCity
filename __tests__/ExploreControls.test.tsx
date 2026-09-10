jest.mock("expo-location", () => ({
  Accuracy: { Balanced: "balanced" },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
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

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { LinearGradient: ({ children, ...props }: { children?: React.ReactNode }) => React.createElement(View, props, children) };
});

jest.mock("../components/SwimmingMap", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  const spot = {
    id: "40142",
    cityId: "helsinki",
    name: "Hietaranta beach",
    address: "Helsinki",
    description: "",
    coordinates: { latitude: 60.17, longitude: 24.91 },
    amenities: [],
    observation: {},
  };
  return {
    SwimmingMap: ({
      bottomContentInset = 0,
      displayMode,
      selectedSpotId,
      onSelect,
    }: {
      bottomContentInset?: number;
      displayMode: string;
      selectedSpotId?: string;
      onSelect: (spot: {
        id: string;
        cityId: string;
        name: string;
        address: string;
        description: string;
        coordinates: { latitude: number; longitude: number };
        amenities: string[];
        observation: Record<string, never>;
      }) => void;
    }) =>
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          Text,
          { testID: "swimming-map" },
          `bottom-inset:${bottomContentInset};mode:${displayMode};selected:${selectedSpotId ?? "none"}`,
        ),
        React.createElement(
          Pressable,
          { testID: "select-map-spot", onPress: () => onSelect(spot) },
          React.createElement(Text, null, "Select Hietaranta"),
        ),
      ),
  };
});

jest.mock("../hooks/useSwimmingSpots", () => ({
  useSwimmingSpots: () => ({ data: [], isLoading: false, isError: false, refetch: jest.fn() }),
}));

import { act, fireEvent, render } from "@testing-library/react-native";
import ExploreScreen from "../app/(tabs)/index";
import { useSeasonalDisclaimerStore } from "../stores/useSeasonalDisclaimerStore";

describe("Explore map controls", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-20T12:00:00Z"));
    useSeasonalDisclaimerStore.setState({
      dismissedOffSeasonDisclaimerFor: undefined,
      hasHydrated: true,
    });
  });
  afterEach(() => jest.useRealTimers());

  it("uses a balanced search icon and measures the full lower overlay for the map", () => {
    const screen = render(<ExploreScreen />);

    expect(screen.getByText("magnify:21")).toBeTruthy();
    expect(screen.getByTestId("swimming-status-legend")).toBeTruthy();
    expect(screen.getByLabelText("Use my location")).toBeTruthy();
    expect(screen.queryByLabelText("Open filters")).toBeNull();
    expect(screen.queryByText("Quick filters")).toBeNull();
    expect(screen.queryByTestId("seasonal-data-disclaimer")).toBeNull();
    expect(screen.queryByText(/Helsinki swimming spots/)).toBeNull();
    expect(screen.queryByText(/Tap a marker/)).toBeNull();

    fireEvent(screen.getByTestId("explore-bottom-overlay"), "layout", {
      nativeEvent: { layout: { height: 184, width: 320, x: 0, y: 0 } },
    });

    expect(screen.getByText("bottom-inset:184;mode:summer-status;selected:none")).toBeTruthy();
  });

  it("shows the temperature legend and seasonal disclaimer outside summer", () => {
    jest.setSystemTime(new Date("2026-09-10T12:00:00Z"));
    const screen = render(<ExploreScreen />);

    expect(screen.getByTestId("temperature-legend")).toBeTruthy();
    expect(screen.getByTestId("temperature-gradient")).toBeTruthy();
    expect(screen.getByText("≤10°C — Very cold")).toBeTruthy();
    expect(screen.getByText("18°C")).toBeTruthy();
    expect(screen.getByText("≥25°C — Warm")).toBeTruthy();
    expect(screen.getByTestId("seasonal-data-disclaimer")).toBeTruthy();
    expect(
      screen.getByText(
        "Beach observations are seasonal. Outside the swimming season, some data may be unavailable or outdated.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/Helsinki swimming spots/)).toBeNull();
    expect(screen.queryByText(/Tap a marker/)).toBeNull();
    expect(screen.getByText("bottom-inset:0;mode:temperature;selected:none")).toBeTruthy();
  });

  it("waits for dismissal hydration and persists a dismissal for the current off-season", () => {
    jest.setSystemTime(new Date("2026-09-10T12:00:00Z"));
    useSeasonalDisclaimerStore.setState({ hasHydrated: false });
    const screen = render(<ExploreScreen />);

    expect(screen.queryByTestId("seasonal-data-disclaimer")).toBeNull();

    act(() => {
      useSeasonalDisclaimerStore.setState({ hasHydrated: true });
    });
    expect(screen.getByTestId("seasonal-data-disclaimer")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Dismiss seasonal data notice"));
    expect(screen.queryByTestId("seasonal-data-disclaimer")).toBeNull();
    expect(
      useSeasonalDisclaimerStore.getState().dismissedOffSeasonDisclaimerFor,
    ).toBe("2026-2027");

    jest.setSystemTime(new Date("2027-09-10T12:00:00Z"));
    screen.rerender(<ExploreScreen />);
    expect(screen.getByTestId("seasonal-data-disclaimer")).toBeTruthy();
  });

  it("clears the selected map marker when its preview closes", () => {
    const screen = render(<ExploreScreen />);

    fireEvent.press(screen.getByTestId("select-map-spot"));
    expect(screen.getByText("Hietaranta beach")).toBeTruthy();
    expect(screen.getByText("bottom-inset:0;mode:summer-status;selected:40142")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Close preview"));
    expect(screen.queryByLabelText("Close preview")).toBeNull();
    expect(screen.getByText("bottom-inset:0;mode:summer-status;selected:none")).toBeTruthy();
  });
});
