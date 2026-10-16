import type { NextRequest } from "next/server";
import { findDonor, toPublic } from "@/lib/server/donors";
import { handle, HttpError } from "@/lib/server/http";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/donors/[id]">) {
  return handle(async () => {
    const { id } = await ctx.params;
    const donor = findDonor(id);
    if (!donor || donor.status !== "approved") throw new HttpError(404, "Donor not found");
    return Response.json({ donor: toPublic(donor, null) });
  });
}
