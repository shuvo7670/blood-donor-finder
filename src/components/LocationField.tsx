"use client";

import { useState } from "react";
import { AreaSelect, useGeolocation } from "@/components/LocationControls";
import DonorMap from "@/components/map/DonorMap";
import { DEFAULT_CENTER, type Area } from "@/lib/geo";
import type { LatLng } from "@/lib/types";

/** A map the user taps (or GPS / area list) to set one point. Picking an area also reports it. */
export default function LocationField({
  value,
  onChange,
  onArea,
  error,
}: {
  value: LatLng | null;
  onChange: (point: LatLng) => void;
  onArea?: (area: Area) => void;
  error?: string;
}) {
  const [center, setCenter] = useState<LatLng>(value ?? DEFAULT_CENTER);
  const [areaKey, setAreaKey] = useState("");
  const { locate, locating, error: geoError } = useGeolocation();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            locate((p) => {
              setCenter(p);
              onChange(p);
            })
          }
          disabled={locating}
          className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {locating ? "খুঁজছি…" : "📍 বর্তমান লোকেশন"}
        </button>
        <AreaSelect
          value={areaKey}
          className="min-w-0 flex-1"
          onChange={(a) => {
            setAreaKey(`${a.city}/${a.name}`);
            const p = { lat: a.lat, lng: a.lng };
            setCenter(p);
            onChange(p);
            onArea?.(a);
          }}
        />
      </div>
      <DonorMap
        className={`h-64 rounded-2xl border ${error ? "border-red-400" : "border-stone-200"}`}
        center={center}
        zoom={14}
        picked={value}
        onPick={onChange}
      />
      <p className={`text-xs ${error ? "text-red-600" : "text-stone-500"}`}>
        {error ??
          (value
            ? `বেছে নেওয়া হয়েছে: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)} — ঠিক করতে ম্যাপে আবার ট্যাপ করুন`
            : "ম্যাপে ট্যাপ করে সঠিক জায়গা বেছে নিন")}
      </p>
      {geoError && <p className="text-xs text-amber-700">{geoError}</p>}
    </div>
  );
}
