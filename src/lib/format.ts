const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function bn(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function formatDistance(km: number | null): string {
  if (km === null) return "";
  if (km < 1) return `${bn(Math.round(km * 1000))} মিটার`;
  return `${bn(km < 10 ? km.toFixed(1) : Math.round(km))} কিমি`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** "৩ ঘণ্টা পর" / "২ দিন আগে" relative to now. */
export function relativeTime(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  const abs = Math.abs(diff);
  const suffix = diff >= 0 ? "পর" : "আগে";
  if (abs < HOUR) return `${bn(Math.max(1, Math.round(abs / 60000)))} মিনিট ${suffix}`;
  if (abs < DAY) return `${bn(Math.round(abs / HOUR))} ঘণ্টা ${suffix}`;
  return `${bn(Math.round(abs / DAY))} দিন ${suffix}`;
}

export function isPast(iso: string, now = Date.now()): boolean {
  return new Date(iso).getTime() < now;
}

/** "01712345678" -> "8801712345678", for wa.me links. */
export function internationalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `88${digits}`;
  return digits;
}

export const PHONE_RE = /^(?:\+?88)?01[3-9]\d{8}$/;

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[\s-]/g, "");
  return digits.replace(/^\+?88/, "");
}

export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
