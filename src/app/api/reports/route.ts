import { normalizePhone } from "@/lib/format";
import { createReport } from "@/lib/server/admin";
import { findDonor } from "@/lib/server/donors";
import { clientIp, handle, HttpError, rateLimit, readJson } from "@/lib/server/http";
import { findRequest } from "@/lib/server/requests";
import type { ReportReason } from "@/lib/types";

const REASONS: ReportReason[] = ["wrong_number", "not_responding", "fake", "asked_money", "other"];

/** POST /api/reports { targetType, targetId, reason, details?, reporterPhone? } */
export async function POST(request: Request) {
  return handle(async () => {
    rateLimit(`report:${clientIp(request)}`, 10, 60 * 60 * 1000);
    const body = await readJson(request);
    const targetType = body.targetType;
    const targetId = String(body.targetId ?? "");
    if (targetType !== "donor" && targetType !== "request") throw new HttpError(400, "Invalid target");
    if (!REASONS.includes(body.reason as ReportReason)) throw new HttpError(422, "Invalid reason", { reason: "কারণ বেছে নিন।" });
    const exists = targetType === "donor" ? findDonor(targetId) : findRequest(targetId);
    if (!exists) throw new HttpError(404, "Not found");

    createReport({
      targetType,
      targetId,
      reason: body.reason as ReportReason,
      details: typeof body.details === "string" ? body.details.trim().slice(0, 500) : "",
      reporterPhone: typeof body.reporterPhone === "string" ? normalizePhone(body.reporterPhone).slice(0, 15) : "",
    });
    return Response.json({ ok: true }, { status: 201 });
  });
}
