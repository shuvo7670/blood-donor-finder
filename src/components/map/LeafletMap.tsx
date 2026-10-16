"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { MapMarker, MapViewProps } from "./types";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function pinIcon(marker: Pick<MapMarker, "label" | "tone">, selected: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="pin pin-${marker.tone}${selected ? " pin-selected" : ""}"><span>${escapeHtml(marker.label)}</span></div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 41],
  });
}

const originIcon = L.divIcon({ className: "", html: '<div class="origin-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });

function FollowView({ center, zoom, radiusKm }: Pick<MapViewProps, "center" | "zoom" | "radiusKm">) {
  const map = useMap();
  useEffect(() => {
    if (radiusKm) map.fitBounds(L.latLng(center.lat, center.lng).toBounds(radiusKm * 2000), { padding: [12, 12] });
    else map.setView([center.lat, center.lng], zoom ?? map.getZoom());
  }, [map, center.lat, center.lng, zoom, radiusKm]);
  return null;
}

function PanToSelected({ markers, selectedId }: Pick<MapViewProps, "markers" | "selectedId">) {
  const map = useMap();
  const target = markers?.find((m) => m.id === selectedId);
  useEffect(() => {
    if (target) map.panTo([target.lat, target.lng]);
  }, [map, target?.lat, target?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function ClickToPick({ onPick }: { onPick: NonNullable<MapViewProps["onPick"]> }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

export default function LeafletMap({
  center,
  zoom = 13,
  origin,
  radiusKm,
  markers = [],
  selectedId,
  onSelect,
  onPick,
  picked,
}: MapViewProps) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FollowView center={center} zoom={zoom} radiusKm={radiusKm} />
      <PanToSelected markers={markers} selectedId={selectedId} />
      {onPick && <ClickToPick onPick={onPick} />}

      {origin && radiusKm ? (
        <Circle
          center={[origin.lat, origin.lng]}
          radius={radiusKm * 1000}
          pathOptions={{ color: "#dc2626", weight: 1.5, fillColor: "#dc2626", fillOpacity: 0.06 }}
        />
      ) : null}
      {origin && <Marker position={[origin.lat, origin.lng]} icon={originIcon} interactive={false} />}

      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={pinIcon(m, m.id === selectedId)}
          title={m.title}
          zIndexOffset={m.id === selectedId ? 1000 : m.tone === "donor" ? 100 : 0}
          eventHandlers={{ click: () => onSelect?.(m.id) }}
        />
      ))}

      {picked && <Marker position={[picked.lat, picked.lng]} icon={pinIcon({ label: "📍", tone: "request" }, true)} />}
    </MapContainer>
  );
}
