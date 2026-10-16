"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import BloodGroupPicker from "@/components/BloodGroupPicker";
import DonorCard from "@/components/DonorCard";
import { AreaSelect, useGeolocation } from "@/components/LocationControls";
import DonorMap from "@/components/map/DonorMap";
import type { MapMarker } from "@/components/map/types";
import { isBloodGroup, RECEIVES_FROM, type BloodGroup } from "@/lib/blood";
import { bn } from "@/lib/format";
import { DEFAULT_CENTER, isLatLng } from "@/lib/geo";
import type { DonorResult, LatLng } from "@/lib/types";

const RADII = [2, 5, 10, 25, 50, 0];

const WIDE = "(min-width: 1024px)";
function useIsWide() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(WIDE);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
}

export default function FindDonors() {
  const params = useSearchParams();
  const initialGroup = params.get("group");
  const initialLat = Number(params.get("lat"));
  const initialLng = Number(params.get("lng"));
  const hasInitialPoint = params.has("lat") && isLatLng(initialLat, initialLng);

  const [group, setGroup] = useState<BloodGroup | "">(isBloodGroup(initialGroup) ? initialGroup : "");
  const [compatible, setCompatible] = useState(params.get("compatible") === "1");
  const [eligibleOnly, setEligibleOnly] = useState(params.get("eligible") !== "0");
  const [radius, setRadius] = useState(Number(params.get("radius")) || 10);
  const [origin, setOrigin] = useState<LatLng>(hasInitialPoint ? { lat: initialLat, lng: initialLng } : DEFAULT_CENTER);
  const [originLabel, setOriginLabel] = useState(
    hasInitialPoint ? (params.get("label") ?? "বেছে নেওয়া স্থান") : "ঢাকা (ডিফল্ট)",
  );
  const [areaKey, setAreaKey] = useState("");

  // Each response is tagged with the query it answers; a mismatch means a newer one is in flight.
  const [result, setResult] = useState<{ query: string; donors: DonorResult[]; total: number; error: string | null } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLLIElement>());

  const { locate, locating, error: geoError } = useGeolocation();
  const locateMe = () =>
    locate((point) => {
      setOrigin(point);
      setOriginLabel("আমার লোকেশন");
      setAreaKey("");
    });

  // Home page's "near me" button lands here with ?near=me.
  const askedForLocation = params.get("near") === "me";
  useEffect(() => {
    if (askedForLocation) locateMe();
  }, [askedForLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const query = useMemo(() => {
    const q = new URLSearchParams({ lat: String(origin.lat), lng: String(origin.lng) });
    if (radius) q.set("radius", String(radius));
    if (group) q.set("group", group);
    if (group && compatible) q.set("compatible", "1");
    if (eligibleOnly) q.set("eligible", "1");
    return q.toString();
  }, [origin, radius, group, compatible, eligibleOnly]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/donors?${query}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { donors: DonorResult[]; total: number }) =>
        setResult({ query, donors: data.donors, total: data.total, error: null }),
      )
      .catch((e) => {
        if (!controller.signal.aborted)
          setResult({ query, donors: [], total: 0, error: `ডোনার তালিকা আনা যায়নি (${e.message})।` });
      });
    return () => controller.abort();
  }, [query]);

  const loading = result?.query !== query;
  const donors = useMemo(() => result?.donors ?? [], [result]);
  const total = result?.total ?? 0;
  const error = loading ? null : result.error;

  // Keep the URL shareable without adding history entries.
  useEffect(() => {
    const query = new URLSearchParams({
      lat: origin.lat.toFixed(5),
      lng: origin.lng.toFixed(5),
      radius: String(radius),
      label: originLabel,
    });
    if (group) query.set("group", group);
    if (compatible) query.set("compatible", "1");
    if (!eligibleOnly) query.set("eligible", "0");
    window.history.replaceState(null, "", `/find?${query}`);
  }, [origin, radius, group, compatible, eligibleOnly, originLabel]);

  const markers: MapMarker[] = useMemo(
    () =>
      donors.map((d) => ({
        id: d.id,
        lat: d.lat,
        lng: d.lng,
        label: d.bloodGroup,
        title: `${d.name} (${d.bloodGroup})`,
        tone: d.eligible ? "donor" : "donor-off",
      })),
    [donors],
  );

  function selectFromMap(id: string) {
    setSelectedId(id);
    cardRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const readyCount = donors.filter((d) => d.eligible).length;
  const isWide = useIsWide();
  const map = (height: string) => (
    <DonorMap
      className={`${height} rounded-2xl border border-stone-200`}
      center={origin}
      origin={origin}
      radiusKm={radius || null}
      markers={markers}
      selectedId={selectedId}
      onSelect={selectFromMap}
      onPick={(p) => {
        setOrigin(p);
        setOriginLabel("ম্যাপে বেছে নেওয়া স্থান");
        setAreaKey("");
      }}
    />
  );

  return (
    <div className="mx-auto max-w-6xl lg:grid lg:h-[calc(100dvh-3.5rem)] lg:grid-cols-[420px_1fr] lg:gap-4 lg:p-4">
      <section className="space-y-3 p-4 lg:overflow-y-auto lg:p-0 lg:pr-1">
        <div>
          <h1 className="text-xl font-bold">কাছের রক্তদাতা খুঁজুন</h1>
          <p className="text-sm text-stone-500">রোগীর রক্তের গ্রুপ ও লোকেশন বেছে নিন</p>
        </div>

        <BloodGroupPicker value={group} onChange={setGroup} allowAny />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {locating ? "খুঁজছি…" : "📍 আমার লোকেশন"}
          </button>
          <AreaSelect
            value={areaKey}
            className="min-w-0 flex-1"
            onChange={(a) => {
              setAreaKey(`${a.city}/${a.name}`);
              setOrigin({ lat: a.lat, lng: a.lng });
              setOriginLabel(`${a.name}, ${a.city}`);
            }}
          />
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
            aria-label="দূরত্ব"
          >
            {RADII.map((r) => (
              <option key={r} value={r}>
                {r ? `${bn(r)} কিমি` : "সব দূরত্ব"}
              </option>
            ))}
          </select>
        </div>
        {geoError && <p className="text-sm text-amber-700">{geoError}</p>}

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} className="size-4 accent-red-600" />
            শুধু যারা এখন দিতে পারবেন
          </label>
          <label className={`flex items-center gap-2 ${group ? "" : "opacity-50"}`}>
            <input
              type="checkbox"
              checked={compatible}
              disabled={!group}
              onChange={(e) => setCompatible(e.target.checked)}
              className="size-4 accent-red-600"
            />
            সামঞ্জস্যপূর্ণ সব গ্রুপ
          </label>
        </div>
        {group && compatible && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {group} রোগী রক্ত নিতে পারেন: <b>{RECEIVES_FROM[group].join(", ")}</b>
          </p>
        )}

        {/* On phones the map sits between the filters and the list; on wide screens it fills the right column. */}
        {!isWide && map("h-[45vh]")}

        <div className="flex items-baseline justify-between pt-1">
          <p className="text-sm text-stone-600" aria-live="polite">
            {loading ? (
              "খুঁজছি…"
            ) : (
              <>
                <b>{originLabel}</b> {radius ? `থেকে ${bn(radius)} কিমির মধ্যে` : "থেকে"} <b>{bn(total)}</b> জন ডোনার
                {!eligibleOnly && ` (${bn(readyCount)} জন এখন প্রস্তুত)`}
              </>
            )}
          </p>
        </div>
        <p className="text-xs text-stone-400">ম্যাপে ট্যাপ করে সেখান থেকেও খুঁজতে পারেন।</p>

        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {!loading && !error && donors.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-600">
            <p className="mb-3">এই এলাকায় কোনো ডোনার পাওয়া যায়নি।</p>
            <div className="flex flex-wrap justify-center gap-2">
              {radius !== 0 && (
                <button onClick={() => setRadius(radius < 50 ? 50 : 0)} className="rounded-full bg-stone-100 px-3 py-1.5">
                  দূরত্ব বাড়ান
                </button>
              )}
              {group && !compatible && (
                <button onClick={() => setCompatible(true)} className="rounded-full bg-stone-100 px-3 py-1.5">
                  সামঞ্জস্যপূর্ণ গ্রুপ দেখুন
                </button>
              )}
              {eligibleOnly && (
                <button onClick={() => setEligibleOnly(false)} className="rounded-full bg-stone-100 px-3 py-1.5">
                  সব ডোনার দেখুন
                </button>
              )}
            </div>
          </div>
        )}

        <ul className="space-y-3 pb-4">
          {donors.map((d) => (
            <DonorCard
              key={d.id}
              ref={(el) => {
                if (el) cardRefs.current.set(d.id, el);
                else cardRefs.current.delete(d.id);
              }}
              donor={d}
              selected={d.id === selectedId}
              onSelect={() => setSelectedId(d.id === selectedId ? null : d.id)}
            />
          ))}
        </ul>
      </section>

      {isWide && map("h-full")}
    </div>
  );
}
