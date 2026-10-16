"use client";

import { useEffect, useMemo, useState } from "react";
import { useGeolocation } from "@/components/LocationControls";
import DonorMap from "@/components/map/DonorMap";
import type { MapMarker } from "@/components/map/types";
import { api } from "@/lib/client";
import { directionsUrl, formatDistance } from "@/lib/format";
import { CITIES, DEFAULT_CENTER } from "@/lib/geo";
import type { BloodBank, BloodBankResult, LatLng } from "@/lib/types";

export const BANK_KIND: Record<BloodBank["kind"], string> = {
  blood_bank: "ব্লাড ব্যাংক",
  hospital: "হাসপাতাল",
  organization: "স্বেচ্ছাসেবী সংগঠন",
};

export default function BloodBanks() {
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [city, setCity] = useState("");
  const [banks, setBanks] = useState<BloodBankResult[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { locate, locating, error } = useGeolocation();

  useEffect(() => {
    const query = origin ? `?${new URLSearchParams({ lat: String(origin.lat), lng: String(origin.lng) })}` : "";
    api<{ banks: BloodBankResult[] }>(`/api/banks${query}`).then((res) => setBanks(res.ok ? res.data.banks : []));
  }, [origin]);

  const shown = useMemo(() => (banks ?? []).filter((b) => !city || b.city === city), [banks, city]);
  const markers: MapMarker[] = shown.map((b) => ({ id: b.id, lat: b.lat, lng: b.lng, label: "🏥", title: b.name, tone: "request" }));
  const selected = shown.find((b) => b.id === selectedId);
  const center = selected ?? origin ?? (shown[0] ? { lat: shown[0].lat, lng: shown[0].lng } : DEFAULT_CENTER);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <div>
        <h1 className="text-xl font-bold">ব্লাড ব্যাংক ও সংগঠন</h1>
        <p className="text-sm text-stone-500">ডোনার না পেলে কাছের ব্লাড ব্যাংক বা স্বেচ্ছাসেবী সংগঠনে যোগাযোগ করুন</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => locate(setOrigin)}
          disabled={locating}
          className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {locating ? "খুঁজছি…" : "📍 কাছেরগুলো আগে দেখান"}
        </button>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm">
          <option value="">সব শহর</option>
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-amber-700">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <DonorMap
          className="h-72 rounded-2xl border border-stone-200 lg:sticky lg:top-20 lg:order-2 lg:h-[70vh]"
          center={center}
          zoom={selected ? 15 : 12}
          origin={origin}
          markers={markers}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <ul className="space-y-3">
          {banks === null && <li className="text-center text-sm text-stone-500">লোড হচ্ছে…</li>}
          {banks !== null && shown.length === 0 && (
            <li className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-600">এই শহরে কোনো তথ্য নেই।</li>
          )}
          {shown.map((b) => (
            <li
              key={b.id}
              onClick={() => setSelectedId(b.id)}
              className={`cursor-pointer rounded-2xl border bg-white p-4 shadow-sm ${b.id === selectedId ? "border-red-500 ring-2 ring-red-200" : "border-stone-200"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{b.name}</h3>
                  <p className="text-sm text-stone-500">
                    📍 {b.area}, {b.city}
                    {b.distanceKm !== null && ` · ${formatDistance(b.distanceKm)} দূরে`}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">{BANK_KIND[b.kind]}</span>
              </div>
              {b.hours && <p className="mt-1 text-sm text-stone-600">🕒 {b.hours}</p>}
              {b.note && <p className="text-sm text-stone-600">{b.note}</p>}
              <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                {b.phone && (
                  <a href={`tel:${b.phone}`} className="flex-1 rounded-xl bg-red-600 py-2 text-center text-sm font-semibold text-white">
                    📞 {b.phone}
                  </a>
                )}
                <a
                  href={directionsUrl(b.lat, b.lng)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-xl bg-stone-100 py-2 text-center text-sm font-semibold text-stone-800"
                >
                  🧭 পথ দেখুন
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-stone-400">তথ্য অ্যাডমিনরা হালনাগাদ রাখেন। যাওয়ার আগে ফোনে নিশ্চিত হয়ে নিন।</p>
    </div>
  );
}
