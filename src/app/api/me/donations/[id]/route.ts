import type { NextRequest } from "next/server";
import { requireDonorId } from "@/lib/server/auth";
import { deleteDonation, findDonor, listDonations, toDetail } from "@/lib/server/donors";
import { handle, HttpError } from "@/lib/server/http";

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/me/donations/[id]">) {
  return handle(async () => {
    const donorId = await requireDonorId();
    const { id } = await ctx.params;
    if (!deleteDonation(donorId, id)) throw new HttpError(404, "Donation not found");
    return Response.json({ donor: toDetail(findDonor(donorId)!), donations: listDonations(donorId) });
  });
}
