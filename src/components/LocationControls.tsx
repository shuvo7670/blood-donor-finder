"use client";

import { useState } from "react";
import { AREAS, CITIES, type Area } from "@/lib/geo";
import type { LatLng } from "@/lib/types";

export function useGeolocation() {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function locate(onFound: (point: LatLng) => void) {
    if (!("geolocation" in navigator)) {
      setError("এই ব্রাউজারে লোকেশন পাওয়া যায় না।");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onFound({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "লোকেশনের অনুমতি দেওয়া হয়নি। এলাকা বেছে নিন বা ম্যাপে ট্যাপ করুন।"
            : "লোকেশন পাওয়া যায়নি। আবার চেষ্টা করুন।",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return { locate, locating, error };
}

export function AreaSelect({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (area: Area) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const area = AREAS.find((a) => `${a.city}/${a.name}` === e.target.value);
        if (area) onChange(area);
      }}
      className={`rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm ${className}`}
    >
      <option value="">এলাকা বেছে নিন…</option>
      {CITIES.map((city) => (
        <optgroup key={city} label={city}>
          {AREAS.filter((a) => a.city === city).map((a) => (
            <option key={a.name} value={`${a.city}/${a.name}`}>
              {a.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
