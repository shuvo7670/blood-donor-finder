import { endSession, requireStaff, startSession, toStaff } from "@/lib/server/auth";
import { findStaffRow, overviewCounts, touchStaffLogin } from "@/lib/server/admin";
import { audit } from "@/lib/server/audit";
import { verifySecret } from "@/lib/server/crypto";
import { clientIp, handle, HttpError, rateLimit, readJson } from "@/lib/server/http";

/** GET: who is signed in, plus the queue counts for the sidebar badges. */
export async function GET() {
  return handle(async () => {
    const staff = await requireStaff(undefined, { allowPasswordChange: true });
    const { pendingDonors, pendingRequests, openReports } = overviewCounts();
    return Response.json({ staff, queue: { pendingDonors, pendingRequests, openReports } });
  });
}

/** POST { username, password }: sign in. */
export async function POST(request: Request) {
  return handle(async () => {
    rateLimit(`staff-login:${clientIp(request)}`, 10, 15 * 60 * 1000);
    const body = await readJson(request);
    const row = findStaffRow({ username: String(body.username ?? "").trim() });
    if (!row || !row.active || !verifySecret(String(body.password ?? ""), row.passwordHash)) {
      throw new HttpError(401, "ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।");
    }
    await startSession("staff", row.id);
    touchStaffLogin(row.id);
    audit(row, "login", "staff", row.id);
    return Response.json({ staff: toStaff(row) });
  });
}

/** DELETE: sign out. */
export async function DELETE() {
  return handle(async () => {
    await endSession("staff");
    return Response.json({ ok: true });
  });
}
