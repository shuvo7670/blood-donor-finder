import { donationStatus, RECEIVES_FROM, type BloodGroup } from "@/lib/blood";
import { distanceKm } from "@/lib/geo";
import type { Donation, Donor, DonorDetail, DonorStatus, LatLng, PublicDonor } from "@/lib/types";
import { all, get, insert, newId, nowIso, run, tx } from "./sqlite";

type DonorRow = Omit<Donor, "available" | "verified"> & { available: number; verified: number; pinHash: string };

export function toDonor(row: DonorRow): Donor {
  const { pinHash: _pinHash, ...rest } = row; // eslint-disable-line @typescript-eslint/no-unused-vars
  return { ...rest, available: !!row.available, verified: !!row.verified };
}

export function toDetail(donor: Donor): DonorDetail {
  const s = donationStatus(donor.lastDonation);
  return {
    ...donor,
    eligible: donor.available && s.ready,
    daysSinceDonation: s.daysSince,
    nextEligibleDate: s.nextEligibleDate,
  };
}

export const maskPhone = (phone: string) => `${phone.slice(0, 3)}•••••${phone.slice(-3)}`;

export function toPublic(donor: Donor, origin: LatLng | null): PublicDonor {
  const { phone, status: _s, statusReason: _r, contactViews: _c, updatedAt: _u, ...rest } = toDetail(donor); // eslint-disable-line @typescript-eslint/no-unused-vars
  return { ...rest, phoneMasked: maskPhone(phone), distanceKm: origin ? distanceKm(origin, donor) : null };
}

export function findDonor(id: string): Donor | null {
  const row = get<DonorRow>("SELECT * FROM donors WHERE id = ?", [id]);
  return row ? toDonor(row) : null;
}

export function findDonorRowByPhone(phone: string): DonorRow | undefined {
  return get<DonorRow>("SELECT * FROM donors WHERE phone = ?", [phone]);
}

export interface DonorSearch {
  origin: LatLng | null;
  radiusKm: number;
  group: BloodGroup | null;
  compatible: boolean;
  eligibleOnly: boolean;
  q: string;
}

/** Approved donors only: nobody else is ever shown publicly. */
export function searchDonors(s: DonorSearch): PublicDonor[] {
  const groups = s.group ? (s.compatible ? RECEIVES_FROM[s.group] : [s.group]) : null;
  const where = ["status = 'approved'"];
  const params: string[] = [];
  if (groups) {
    where.push(`bloodGroup IN (${groups.map(() => "?").join(", ")})`);
    params.push(...groups);
  }
  if (s.q) {
    where.push("(name LIKE ? OR area LIKE ? OR city LIKE ?)");
    params.push(`%${s.q}%`, `%${s.q}%`, `%${s.q}%`);
  }
  let results = all<DonorRow>(`SELECT * FROM donors WHERE ${where.join(" AND ")}`, params).map((r) =>
    toPublic(toDonor(r), s.origin),
  );
  if (s.eligibleOnly) results = results.filter((d) => d.eligible);
  if (s.origin && s.radiusKm > 0) results = results.filter((d) => d.distanceKm! <= s.radiusKm);
  return results.sort((a, b) =>
    s.origin ? a.distanceKm! - b.distanceKm! : Number(b.eligible) - Number(a.eligible) || a.name.localeCompare(b.name),
  );
}

export type NewDonor = Omit<Donor, "id" | "createdAt" | "updatedAt" | "verified" | "status" | "statusReason" | "contactViews">;

export function createDonor(input: NewDonor, pinHash: string, status: DonorStatus): Donor {
  const id = newId("d");
  const now = nowIso();
  tx(() => {
    insert("donors", {
      ...input,
      id,
      available: input.available ? 1 : 0,
      verified: 0,
      status,
      statusReason: null,
      pinHash,
      contactViews: 0,
      createdAt: now,
      updatedAt: now,
    });
    if (input.lastDonation) {
      insert("donations", { id: newId("dn"), donorId: id, date: input.lastDonation, place: "", note: "", createdAt: now });
    }
  });
  return findDonor(id)!;
}

