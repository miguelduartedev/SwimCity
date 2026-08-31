const mockScreens: Array<{ name: string; options: Record<string, unknown> }> = [];
let mockScreenOptions: Record<string, unknown> = {};

jest.mock("expo-router", () => {
  const React = require("react");
  const Tabs = ({ children, screenOptions }: { children: React.ReactNode; screenOptions: Record<string, unknown> }) => {
    mockScreenOptions = screenOptions;
    return React.createElement(React.Fragment, null, children);
  };
  Tabs.Screen = ({ name, options }: { name: string; options: Record<string, unknown> }) => {
    mockScreens.push({ name, options });
    return null;
  };
  return { Tabs };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ name, size }: { name: string; size: number }) =>
      React.createElement(Text, null, `${name}:${size}`),
  };
});

import { render } from "@testing-library/react-native";
import TabLayout from "../app/(tabs)/_layout";

describe("tab navigation icons", () => {
  beforeEach(() => {
    mockScreens.length = 0;
    mockScreenOptions = {};
  });

  it("uses semantic 25px icons inside a 44pt tab target", () => {
    render(<TabLayout />);

    expect(mockScreenOptions.tabBarItemStyle).toMatchObject({ minHeight: 44 });

    const explore = mockScreens.find((screen) => screen.name === "index");
    const list = mockScreens.find((screen) => screen.name === "list");
    const saved = mockScreens.find((screen) => screen.name === "saved");

    const exploreIcon = (explore?.options.tabBarIcon as (props: { color: string; focused: boolean }) => React.ReactNode)({
      color: "#007A7A",
      focused: true,
    });
    const listIcon = (list?.options.tabBarIcon as (props: { color: string }) => React.ReactNode)({
      color: "#007A7A",
    });
    const savedIcon = (saved?.options.tabBarIcon as (props: { color: string; focused: boolean }) => React.ReactNode)({
      color: "#007A7A",
      focused: false,
    });

    expect(render(<>{exploreIcon}</>).getByText("map:25")).toBeTruthy();
    expect(render(<>{listIcon}</>).getByText("format-list-bulleted:25")).toBeTruthy();
    expect(render(<>{savedIcon}</>).getByText("heart-outline:25")).toBeTruthy();
  });
});
