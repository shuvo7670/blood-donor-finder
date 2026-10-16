import type { NextRequest } from "next/server";
import { isBloodGroup, type BloodGroup } from "@/lib/blood";
import { isLatLng } from "@/lib/geo";
import { currentDonorId } from "@/lib/server/auth";
import { findDonor } from "@/lib/server/donors";
import { clientIp, handle, HttpError, rateLimit, readJson } from "@/lib/server/http";
import { createRequest, listPublicRequests } from "@/lib/server/requests";
import { getSettings } from "@/lib/server/settings";
import { validateRequest } from "@/lib/validate";

/**
 * GET /api/requests (approved requests only)
 *   status   open (default) | all (open + fulfilled)
 *   group    blood group
 *   lat, lng adds distanceKm to each request
 */
export async function GET(request: NextRequest) {
  return handle(() => {
    const sp = request.nextUrl.searchParams;
    const group = sp.get("group");
    if (group && !isBloodGroup(group)) throw new HttpError(400, "Unknown blood group");
    const lat = Number(sp.get("lat"));
    const lng = Number(sp.get("lng"));
    const requests = listPublicRequests({
      status: sp.get("status") === "all" ? "all" : "open",
      group: (group as BloodGroup) || null,
      origin: sp.has("lat") && sp.has("lng") && isLatLng(lat, lng) ? { lat, lng } : null,
    });
    return Response.json({ total: requests.length, requests });
  });
}

/**
 * POST /api/requests: returns the request and a private manage URL (shown once).
 * Goes live at once when auto-approve is on or an approved donor posts it; otherwise it
 * waits in the moderators' queue.
 */
export async function POST(request: Request) {
  return handle(async () => {
    rateLimit(`request:${clientIp(request)}`, 10, 60 * 60 * 1000);
    const parsed = validateRequest(await readJson(request));
    if (!parsed.ok) throw new HttpError(422, "Invalid request", parsed.errors);

    const donorId = await currentDonorId();
    const trusted = donorId ? findDonor(donorId)?.status === "approved" : false;
    const status = trusted || getSettings().autoApproveRequests ? "open" : "pending";

    const { request: created, token } = createRequest(parsed.value, status);
    const manageUrl = `/requests/manage?${new URLSearchParams({ id: created.id, token })}`;
    return Response.json({ request: created, manageUrl }, { status: 201 });
  });
}
