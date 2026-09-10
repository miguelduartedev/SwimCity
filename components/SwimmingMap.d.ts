import { Theme } from '../theme';
import { Coordinates, SwimmingSpot } from '../types/swimming';
import { MapDisplayMode } from '../features/swimming-spots/mapPresentation';

export declare function SwimmingMap(props: {
  spots: SwimmingSpot[];
  theme: Theme;
  displayMode: MapDisplayMode;
  selectedSpotId?: string;
  userLocation?: Coordinates;
  bottomContentInset?: number;
  onSelect: (spot: SwimmingSpot) => void;
}): React.ReactElement;