const SELF_EDITABLE = ["name", "age", "weight", "area", "city", "lat", "lng", "available"] as const;
export type DonorSelfPatch = Partial<Pick<Donor, (typeof SELF_EDITABLE)[number]>>;

export function updateDonor(id: string, patch: DonorSelfPatch) {
  const entries = Object.entries(patch).filter(([k, v]) => (SELF_EDITABLE as readonly string[]).includes(k) && v !== undefined);
  if (!entries.length) return;
  const sets = entries.map(([k]) => `${k} = :${k}`).join(", ");
  const values = Object.fromEntries(entries.map(([k, v]) => [k, typeof v === "boolean" ? (v ? 1 : 0) : (v as string | number)]));
  run(`UPDATE donors SET ${sets}, updatedAt = :updatedAt WHERE id = :id`, { ...values, updatedAt: nowIso(), id });
}

export function setDonorPin(id: string, pinHash: string) {
  run("UPDATE donors SET pinHash = ?, updatedAt = ? WHERE id = ?", [pinHash, nowIso(), id]);
}

export function setDonorStatus(id: string, status: DonorStatus, reason: string | null) {
  run("UPDATE donors SET status = ?, statusReason = ?, updatedAt = ? WHERE id = ?", [status, reason, nowIso(), id]);
}

export function setDonorVerified(id: string, verified: boolean) {
  run("UPDATE donors SET verified = ?, updatedAt = ? WHERE id = ?", [verified ? 1 : 0, nowIso(), id]);
}

export function deleteDonor(id: string) {
  run("DELETE FROM donors WHERE id = ?", [id]);
}

export function recordContactView(id: string) {
  run("UPDATE donors SET contactViews = contactViews + 1 WHERE id = ?", [id]);
}

export function listDonations(donorId: string): Donation[] {
  return all<Donation>("SELECT * FROM donations WHERE donorId = ? ORDER BY date DESC, createdAt DESC", [donorId]);
}

/** Logs a donation and moves lastDonation / totalDonations along with it. */
export function addDonation(donorId: string, date: string, place: string, note: string): Donation {
  const id = newId("dn");
  tx(() => {
    insert("donations", { id, donorId, date, place, note, createdAt: nowIso() });
    syncDonationTotals(donorId);
  });
  return get<Donation>("SELECT * FROM donations WHERE id = ?", [id])!;
}

export function deleteDonation(donorId: string, donationId: string): boolean {
  return tx(() => {
    const result = run("DELETE FROM donations WHERE id = ? AND donorId = ?", [donationId, donorId]);
    if (result.changes) syncDonationTotals(donorId);
    return result.changes > 0;
  });
}

function syncDonationTotals(donorId: string) {
  run(
    `UPDATE donors SET
       lastDonation = (SELECT MAX(date) FROM donations WHERE donorId = :id),
       totalDonations = MAX(totalDonations, (SELECT COUNT(*) FROM donations WHERE donorId = :id)),
       updatedAt = :now
     WHERE id = :id`,
    { id: donorId, now: nowIso() },
  );
}

export function listDonorsForAdmin(status: DonorStatus | "all", q: string, limit = 300): DonorDetail[] {
  const where: string[] = [];
  const params: string[] = [];
  if (status !== "all") {
    where.push("status = ?");
    params.push(status);
  }
  if (q) {
    where.push("(name LIKE ? OR phone LIKE ? OR area LIKE ? OR city LIKE ? OR bloodGroup = ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, q.toUpperCase());
  }
  const sql = `SELECT * FROM donors ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
               ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, createdAt DESC LIMIT ${limit}`;
  return all<DonorRow>(sql, params).map((r) => toDetail(toDonor(r)));
}
