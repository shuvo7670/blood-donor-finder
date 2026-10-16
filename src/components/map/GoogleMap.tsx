"use client";

import { AdvancedMarker, APIProvider, Circle, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import type { MapViewProps } from "./types";

// AdvancedMarker needs a Map ID; DEMO_MAP_ID works for development.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

function FollowView({ center, zoom, radiusKm }: Pick<MapViewProps, "center" | "zoom" | "radiusKm">) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (radiusKm) {
      const circle = new google.maps.Circle({ center, radius: radiusKm * 1000 });
      const bounds = circle.getBounds();
      if (bounds) map.fitBounds(bounds, 12);
    } else {
      map.panTo(center);
      if (zoom) map.setZoom(zoom);
    }
  }, [map, center.lat, center.lng, zoom, radiusKm]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function PanToSelected({ markers, selectedId }: Pick<MapViewProps, "markers" | "selectedId">) {
  const map = useMap();
  const target = markers?.find((m) => m.id === selectedId);
  useEffect(() => {
    if (map && target) map.panTo({ lat: target.lat, lng: target.lng });
  }, [map, target?.lat, target?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function GoogleMap({
  apiKey,
  center,
  zoom = 13,
  origin,
  radiusKm,
  markers = [],
  selectedId,
  onSelect,
  onPick,
  picked,
}: MapViewProps & { apiKey: string }) {
  return (
    <APIProvider apiKey={apiKey} language="bn" region="BD">
      <Map
        className="h-full w-full"
        mapId={MAP_ID}
        defaultCenter={center}
        defaultZoom={zoom}
        gestureHandling="greedy"
        streetViewControl={false}
        mapTypeControl={false}
        clickableIcons={false}
        onClick={(e) => {
          if (onPick && e.detail.latLng) onPick(e.detail.latLng);
        }}
      >
        <FollowView center={center} zoom={zoom} radiusKm={radiusKm} />
        <PanToSelected markers={markers} selectedId={selectedId} />

        {origin && radiusKm ? (
          <Circle
            center={origin}
            radius={radiusKm * 1000}
            strokeColor="#dc2626"
            strokeWeight={1.5}
            fillColor="#dc2626"
            fillOpacity={0.06}
            clickable={false}
          />
        ) : null}
        {origin && (
          <AdvancedMarker position={origin} clickable={false} anchorLeft="-50%" anchorTop="-50%">
            <div className="origin-dot" />
          </AdvancedMarker>
        )}

        {markers.map((m) => (
          <AdvancedMarker
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            title={m.title}
            zIndex={m.id === selectedId ? 1000 : m.tone === "donor" ? 100 : 1}
            onClick={() => onSelect?.(m.id)}
          >
            <div className="pin-google">
              <div className={`pin pin-${m.tone}${m.id === selectedId ? " pin-selected" : ""}`}>
                <span>{m.label}</span>
              </div>
            </div>
          </AdvancedMarker>
        ))}

        {picked && (
          <AdvancedMarker position={picked} zIndex={2000}>
            <div className="pin-google">
              <div className="pin pin-request pin-selected">
                <span>📍</span>
              </div>
            </div>
          </AdvancedMarker>
        )}
      </Map>
    </APIProvider>
  );
}
