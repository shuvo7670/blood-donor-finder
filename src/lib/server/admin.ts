import { distanceKm } from "@/lib/geo";
import type { BloodBank, BloodBankResult, LatLng, Report, Staff, StaffRole } from "@/lib/types";
import { toStaff, type StaffRow } from "./auth";
import { all, get, insert, newId, nowIso, run } from "./sqlite";

// ---------------------------------------------------------------- reports

export function createReport(input: Pick<Report, "targetType" | "targetId" | "reason" | "details" | "reporterPhone">) {
  insert("reports", { ...input, id: newId("rp"), status: "open", createdAt: nowIso() });
}

export function listReports(status: Report["status"] | "all"): Report[] {
  const sql = `
    SELECT p.*, COALESCE(d.name || ' (' || d.bloodGroup || ')', q.hospital || ' — ' || q.bloodGroup) AS targetLabel
    FROM reports p
    LEFT JOIN donors d ON p.targetType = 'donor' AND d.id = p.targetId
    LEFT JOIN requests q ON p.targetType = 'request' AND q.id = p.targetId
    ${status === "all" ? "" : "WHERE p.status = ?"}
    ORDER BY CASE p.status WHEN 'open' THEN 0 ELSE 1 END, p.createdAt DESC LIMIT 300`;
  return all<Report>(sql, status === "all" ? [] : [status]);
}

export function findReport(id: string): Report | null {
  return get<Report>("SELECT * FROM reports WHERE id = ?", [id]) ?? null;
}

export function resolveReport(id: string, status: "resolved" | "dismissed", note: string, staff: Staff) {
  run("UPDATE reports SET status = ?, resolutionNote = ?, resolvedBy = ?, resolvedAt = ? WHERE id = ?", [
    status,
    note,
    staff.name,
    nowIso(),
    id,
  ]);
}

export function openReportCount(targetType: Report["targetType"], targetId: string): number {
  return get<{ n: number }>("SELECT COUNT(*) AS n FROM reports WHERE targetType = ? AND targetId = ? AND status = 'open'", [
    targetType,
    targetId,
  ])!.n;
}

// ---------------------------------------------------------------- blood banks

type BankRow = Omit<BloodBank, "active"> & { active: number };
const toBank = (r: BankRow): BloodBank => ({ ...r, active: !!r.active });

export function listBanks(opts: { includeInactive?: boolean; origin?: LatLng | null } = {}): BloodBankResult[] {
  const rows = all<BankRow>(`SELECT * FROM bloodBanks ${opts.includeInactive ? "" : "WHERE active = 1"} ORDER BY city, name`);
  const list = rows.map((r) => ({ ...toBank(r), distanceKm: opts.origin ? distanceKm(opts.origin, r) : null }));
  return opts.origin ? list.sort((a, b) => a.distanceKm! - b.distanceKm!) : list;
}

export type BankInput = Omit<BloodBank, "id" | "createdAt" | "updatedAt">;

export function createBank(input: BankInput): BloodBank {
  const id = newId("bb");
  const now = nowIso();
  insert("bloodBanks", { ...input, active: input.active ? 1 : 0, id, createdAt: now, updatedAt: now });
  return findBank(id)!;
}

export function updateBank(id: string, input: BankInput) {
  run(
    `UPDATE bloodBanks SET name = :name, kind = :kind, area = :area, city = :city, lat = :lat, lng = :lng,
       phone = :phone, hours = :hours, note = :note, active = :active, updatedAt = :updatedAt WHERE id = :id`,
    { ...input, active: input.active ? 1 : 0, updatedAt: nowIso(), id },
  );
}

export function findBank(id: string): BloodBank | null {
  const row = get<BankRow>("SELECT * FROM bloodBanks WHERE id = ?", [id]);
  return row ? toBank(row) : null;
}

export function deleteBank(id: string) {
  run("DELETE FROM bloodBanks WHERE id = ?", [id]);
}

// ---------------------------------------------------------------- staff

export function listStaff(): Staff[] {
  return all<StaffRow>("SELECT * FROM staff ORDER BY createdAt").map(toStaff);
}

export function findStaffRow(where: { id?: string; username?: string }): StaffRow | undefined {
  return where.id
    ? get<StaffRow>("SELECT * FROM staff WHERE id = ?", [where.id])
    : get<StaffRow>("SELECT * FROM staff WHERE username = ?", [where.username ?? ""]);
}

export function createStaff(input: { name: string; username: string; role: StaffRole; passwordHash: string }): Staff {
  const id = newId("s");
  insert("staff", { ...input, id, active: 1, mustChangePassword: 1, createdAt: nowIso() });
  return toStaff(findStaffRow({ id })!);
}

export function updateStaff(id: string, patch: { role?: StaffRole; active?: boolean; passwordHash?: string; mustChangePassword?: boolean }) {
  if (patch.role) run("UPDATE staff SET role = ? WHERE id = ?", [patch.role, id]);
  if (patch.active !== undefined) run("UPDATE staff SET active = ? WHERE id = ?", [patch.active ? 1 : 0, id]);
  if (patch.passwordHash) run("UPDATE staff SET passwordHash = ? WHERE id = ?", [patch.passwordHash, id]);
  if (patch.mustChangePassword !== undefined)
    run("UPDATE staff SET mustChangePassword = ? WHERE id = ?", [patch.mustChangePassword ? 1 : 0, id]);
}

export function activeAdminCount(): number {
  return get<{ n: number }>("SELECT COUNT(*) AS n FROM staff WHERE role = 'admin' AND active = 1")!.n;
}

export function touchStaffLogin(id: string) {
  run("UPDATE staff SET lastLoginAt = ? WHERE id = ?", [nowIso(), id]);
}

// ---------------------------------------------------------------- overview

export function overviewCounts() {
  const count = (sql: string) => get<{ n: number }>(sql)!.n;
  return {
    pendingDonors: count("SELECT COUNT(*) AS n FROM donors WHERE status = 'pending'"),
    pendingRequests: count("SELECT COUNT(*) AS n FROM requests WHERE status = 'pending'"),
    openReports: count("SELECT COUNT(*) AS n FROM reports WHERE status = 'open'"),
    approvedDonors: count("SELECT COUNT(*) AS n FROM donors WHERE status = 'approved'"),
    suspendedDonors: count("SELECT COUNT(*) AS n FROM donors WHERE status = 'suspended'"),
    openRequests: count("SELECT COUNT(*) AS n FROM requests WHERE status = 'open'"),
    fulfilledRequests: count("SELECT COUNT(*) AS n FROM requests WHERE status = 'fulfilled'"),
    responses: count("SELECT COUNT(*) AS n FROM responses"),
    donationsLast30: count(`SELECT COUNT(*) AS n FROM donations WHERE date >= date('now', '-30 day')`),
    newDonorsLast7: count(`SELECT COUNT(*) AS n FROM donors WHERE createdAt >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 day')`),
    contactViews: count("SELECT COALESCE(SUM(contactViews), 0) AS n FROM donors"),
  };
}
