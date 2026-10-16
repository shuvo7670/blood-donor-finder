import type { NextRequest } from "next/server";
import { requireStaff } from "@/lib/server/auth";
import { listDonorsForAdmin } from "@/lib/server/donors";
import { handle } from "@/lib/server/http";
import type { DonorStatus } from "@/lib/types";

const STATUSES: (DonorStatus | "all")[] = ["pending", "approved", "rejected", "suspended", "all"];

/** GET ?status=pending|approved|rejected|suspended|all&q= */
export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireStaff();
    const sp = request.nextUrl.searchParams;
    const status = STATUSES.find((s) => s === sp.get("status")) ?? "pending";
    return Response.json({ donors: listDonorsForAdmin(status, sp.get("q")?.trim() ?? "") });
  });
}
