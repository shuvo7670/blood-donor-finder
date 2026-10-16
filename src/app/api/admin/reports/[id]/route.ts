import type { NextRequest } from "next/server";
import { findReport, resolveReport } from "@/lib/server/admin";
import { audit } from "@/lib/server/audit";
import { requireStaff } from "@/lib/server/auth";
import { handle, HttpError, readJson } from "@/lib/server/http";

/** PATCH { action: "resolve" | "dismiss", note? } */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/reports/[id]">) {
  return handle(async () => {
    const staff = await requireStaff();
    const { id } = await ctx.params;
    const report = findReport(id);
    if (!report) throw new HttpError(404, "Report not found");
    const body = await readJson(request);
    if (body.action !== "resolve" && body.action !== "dismiss") throw new HttpError(400, "Unknown action");
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";
    resolveReport(id, body.action === "resolve" ? "resolved" : "dismissed", note, staff);
    audit(staff, `report.${body.action}`, report.targetType, report.targetId, note);
    return Response.json({ ok: true });
  });
}
