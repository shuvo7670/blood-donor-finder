import type { NextRequest } from "next/server";
import { isBloodGroup, RECEIVES_FROM } from "@/lib/blood";
import { readDb, toDonorResult, updateDb } from "@/lib/db";
import { isLatLng } from "@/lib/geo";
import type { Donor, LatLng } from "@/lib/types";
import { validateDonor } from "@/lib/validate";

/**
 * GET /api/donors
 *   lat, lng     search origin; results get distanceKm and are sorted nearest first
 *   radius       km around the origin (ignored without one)
 *   group        blood group, e.g. "B+" (URL-encode the +)
 *   compatible=1 with group: every donor group that group can receive from
 *   eligible=1   only donors who are available and past the donation gap
 *   q            text match on name, area or city
 *   limit        default 200
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  const origin: LatLng | null = sp.has("lat") && sp.has("lng") && isLatLng(lat, lng) ? { lat, lng } : null;
  const radius = Number(sp.get("radius"));
  const group = sp.get("group");
  const q = sp.get("q")?.trim().toLowerCase();
  const limit = Math.min(Number(sp.get("limit")) || 200, 500);

  if (group && !isBloodGroup(group)) {
    return Response.json({ error: `Unknown blood group "${group}". Encode "+" as %2B.` }, { status: 400 });
  }
  const groups = group
    ? new Set(sp.get("compatible") === "1" ? RECEIVES_FROM[group as Donor["bloodGroup"]] : [group])
    : null;

  const { donors } = await readDb();
  let results = donors
    .filter((d) => !groups || groups.has(d.bloodGroup))
    .filter((d) => !q || `${d.name} ${d.area} ${d.city}`.toLowerCase().includes(q))
    .map((d) => toDonorResult(d, origin));

  if (sp.get("eligible") === "1") results = results.filter((d) => d.eligible);
  if (origin && radius > 0) results = results.filter((d) => d.distanceKm! <= radius);

  results.sort((a, b) =>
    origin ? a.distanceKm! - b.distanceKm! : Number(b.eligible) - Number(a.eligible) || a.name.localeCompare(b.name),
  );

  return Response.json({ total: results.length, donors: results.slice(0, limit) });
}

/** POST /api/donors: register a new donor. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = validateDonor(body);
  if (!parsed.ok) return Response.json({ errors: parsed.errors }, { status: 422 });

  const result = await updateDb((db) => {
    if (db.donors.some((d) => d.phone === parsed.value.phone)) return null;
    const donor: Donor = {
      ...parsed.value,
      id: `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      verified: false,
      createdAt: new Date().toISOString(),
    };
    db.donors.push(donor);
    return donor;
  });

  if (!result) {
    return Response.json({ errors: { phone: "এই নম্বর দিয়ে আগেই নিবন্ধন করা হয়েছে।" } }, { status: 409 });
  }
  return Response.json({ donor: toDonorResult(result, null) }, { status: 201 });
}
