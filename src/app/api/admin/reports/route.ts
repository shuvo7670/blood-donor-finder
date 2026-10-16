import type { NextRequest } from "next/server";
import { listReports } from "@/lib/server/admin";
import { requireStaff } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";
import type { Report } from "@/lib/types";

const STATUSES: (Report["status"] | "all")[] = ["open", "resolved", "dismissed", "all"];

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireStaff();
    const status = STATUSES.find((s) => s === request.nextUrl.searchParams.get("status")) ?? "open";
    return Response.json({ reports: listReports(status) });
  });
}
