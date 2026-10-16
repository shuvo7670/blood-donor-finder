import type { NextRequest } from "next/server";
import { requireStaff } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";
import { listRequestsForAdmin } from "@/lib/server/requests";
import type { RequestStatus } from "@/lib/types";

const STATUSES: (RequestStatus | "all")[] = ["pending", "open", "fulfilled", "closed", "rejected", "all"];

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireStaff();
    const status = STATUSES.find((s) => s === request.nextUrl.searchParams.get("status")) ?? "pending";
    return Response.json({ requests: listRequestsForAdmin(status) });
  });
}
