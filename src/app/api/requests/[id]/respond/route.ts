import type { NextRequest } from "next/server";
import { normalizePhone, PHONE_RE } from "@/lib/format";
import { currentDonorId } from "@/lib/server/auth";
import { findDonor } from "@/lib/server/donors";
import { clientIp, handle, HttpError, rateLimit, readJson } from "@/lib/server/http";
import { addResponse, findRequest } from "@/lib/server/requests";

/**
 * POST /api/requests/:id/respond: "I can donate". A signed-in donor needs no body; anyone else
 * sends { name, phone, message }. The requester sees responses on their manage page.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/requests/[id]/respond">) {
  return handle(async () => {
    rateLimit(`respond:${clientIp(request)}`, 20, 60 * 60 * 1000);
    const { id } = await ctx.params;
    const target = findRequest(id);
    if (!target || target.status !== "open") throw new HttpError(404, "এই অনুরোধটি এখন খোলা নেই।");

    const body = await readJson(request);
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 300) : "";
    const donorId = await currentDonorId();
    const donor = donorId ? findDonor(donorId) : null;

    let name: string;
    let phone: string;
    if (donor) {
      if (donor.status !== "approved") throw new HttpError(403, "আপনার প্রোফাইল অনুমোদনের পর সাড়া দিতে পারবেন।");
      name = donor.name;
      phone = donor.phone;
    } else {
      name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
      phone = normalizePhone(typeof body.phone === "string" ? body.phone : "");
      const errors: Record<string, string> = {};
      if (name.length < 2) errors.name = "নাম লিখুন।";
      if (!PHONE_RE.test(phone)) errors.phone = "সঠিক মোবাইল নম্বর দিন।";
      if (Object.keys(errors).length) throw new HttpError(422, "Invalid response", errors);
    }

    const added = addResponse({
      requestId: id,
      donorId: donor?.id ?? null,
      name,
      phone,
      bloodGroup: donor?.bloodGroup ?? null,
      message,
    });
    if (!added) throw new HttpError(409, "আপনি আগেই এই অনুরোধে সাড়া দিয়েছেন।");
    return Response.json({ ok: true }, { status: 201 });
  });
}
