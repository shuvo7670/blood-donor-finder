import type { NextRequest } from "next/server";
import { isBloodGroup } from "@/lib/blood";
import { isLatLng } from "@/lib/geo";
import { startSession } from "@/lib/server/auth";
import { hashSecret } from "@/lib/server/crypto";
import { createDonor, findDonorRowByPhone, searchDonors, toDetail } from "@/lib/server/donors";
import { clientIp, handle, HttpError, rateLimit, readJson } from "@/lib/server/http";
import { getSettings } from "@/lib/server/settings";
import { validateDonor } from "@/lib/validate";

/**
 * GET /api/donors (approved donors only; phone numbers masked)
 *   lat, lng     search origin; results get distanceKm and are sorted nearest first
 *   radius       km around the origin (ignored without one)
 *   group        blood group, e.g. "B+" (URL-encode the +)
 *   compatible=1 with group: every donor group that group can receive from
 *   eligible=1   only donors who are available and past the donation gap
 *   q            text match on name, area or city
 *   limit        default 200
 */
export async function GET(request: NextRequest) {
  return handle(() => {
    const sp = request.nextUrl.searchParams;
    const lat = Number(sp.get("lat"));
    const lng = Number(sp.get("lng"));
    const group = sp.get("group");
    if (group && !isBloodGroup(group)) throw new HttpError(400, `Unknown blood group "${group}". Encode "+" as %2B.`);

    const results = searchDonors({
      origin: sp.has("lat") && sp.has("lng") && isLatLng(lat, lng) ? { lat, lng } : null,
      radiusKm: Number(sp.get("radius")) || 0,
      group: group as Parameters<typeof searchDonors>[0]["group"],
      compatible: sp.get("compatible") === "1",
      eligibleOnly: sp.get("eligible") === "1",
      q: sp.get("q")?.trim() ?? "",
    });
    const limit = Math.min(Number(sp.get("limit")) || 200, 500);
    return Response.json({ total: results.length, donors: results.slice(0, limit) });
  });
}

/** POST /api/donors: register. Waits for approval unless auto-approve is on; signs the donor in. */
export async function POST(request: Request) {
  return handle(async () => {
    rateLimit(`register:${clientIp(request)}`, 5, 60 * 60 * 1000);
    const parsed = validateDonor(await readJson(request));
    if (!parsed.ok) throw new HttpError(422, "Invalid donor", parsed.errors);

    const { pin, ...fields } = parsed.value;
    if (findDonorRowByPhone(fields.phone)) {
      throw new HttpError(409, "Duplicate phone", { phone: "এই নম্বর দিয়ে আগেই নিবন্ধন করা হয়েছে। লগইন করুন।" });
    }
    const status = getSettings().autoApproveDonors ? "approved" : "pending";
    const donor = createDonor(fields, hashSecret(pin), status);
    await startSession("donor", donor.id);
    return Response.json({ donor: toDetail(donor) }, { status: 201 });
  });
}
