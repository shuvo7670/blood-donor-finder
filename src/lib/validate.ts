import { isBloodGroup, MAX_AGE, MIN_AGE, MIN_WEIGHT_KG } from "./blood";
import { PHONE_RE, normalizePhone } from "./format";
import { isLatLng } from "./geo";
import type { BloodBank, BloodRequest, Donor, Urgency } from "./types";

type Result<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

const str = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const PIN_RE = /^\d{4,6}$/;

type DonorFields = Omit<Donor, "id" | "createdAt" | "updatedAt" | "verified" | "status" | "statusReason" | "contactViews">;

export function validateDonor(body: Record<string, unknown>): Result<DonorFields & { pin: string }> {
  const errors: Record<string, string> = {};
  const name = str(body.name, 60);
  const phone = normalizePhone(str(body.phone, 20));
  const age = Number(body.age);
  const weight = Number(body.weight);
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const lastDonation = str(body.lastDonation, 10) || null;
  const totalDonations = Math.max(0, Math.floor(Number(body.totalDonations) || 0));

  const pin = str(body.pin, 10);
  if (name.length < 3) errors.name = "পূর্ণ নাম লিখুন।";
  if (!PIN_RE.test(pin)) errors.pin = "৪–৬ সংখ্যার পিন দিন।";
  if (!PHONE_RE.test(phone)) errors.phone = "সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)।";
  if (!isBloodGroup(body.bloodGroup)) errors.bloodGroup = "রক্তের গ্রুপ বেছে নিন।";
  if (body.gender !== "male" && body.gender !== "female") errors.gender = "লিঙ্গ বেছে নিন।";
  if (!Number.isFinite(age) || age < MIN_AGE || age > MAX_AGE) errors.age = `বয়স ${MIN_AGE}–${MAX_AGE} বছরের মধ্যে হতে হবে।`;
  if (!Number.isFinite(weight) || weight < MIN_WEIGHT_KG || weight > 200) errors.weight = `ওজন কমপক্ষে ${MIN_WEIGHT_KG} কেজি হতে হবে।`;
  if (!str(body.area)) errors.area = "এলাকার নাম লিখুন।";
  if (!str(body.city)) errors.city = "শহর বেছে নিন।";
  if (!isLatLng(lat, lng)) errors.location = "ম্যাপে আপনার লোকেশন বেছে নিন।";
  if (lastDonation) {
    const t = new Date(lastDonation).getTime();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastDonation) || Number.isNaN(t) || t > Date.now())
      errors.lastDonation = "সঠিক তারিখ দিন।";
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      phone,
      bloodGroup: body.bloodGroup as Donor["bloodGroup"],
      gender: body.gender as Donor["gender"],
      age: Math.floor(age),
      weight: Math.round(weight),
      area: str(body.area, 60),
      city: str(body.city, 40),
      lat: +lat.toFixed(5),
      lng: +lng.toFixed(5),
      lastDonation,
      totalDonations: lastDonation ? Math.max(1, totalDonations) : totalDonations,
      available: body.available !== false,
      pin,
    },
  };
}

const URGENCIES: Urgency[] = ["critical", "urgent", "normal"];

export function validateRequest(
  body: Record<string, unknown>,
): Result<Omit<BloodRequest, "id" | "createdAt" | "updatedAt" | "status" | "statusReason">> {
  const errors: Record<string, string> = {};
  const phone = normalizePhone(str(body.phone, 20));
  const bags = Number(body.bags);
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const neededBy = new Date(str(body.neededBy, 40));

  if (str(body.patientName).length < 2) errors.patientName = "রোগীর নাম লিখুন।";
  if (!isBloodGroup(body.bloodGroup)) errors.bloodGroup = "রক্তের গ্রুপ বেছে নিন।";
  if (!Number.isInteger(bags) || bags < 1 || bags > 10) errors.bags = "১ থেকে ১০ ব্যাগ।";
  if (!str(body.hospital)) errors.hospital = "হাসপাতালের নাম লিখুন।";
  if (!str(body.area)) errors.area = "এলাকার নাম লিখুন।";
  if (!isLatLng(lat, lng)) errors.location = "ম্যাপে হাসপাতালের লোকেশন বেছে নিন।";
  if (Number.isNaN(neededBy.getTime())) errors.neededBy = "কখন লাগবে তা দিন।";
  if (!URGENCIES.includes(body.urgency as Urgency)) errors.urgency = "জরুরিতা বেছে নিন।";
  if (str(body.contactName).length < 2) errors.contactName = "যোগাযোগকারীর নাম লিখুন।";
  if (!PHONE_RE.test(phone)) errors.phone = "সঠিক মোবাইল নম্বর দিন।";
  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      patientName: str(body.patientName, 60),
      bloodGroup: body.bloodGroup as BloodRequest["bloodGroup"],
      bags,
      hospital: str(body.hospital),
      area: str(body.area, 60),
      city: str(body.city, 40),
      lat: +lat.toFixed(5),
      lng: +lng.toFixed(5),
      neededBy: neededBy.toISOString(),
      urgency: body.urgency as Urgency,
      contactName: str(body.contactName, 60),
      phone,
      note: str(body.note, 300),
    },
  };
}

