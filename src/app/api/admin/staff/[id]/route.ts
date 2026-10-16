import type { NextRequest } from "next/server";
import { activeAdminCount, findStaffRow, updateStaff } from "@/lib/server/admin";
import { audit } from "@/lib/server/audit";
import { endAllSessions, requireStaff, toStaff } from "@/lib/server/auth";
import { hashSecret } from "@/lib/server/crypto";
import { handle, HttpError, readJson } from "@/lib/server/http";

/** PATCH { role?, active?, password? }: admins only. A reset password must be changed at next login. */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/staff/[id]">) {
  return handle(async () => {
    const admin = await requireStaff("admin");
    const { id } = await ctx.params;
    const row = findStaffRow({ id });
    if (!row) throw new HttpError(404, "Staff not found");
    const body = await readJson(request);

    const demoting = body.role === "moderator" && row.role === "admin";
    const deactivating = body.active === false && row.active && row.role === "admin";
    if ((demoting || deactivating) && activeAdminCount() <= 1) {
      throw new HttpError(409, "অন্তত একজন সক্রিয় অ্যাডমিন থাকতে হবে।");
    }

    const changes: string[] = [];
    if (body.role === "admin" || body.role === "moderator") {
      updateStaff(id, { role: body.role });
      changes.push(`role=${body.role}`);
    }
    if (typeof body.active === "boolean") {
      updateStaff(id, { active: body.active });
      if (!body.active) endAllSessions("staff", id);
      changes.push(body.active ? "activated" : "deactivated");
    }
    if (typeof body.password === "string") {
      if (body.password.length < 8) throw new HttpError(422, "Weak password", { password: "কমপক্ষে ৮ অক্ষর।" });
      updateStaff(id, { passwordHash: hashSecret(body.password), mustChangePassword: true });
      endAllSessions("staff", id);
      changes.push("password reset");
    }
    audit(admin, "staff.update", "staff", id, `${row.name}: ${changes.join(", ")}`);
    return Response.json({ staff: toStaff(findStaffRow({ id })!) });
  });
}
