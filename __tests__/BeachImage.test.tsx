jest.mock("expo-image", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    Image: ({ source, onError }: { source: string; onError: () => void }) =>
      React.createElement(
        Pressable,
        { testID: "remote-beach-image", onPress: onError },
        React.createElement(Text, null, source),
      ),
  };
});

import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";
import { BeachImage, getBeachImageSources } from "../components/BeachImage";
import { SwimmingSpot } from "../types/swimming";

const spot = (imageUrl?: string): SwimmingSpot => ({
  id: "40142",
  cityId: "helsinki",
  name: "Hietaranta beach",
  address: "Helsinki",
  description: "",
  coordinates: { latitude: 60.17, longitude: 24.91 },
  imageUrl,
  amenities: [],
  observation: {},
});

describe("BeachImage", () => {
  it("uses the normalized API image when one is available", () => {
    const screen = render(
      <BeachImage
        spot={spot("https://media.hel.fi/hietaranta.jpg")}
        style={{ width: 66, height: 76 }}
        fallback={<Text>Beach placeholder</Text>}
      />,
    );

    expect(getBeachImageSources(spot("https://media.hel.fi/hietaranta.jpg"))).toEqual([
      "https://media.hel.fi/hietaranta.jpg",
    ]);
    expect(screen.getByText("https://media.hel.fi/hietaranta.jpg")).toBeTruthy();
  });

  it("shows the placeholder for a missing or failed remote image", () => {
    const screen = render(
      <BeachImage
        spot={spot("https://media.hel.fi/broken.jpg")}
        style={{ width: 66, height: 76 }}
        fallback={<Text>Beach placeholder</Text>}
      />,
    );

    fireEvent.press(screen.getByTestId("remote-beach-image"));
    expect(screen.getByText("Beach placeholder")).toBeTruthy();

    screen.rerender(
      <BeachImage
        spot={spot()}
        style={{ width: 66, height: 76 }}
        fallback={<Text>Beach placeholder</Text>}
      />,
    );
    expect(screen.getByText("Beach placeholder")).toBeTruthy();
  });
});
