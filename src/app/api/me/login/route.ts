import { normalizePhone } from "@/lib/format";
import { startSession } from "@/lib/server/auth";
import { verifySecret } from "@/lib/server/crypto";
import { findDonorRowByPhone } from "@/lib/server/donors";
import { clientIp, handle, HttpError, rateLimit, readJson } from "@/lib/server/http";

/** POST /api/me/login { phone, pin } */
export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    const phone = normalizePhone(String(body.phone ?? ""));
    // Per IP and per phone, so a 4-digit PIN can't be brute-forced from many addresses either.
    rateLimit(`login:${clientIp(request)}`, 20, 15 * 60 * 1000);
    rateLimit(`login-phone:${phone}`, 8, 15 * 60 * 1000, "এই নম্বরে অনেকবার ভুল পিন দেওয়া হয়েছে। ১৫ মিনিট পরে চেষ্টা করুন।");

    const row = findDonorRowByPhone(phone);
    if (!row || !verifySecret(String(body.pin ?? ""), row.pinHash)) {
      throw new HttpError(401, "মোবাইল নম্বর বা পিন সঠিক নয়।");
    }
    await startSession("donor", row.id);
    return Response.json({ ok: true });
  });
}
