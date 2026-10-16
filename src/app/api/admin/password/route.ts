import { findStaffRow, updateStaff } from "@/lib/server/admin";
import { audit } from "@/lib/server/audit";
import { endAllSessions, requireStaff, startSession } from "@/lib/server/auth";
import { hashSecret, verifySecret } from "@/lib/server/crypto";
import { handle, HttpError, readJson } from "@/lib/server/http";

/** POST { current, next }: change one's own password. Signs out every other device. */
export async function POST(request: Request) {
  return handle(async () => {
    const staff = await requireStaff(undefined, { allowPasswordChange: true });
    const body = await readJson(request);
    const row = findStaffRow({ id: staff.id })!;
    if (!verifySecret(String(body.current ?? ""), row.passwordHash)) {
      throw new HttpError(403, "বর্তমান পাসওয়ার্ড সঠিক নয়।", { current: "বর্তমান পাসওয়ার্ড সঠিক নয়।" });
    }
    const next = String(body.next ?? "");
    if (next.length < 8) throw new HttpError(422, "Weak password", { next: "কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড দিন।" });
    updateStaff(staff.id, { passwordHash: hashSecret(next), mustChangePassword: false });
    endAllSessions("staff", staff.id);
    await startSession("staff", staff.id);
    audit(staff, "password.change", "staff", staff.id);
    return Response.json({ ok: true });
  });
}
