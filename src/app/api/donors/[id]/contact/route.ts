import type { NextRequest } from "next/server";
import { findDonor, recordContactView } from "@/lib/server/donors";
import { clientIp, handle, HttpError, rateLimit } from "@/lib/server/http";

/**
 * POST /api/donors/:id/contact: reveals one donor's phone number. Lists only carry a masked
 * number, so harvesting every number needs one call each, and this is rate limited per IP.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/donors/[id]/contact">) {
  return handle(async () => {
    rateLimit(
      `contact:${clientIp(request)}`,
      30,
      60 * 60 * 1000,
      "এক ঘণ্টায় অনেক নম্বর দেখা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
    );
    const { id } = await ctx.params;
    const donor = findDonor(id);
    if (!donor || donor.status !== "approved") throw new HttpError(404, "Donor not found");
    recordContactView(id);
    return Response.json({ phone: donor.phone });
  });
}
