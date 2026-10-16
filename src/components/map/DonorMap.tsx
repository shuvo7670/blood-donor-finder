"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "./types";

function MapLoading() {
  return (
    <div className="grid h-full w-full place-items-center bg-stone-100 text-sm text-stone-500">ম্যাপ লোড হচ্ছে…</div>
  );
}

// Both map libraries touch `window`, so they only ever render in the browser.
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false, loading: MapLoading });
const GoogleMap = dynamic(() => import("./GoogleMap"), { ssr: false, loading: MapLoading });

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/** Google Maps when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set, OpenStreetMap (no key needed) otherwise. */
export default function DonorMap({ className = "", ...props }: MapViewProps) {
  return (
    <div className={`relative isolate overflow-hidden ${className}`}>
      {GOOGLE_KEY ? <GoogleMap apiKey={GOOGLE_KEY} {...props} /> : <LeafletMap {...props} />}
    </div>
  );
}
