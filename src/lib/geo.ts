import type { LatLng } from "./types";

export const DEFAULT_CENTER: LatLng = { lat: 23.7808, lng: 90.4093 }; // Dhaka

export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isLatLng(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

export interface Area {
  name: string;
  city: string;
  lat: number;
  lng: number;
}

/** Known areas: used to pick a search point without GPS, and as the seed data's neighbourhoods. */
export const AREAS: Area[] = [
  { name: "ধানমন্ডি", city: "ঢাকা", lat: 23.7465, lng: 90.376 },
  { name: "মিরপুর", city: "ঢাকা", lat: 23.8223, lng: 90.3654 },
  { name: "উত্তরা", city: "ঢাকা", lat: 23.8759, lng: 90.3795 },
  { name: "গুলশান", city: "ঢাকা", lat: 23.7925, lng: 90.4078 },
  { name: "বনানী", city: "ঢাকা", lat: 23.7937, lng: 90.4066 },
  { name: "মোহাম্মদপুর", city: "ঢাকা", lat: 23.7662, lng: 90.3589 },
  { name: "মতিঝিল", city: "ঢাকা", lat: 23.733, lng: 90.4172 },
  { name: "বাড্ডা", city: "ঢাকা", lat: 23.7806, lng: 90.4265 },
  { name: "যাত্রাবাড়ী", city: "ঢাকা", lat: 23.7104, lng: 90.4349 },
  { name: "বসুন্ধরা", city: "ঢাকা", lat: 23.8193, lng: 90.4526 },
  { name: "লালবাগ", city: "ঢাকা", lat: 23.719, lng: 90.388 },
  { name: "শাহবাগ", city: "ঢাকা", lat: 23.7383, lng: 90.3958 },
  { name: "সাভার", city: "ঢাকা", lat: 23.8583, lng: 90.2667 },
  { name: "গাজীপুর", city: "গাজীপুর", lat: 23.9999, lng: 90.4203 },
  { name: "নারায়ণগঞ্জ", city: "নারায়ণগঞ্জ", lat: 23.6238, lng: 90.5 },
  { name: "আগ্রাবাদ", city: "চট্টগ্রাম", lat: 22.3245, lng: 91.8123 },
  { name: "পাঁচলাইশ", city: "চট্টগ্রাম", lat: 22.3667, lng: 91.8222 },
  { name: "জিন্দাবাজার", city: "সিলেট", lat: 24.8967, lng: 91.8711 },
  { name: "সাহেব বাজার", city: "রাজশাহী", lat: 24.3667, lng: 88.6 },
  { name: "সোনাডাঙ্গা", city: "খুলনা", lat: 22.8167, lng: 89.5333 },
  { name: "সদর রোড", city: "বরিশাল", lat: 22.701, lng: 90.3535 },
  { name: "জাহাজ কোম্পানি মোড়", city: "রংপুর", lat: 25.7468, lng: 89.2508 },
  { name: "গাঙ্গিনাপাড়", city: "ময়মনসিংহ", lat: 24.7539, lng: 90.4073 },
  { name: "কান্দিরপাড়", city: "কুমিল্লা", lat: 23.4607, lng: 91.1809 },
];

export const CITIES = Array.from(new Set(AREAS.map((a) => a.city)));
