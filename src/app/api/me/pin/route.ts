import { requireDonorId } from "@/lib/server/auth";
import { hashSecret, verifySecret } from "@/lib/server/crypto";
import { setDonorPin } from "@/lib/server/donors";
import { handle, HttpError, rateLimit, readJson } from "@/lib/server/http";
import { get } from "@/lib/server/sqlite";
import { PIN_RE } from "@/lib/validate";

/** POST /api/me/pin { current, next } */
export async function POST(request: Request) {
  return handle(async () => {
    const id = await requireDonorId();
    rateLimit(`pin:${id}`, 8, 15 * 60 * 1000);
    const body = await readJson(request);
    const row = get<{ pinHash: string }>("SELECT pinHash FROM donors WHERE id = ?", [id])!;
    if (!verifySecret(String(body.current ?? ""), row.pinHash)) {
      throw new HttpError(403, "বর্তমান পিন সঠিক নয়।", { current: "বর্তমান পিন সঠিক নয়।" });
    }
    const next = String(body.next ?? "");
    if (!PIN_RE.test(next)) throw new HttpError(422, "Invalid PIN", { next: "৪–৬ সংখ্যার পিন দিন।" });
    setDonorPin(id, hashSecret(next));
    return Response.json({ ok: true });
  });
}
