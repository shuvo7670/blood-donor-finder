import { randomInt } from "node:crypto";
import type { NextRequest } from "next/server";
import { listReports } from "@/lib/server/admin";
import { audit, listAudit } from "@/lib/server/audit";
import { endAllSessions, requireStaff } from "@/lib/server/auth";
import { hashSecret } from "@/lib/server/crypto";
import { deleteDonor, findDonor, listDonations, setDonorPin, setDonorStatus, setDonorVerified, toDetail } from "@/lib/server/donors";
import { clearRateLimit, handle, HttpError, readJson } from "@/lib/server/http";

/** GET: one donor with donation history, reports against them and the moderation log. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/admin/donors/[id]">) {
  return handle(async () => {
    await requireStaff();
    const { id } = await ctx.params;
    const donor = findDonor(id);
    if (!donor) throw new HttpError(404, "Donor not found");
    return Response.json({
      donor: toDetail(donor),
      donations: listDonations(id),
      reports: listReports("all").filter((r) => r.targetType === "donor" && r.targetId === id),
      history: listAudit(500, "donor").filter((a) => a.targetId === id),
    });
  });
}

type Action = "approve" | "reject" | "suspend" | "reinstate" | "verify" | "unverify" | "reset_pin";

/** PATCH { action, reason? } */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/donors/[id]">) {
  return handle(async () => {
    const staff = await requireStaff();
    const { id } = await ctx.params;
    const donor = findDonor(id);
    if (!donor) throw new HttpError(404, "Donor not found");
    const body = await readJson(request);
    const action = body.action as Action;
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 300) : "";

    switch (action) {
      case "approve":
      case "reinstate":
        setDonorStatus(id, "approved", null);
        break;
      case "reject":
      case "suspend":
        if (!reason) throw new HttpError(422, "Reason required", { reason: "কারণ লিখুন — ডোনার এটি দেখতে পাবেন।" });
        setDonorStatus(id, action === "reject" ? "rejected" : "suspended", reason);
        break;
      case "verify":
      case "unverify":
        setDonorVerified(id, action === "verify");
        break;
      case "reset_pin": {
        // A forgotten PIN: staff confirm the caller over the phone, then read this one-time PIN out.
        const pin = String(randomInt(1000, 10000));
        setDonorPin(id, hashSecret(pin));
        endAllSessions("donor", id);
        clearRateLimit(`login-phone:${donor.phone}`); // lift a lockout from the forgotten-PIN guesses
        audit(staff, "donor.reset_pin", "donor", id, donor.name);
        return Response.json({ donor: toDetail(findDonor(id)!), pin });
      }
      default:
        throw new HttpError(400, "Unknown action");
    }
    audit(staff, `donor.${action}`, "donor", id, [donor.name, reason].filter(Boolean).join(" — "));
    return Response.json({ donor: toDetail(findDonor(id)!) });
  });
}

/** DELETE: admins only; removes the donor for good. */
export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/donors/[id]">) {
  return handle(async () => {
    const staff = await requireStaff("admin");
    const { id } = await ctx.params;
    const donor = findDonor(id);
    if (!donor) throw new HttpError(404, "Donor not found");
    deleteDonor(id);
    endAllSessions("donor", id);
    audit(staff, "donor.delete", "donor", id, `${donor.name} (${donor.phone})`);
    return Response.json({ ok: true });
  });
}
