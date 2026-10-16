import type { LatLng } from "@/lib/types";

export type MarkerTone = "donor" | "donor-off" | "request";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  /** Short text inside the pin, e.g. "B+". */
  label: string;
  title: string;
  tone: MarkerTone;
}

export interface MapViewProps {
  center: LatLng;
  zoom?: number;
  /** The search point, drawn as a blue dot. */
  origin?: LatLng | null;
  /** Draws a circle of this radius around the origin and fits the map to it. */
  radiusKm?: number | null;
  markers?: MapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Tapping the map reports the point; pass `picked` to show it as a pin. */
  onPick?: (point: LatLng) => void;
  picked?: LatLng | null;
  className?: string;
}
