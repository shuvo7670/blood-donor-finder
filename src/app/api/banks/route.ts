import type { NextRequest } from "next/server";
import { isLatLng } from "@/lib/geo";
import { listBanks } from "@/lib/server/admin";
import { handle } from "@/lib/server/http";

/** GET /api/banks?lat&lng : active blood banks, nearest first when a point is given. */
export async function GET(request: NextRequest) {
  return handle(() => {
    const sp = request.nextUrl.searchParams;
    const lat = Number(sp.get("lat"));
    const lng = Number(sp.get("lng"));
    const origin = sp.has("lat") && sp.has("lng") && isLatLng(lat, lng) ? { lat, lng } : null;
    return Response.json({ banks: listBanks({ origin }) });
  });
}
