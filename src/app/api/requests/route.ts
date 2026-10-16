import type { NextRequest } from "next/server";
import { isBloodGroup } from "@/lib/blood";
import { readDb, toRequestResult, updateDb } from "@/lib/db";
import { isLatLng } from "@/lib/geo";
import type { BloodRequest, LatLng, Urgency } from "@/lib/types";
import { validateRequest } from "@/lib/validate";

const URGENCY_RANK: Record<Urgency, number> = { critical: 0, urgent: 1, normal: 2 };

/**
 * GET /api/requests
 *   status   open (default) | fulfilled | all
 *   group    blood group
 *   lat, lng adds distanceKm to each request
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const status = sp.get("status") ?? "open";
  const group = sp.get("group");
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  const origin: LatLng | null = sp.has("lat") && sp.has("lng") && isLatLng(lat, lng) ? { lat, lng } : null;

  if (group && !isBloodGroup(group)) return Response.json({ error: "Unknown blood group" }, { status: 400 });

  const { requests } = await readDb();
  const results = requests
    .filter((r) => status === "all" || r.status === status)
    .filter((r) => !group || r.bloodGroup === group)
    .map((r) => toRequestResult(r, origin))
    .sort(
      (a, b) =>
        Number(a.status === "fulfilled") - Number(b.status === "fulfilled") ||
        URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] ||
        a.neededBy.localeCompare(b.neededBy),
    );

  return Response.json({ total: results.length, requests: results });
}

/** POST /api/requests: post a new blood request. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = validateRequest(body);
  if (!parsed.ok) return Response.json({ errors: parsed.errors }, { status: 422 });

  const created = await updateDb((db) => {
    const item: BloodRequest = {
      ...parsed.value,
      id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    db.requests.push(item);
    return item;
  });
  return Response.json({ request: created }, { status: 201 });
}
