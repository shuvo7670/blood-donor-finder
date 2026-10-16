import { RECEIVES_FROM, type BloodGroup } from "@/lib/blood";
import { distanceKm } from "@/lib/geo";
import type { BloodRequest, Donor, LatLng, RequestResponse, RequestResult, RequestStatus, Urgency } from "@/lib/types";
import { randomToken, sha256, tokenMatches } from "./crypto";
import { all, get, insert, newId, nowIso, run } from "./sqlite";

type RequestRow = BloodRequest & { manageTokenHash: string; responseCount?: number };

const URGENCY_RANK: Record<Urgency, number> = { critical: 0, urgent: 1, normal: 2 };

function toResult(row: RequestRow, origin: LatLng | null): RequestResult {
  const { manageTokenHash: _hash, responseCount, ...rest } = row; // eslint-disable-line @typescript-eslint/no-unused-vars
  return { ...rest, responseCount: responseCount ?? 0, distanceKm: origin ? distanceKm(origin, row) : null };
}

const SELECT = `SELECT r.*, (SELECT COUNT(*) FROM responses x WHERE x.requestId = r.id) AS responseCount FROM requests r`;

function sortRequests(list: RequestResult[]) {
  const active = (s: RequestStatus) => (s === "pending" ? 0 : s === "open" ? 1 : 2);
  return list.sort(
    (a, b) =>
      active(a.status) - active(b.status) ||
      URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] ||
      a.neededBy.localeCompare(b.neededBy),
  );
}

/** Public list: only approved requests (open, or fulfilled when asked for "all"). */
export function listPublicRequests(opts: { status: "open" | "all"; group: BloodGroup | null; origin: LatLng | null }) {
  const statuses = opts.status === "open" ? ["open"] : ["open", "fulfilled"];
  const where = [`r.status IN (${statuses.map(() => "?").join(", ")})`];
  const params: string[] = [...statuses];
  if (opts.group) {
    where.push("r.bloodGroup = ?");
    params.push(opts.group);
  }
  return sortRequests(all<RequestRow>(`${SELECT} WHERE ${where.join(" AND ")}`, params).map((r) => toResult(r, opts.origin)));
}

export function listRequestsForAdmin(status: RequestStatus | "all") {
  const rows =
    status === "all"
      ? all<RequestRow>(`${SELECT} ORDER BY r.createdAt DESC LIMIT 300`)
      : all<RequestRow>(`${SELECT} WHERE r.status = ? ORDER BY r.createdAt DESC LIMIT 300`, [status]);
  return sortRequests(rows.map((r) => toResult(r, null)));
}

export function findRequest(id: string): RequestResult | null {
  const row = get<RequestRow>(`${SELECT} WHERE r.id = ?`, [id]);
  return row ? toResult(row, null) : null;
}

/** For the requester's private manage link. */
export function findRequestWithToken(id: string, token: string): RequestResult | null {
  const row = get<RequestRow>(`${SELECT} WHERE r.id = ?`, [id]);
  return row && tokenMatches(token, row.manageTokenHash) ? toResult(row, null) : null;
}

export type NewRequest = Omit<BloodRequest, "id" | "status" | "statusReason" | "createdAt" | "updatedAt">;

/** Returns the new request and its manage token (shown once, only its hash is stored). */
export function createRequest(input: NewRequest, status: RequestStatus) {
  const id = newId("r");
  const token = randomToken();
  const now = nowIso();
  insert("requests", { ...input, id, status, statusReason: null, manageTokenHash: sha256(token), createdAt: now, updatedAt: now });
  return { request: findRequest(id)!, token };
}

export function setRequestStatus(id: string, status: RequestStatus, reason: string | null = null) {
  run("UPDATE requests SET status = ?, statusReason = ?, updatedAt = ? WHERE id = ?", [status, reason, nowIso(), id]);
}

export function deleteRequest(id: string) {
  run("DELETE FROM requests WHERE id = ?", [id]);
}

export function listResponses(requestId: string): RequestResponse[] {
  return all<RequestResponse>("SELECT * FROM responses WHERE requestId = ? ORDER BY createdAt", [requestId]);
}

/** Returns false when this phone number already responded to the request. */
export function addResponse(input: Omit<RequestResponse, "id" | "createdAt">): boolean {
  const exists = get("SELECT 1 FROM responses WHERE requestId = ? AND phone = ?", [input.requestId, input.phone]);
  if (exists) return false;
  insert("responses", { ...input, id: newId("rs"), createdAt: nowIso() });
  return true;
}

/** Open requests this donor's blood can serve, nearest first. */
export function requestsForDonor(donor: Donor, radiusKm = 30): RequestResult[] {
  const groups = (Object.keys(RECEIVES_FROM) as BloodGroup[]).filter((g) => RECEIVES_FROM[g].includes(donor.bloodGroup));
  const rows = all<RequestRow>(`${SELECT} WHERE r.status = 'open' AND r.bloodGroup IN (${groups.map(() => "?").join(", ")})`, groups);
  return rows
    .map((r) => toResult(r, donor))
    .filter((r) => r.distanceKm! <= radiusKm)
    .sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || a.distanceKm! - b.distanceKm!);
}

export function respondedRequestIds(donorId: string): string[] {
  return all<{ requestId: string }>("SELECT requestId FROM responses WHERE donorId = ?", [donorId]).map((r) => r.requestId);
}