/** Fields a donor may change on their own profile; each is optional. */
export function validateDonorPatch(body: Record<string, unknown>): Result<Partial<Pick<Donor, "name" | "age" | "weight" | "area" | "city" | "lat" | "lng" | "available">>> {
  const errors: Record<string, string> = {};
  const out: Partial<Pick<Donor, "name" | "age" | "weight" | "area" | "city" | "lat" | "lng" | "available">> = {};
  if ("name" in body) {
    const name = str(body.name, 60);
    if (name.length < 3) errors.name = "পূর্ণ নাম লিখুন।";
    else out.name = name;
  }
  if ("age" in body) {
    const age = Number(body.age);
    if (!Number.isFinite(age) || age < MIN_AGE || age > MAX_AGE) errors.age = `বয়স ${MIN_AGE}–${MAX_AGE} বছরের মধ্যে হতে হবে।`;
    else out.age = Math.floor(age);
  }
  if ("weight" in body) {
    const weight = Number(body.weight);
    if (!Number.isFinite(weight) || weight < MIN_WEIGHT_KG || weight > 200) errors.weight = `ওজন কমপক্ষে ${MIN_WEIGHT_KG} কেজি হতে হবে।`;
    else out.weight = Math.round(weight);
  }
  if ("area" in body) {
    if (!str(body.area)) errors.area = "এলাকার নাম লিখুন।";
    else out.area = str(body.area, 60);
  }
  if ("city" in body) {
    if (!str(body.city)) errors.city = "শহর লিখুন।";
    else out.city = str(body.city, 40);
  }
  if ("lat" in body || "lng" in body) {
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!isLatLng(lat, lng)) errors.location = "ম্যাপে লোকেশন বেছে নিন।";
    else Object.assign(out, { lat: +lat.toFixed(5), lng: +lng.toFixed(5) });
  }
  if ("available" in body) out.available = body.available === true;
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: out };
}

export function validateDate(value: unknown): string | null {
  const s = str(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const t = new Date(s).getTime();
  return Number.isNaN(t) || t > Date.now() ? null : s;
}

const BANK_KINDS: BloodBank["kind"][] = ["blood_bank", "hospital", "organization"];

export function validateBank(body: Record<string, unknown>): Result<Omit<BloodBank, "id" | "createdAt" | "updatedAt">> {
  const errors: Record<string, string> = {};
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const phone = normalizePhone(str(body.phone, 20));
  if (str(body.name).length < 3) errors.name = "নাম লিখুন।";
  if (!BANK_KINDS.includes(body.kind as BloodBank["kind"])) errors.kind = "ধরন বেছে নিন।";
  if (!str(body.area)) errors.area = "এলাকা লিখুন।";
  if (!str(body.city)) errors.city = "শহর লিখুন।";
  if (!isLatLng(lat, lng)) errors.location = "ম্যাপে লোকেশন বেছে নিন।";
  if (phone && !/^[0-9+]{5,15}$/.test(phone)) errors.phone = "সঠিক ফোন নম্বর দিন।";
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name: str(body.name),
      kind: body.kind as BloodBank["kind"],
      area: str(body.area, 60),
      city: str(body.city, 40),
      lat: +lat.toFixed(5),
      lng: +lng.toFixed(5),
      phone,
      hours: str(body.hours, 60),
      note: str(body.note, 300),
      active: body.active !== false,
    },
  };
}
