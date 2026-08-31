import { Theme } from '../theme';
import { Coordinates, SwimmingSpot } from '../types/swimming';

export declare function SwimmingMap(props: {
  spots: SwimmingSpot[];
  theme: Theme;
  userLocation?: Coordinates;
  onSelect: (spot: SwimmingSpot) => void;
}): React.ReactElement;
