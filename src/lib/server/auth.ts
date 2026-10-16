import { cookies } from "next/headers";
import type { Donor, Staff, StaffRole } from "@/lib/types";
import { randomToken, sha256 } from "./crypto";
import { HttpError } from "./http";
import { get, insert, nowIso, run } from "./sqlite";

type Kind = "staff" | "donor";

const COOKIE: Record<Kind, string> = { staff: "rb_staff", donor: "rb_donor" };
const DAYS: Record<Kind, number> = { staff: 1, donor: 60 };

export async function startSession(kind: Kind, subjectId: string) {
  const token = randomToken();
  const maxAge = DAYS[kind] * 24 * 60 * 60;
  run("DELETE FROM sessions WHERE expiresAt < ?", [nowIso()]);
  insert("sessions", {
    tokenHash: sha256(token),
    kind,
    subjectId,
    expiresAt: new Date(Date.now() + maxAge * 1000).toISOString(),
    createdAt: nowIso(),
  });
  (await cookies()).set(COOKIE[kind], token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function endSession(kind: Kind) {
  const jar = await cookies();
  const token = jar.get(COOKIE[kind])?.value;
  if (token) run("DELETE FROM sessions WHERE tokenHash = ?", [sha256(token)]);
  jar.delete(COOKIE[kind]);
}

/** Ends every session of one subject, e.g. after a password change or deactivation. */
export function endAllSessions(kind: Kind, subjectId: string) {
  run("DELETE FROM sessions WHERE kind = ? AND subjectId = ?", [kind, subjectId]);
}

async function sessionSubject(kind: Kind): Promise<string | null> {
  const token = (await cookies()).get(COOKIE[kind])?.value;
  if (!token) return null;
  const row = get<{ subjectId: string }>(
    "SELECT subjectId FROM sessions WHERE tokenHash = ? AND kind = ? AND expiresAt > ?",
    [sha256(token), kind, nowIso()],
  );
  return row?.subjectId ?? null;
}

export type StaffRow = Omit<Staff, "active" | "mustChangePassword"> & {
  active: number;
  mustChangePassword: number;
  passwordHash: string;
};

export function toStaff(row: StaffRow): Staff {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role,
    active: !!row.active,
    mustChangePassword: !!row.mustChangePassword,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
  };
}

export async function currentStaff(): Promise<Staff | null> {
  const id = await sessionSubject("staff");
  if (!id) return null;
  const row = get<StaffRow>("SELECT * FROM staff WHERE id = ? AND active = 1", [id]);
  return row ? toStaff(row) : null;
}

/**
 * The signed-in staff member, or a 401/403. Pass "admin" for admin-only actions. Someone who
 * must change their password can do nothing else until they have (`allowPasswordChange`).
 */
export async function requireStaff(role?: StaffRole, { allowPasswordChange = false } = {}): Promise<Staff> {
  const staff = await currentStaff();
  if (!staff) throw new HttpError(401, "লগইন করুন।");
  if (staff.mustChangePassword && !allowPasswordChange) throw new HttpError(403, "আগে পাসওয়ার্ড পরিবর্তন করুন।");
  if (role === "admin" && staff.role !== "admin") throw new HttpError(403, "শুধু অ্যাডমিন এটি করতে পারেন।");
  return staff;
}

export async function currentDonorId(): Promise<string | null> {
  const id = await sessionSubject("donor");
  if (!id) return null;
  return get<Pick<Donor, "id">>("SELECT id FROM donors WHERE id = ?", [id])?.id ?? null;
}

export async function requireDonorId(): Promise<string> {
  const id = await currentDonorId();
  if (!id) throw new HttpError(401, "লগইন করুন।");
  return id;
}
