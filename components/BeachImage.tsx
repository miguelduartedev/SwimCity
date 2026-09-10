import { Image } from "expo-image";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SwimmingSpot } from "../types/swimming";

// Reserved for curated images when the City catalogue has no suitable photo.
const curatedBeachImageOverrides: Readonly<Record<string, string>> = {};

export const getBeachImageSources = (spot: SwimmingSpot): string[] =>
  [spot.imageUrl, curatedBeachImageOverrides[spot.id]]
    .filter((url): url is string => Boolean(url))
    .filter((url, index, urls) => urls.indexOf(url) === index);

export function BeachImage({
  spot,
  style,
  fallback,
  testID,
}: {
  spot: SwimmingSpot;
  style: StyleProp<ViewStyle>;
  fallback: ReactNode;
  testID?: string;
}) {
  const sources = useMemo(() => getBeachImageSources(spot), [spot]);
  const sourceKey = sources.join("|");
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [sourceKey]);

  const source = sources[sourceIndex];

  return (
    <View style={style} testID={testID}>
      {source ? (
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
          accessible={false}
          onError={() => setSourceIndex((index) => index + 1)}
        />
      ) : (
        fallback
      )}
    </View>
  );
}
