export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export function isBloodGroup(value: unknown): value is BloodGroup {
  return typeof value === "string" && (BLOOD_GROUPS as readonly string[]).includes(value);
}

/** For each recipient group, the donor groups whose red cells it can safely receive. */
export const RECEIVES_FROM: Record<BloodGroup, BloodGroup[]> = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": [...BLOOD_GROUPS],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

export function donatesTo(donor: BloodGroup): BloodGroup[] {
  return BLOOD_GROUPS.filter((recipient) => RECEIVES_FROM[recipient].includes(donor));
}

/** Minimum gap between two whole-blood donations. */
export const DONATION_GAP_DAYS = 120;
export const MIN_AGE = 18;
export const MAX_AGE = 60;
export const MIN_WEIGHT_KG = 50;

const DAY_MS = 24 * 60 * 60 * 1000;

export function donationStatus(lastDonation: string | null, now = Date.now()) {
  if (!lastDonation) return { ready: true, daysSince: null, nextEligibleDate: null };
  const last = new Date(lastDonation).getTime();
  const daysSince = Math.floor((now - last) / DAY_MS);
  const next = new Date(last + DONATION_GAP_DAYS * DAY_MS);
  return {
    ready: daysSince >= DONATION_GAP_DAYS,
    daysSince,
    nextEligibleDate: daysSince >= DONATION_GAP_DAYS ? null : next.toISOString(),
  };
}
