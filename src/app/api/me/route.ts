import { endAllSessions, endSession, requireDonorId } from "@/lib/server/auth";
import { verifySecret } from "@/lib/server/crypto";
import { deleteDonor, findDonor, listDonations, toDetail, updateDonor } from "@/lib/server/donors";
import { handle, HttpError, readJson } from "@/lib/server/http";
import { requestsForDonor, respondedRequestIds } from "@/lib/server/requests";
import { get } from "@/lib/server/sqlite";
import { validateDonorPatch } from "@/lib/validate";

/** GET /api/me: the signed-in donor's profile, donation history and requests they can help. */
export async function GET() {
  return handle(async () => {
    const id = await requireDonorId();
    const donor = findDonor(id)!;
    return Response.json({
      donor: toDetail(donor),
      donations: listDonations(id),
      nearbyRequests: donor.status === "approved" ? requestsForDonor(donor) : [],
      respondedRequestIds: respondedRequestIds(id),
    });
  });
}

/** PATCH /api/me: change own profile fields (name, age, weight, area, city, lat/lng, available). */
export async function PATCH(request: Request) {
  return handle(async () => {
    const id = await requireDonorId();
    const parsed = validateDonorPatch(await readJson(request));
    if (!parsed.ok) throw new HttpError(422, "Invalid profile", parsed.errors);
    updateDonor(id, parsed.value);
    return Response.json({ donor: toDetail(findDonor(id)!) });
  });
}

/** DELETE /api/me { pin }: removes the donor and everything tied to them. */
export async function DELETE(request: Request) {
  return handle(async () => {
    const id = await requireDonorId();
    const body = await readJson(request);
    const row = get<{ pinHash: string }>("SELECT pinHash FROM donors WHERE id = ?", [id])!;
    if (!verifySecret(String(body.pin ?? ""), row.pinHash)) throw new HttpError(403, "পিন সঠিক নয়।", { pin: "পিন সঠিক নয়।" });
    deleteDonor(id);
    endAllSessions("donor", id);
    await endSession("donor");
    return Response.json({ ok: true });
  });
}
