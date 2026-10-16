import type { NextRequest } from "next/server";
import { listReports } from "@/lib/server/admin";
import { audit, listAudit } from "@/lib/server/audit";
import { requireStaff } from "@/lib/server/auth";
import { handle, HttpError, readJson } from "@/lib/server/http";
import { deleteRequest, findRequest, listResponses, setRequestStatus } from "@/lib/server/requests";
import type { RequestStatus } from "@/lib/types";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/admin/requests/[id]">) {
  return handle(async () => {
    await requireStaff();
    const { id } = await ctx.params;
    const found = findRequest(id);
    if (!found) throw new HttpError(404, "Request not found");
    return Response.json({
      request: found,
      responses: listResponses(id),
      reports: listReports("all").filter((r) => r.targetType === "request" && r.targetId === id),
      history: listAudit(500, "request").filter((a) => a.targetId === id),
    });
  });
}

const ACTIONS: Record<string, RequestStatus> = {
  approve: "open",
  reject: "rejected",
  fulfil: "fulfilled",
  close: "closed",
  reopen: "open",
};

/** PATCH { action: approve | reject | fulfil | close | reopen, reason? } */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/requests/[id]">) {
  return handle(async () => {
    const staff = await requireStaff();
    const { id } = await ctx.params;
    const found = findRequest(id);
    if (!found) throw new HttpError(404, "Request not found");
    const body = await readJson(request);
    const action = String(body.action);
    const status = ACTIONS[action];
    if (!status) throw new HttpError(400, "Unknown action");
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 300) : "";
    if (action === "reject" && !reason) throw new HttpError(422, "Reason required", { reason: "বাতিলের কারণ লিখুন।" });

    setRequestStatus(id, status, reason || null);
    audit(staff, `request.${action}`, "request", id, [`${found.bloodGroup} · ${found.hospital}`, reason].filter(Boolean).join(" — "));
    return Response.json({ request: findRequest(id) });
  });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/requests/[id]">) {
  return handle(async () => {
    const staff = await requireStaff("admin");
    const { id } = await ctx.params;
    const found = findRequest(id);
    if (!found) throw new HttpError(404, "Request not found");
    deleteRequest(id);
    audit(staff, "request.delete", "request", id, `${found.bloodGroup} · ${found.hospital}`);
    return Response.json({ ok: true });
  });
}
