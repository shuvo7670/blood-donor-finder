import { overviewCounts } from "@/lib/server/admin";
import { listAudit } from "@/lib/server/audit";
import { requireStaff } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";
import { getSettings } from "@/lib/server/settings";

export async function GET() {
  return handle(async () => {
    await requireStaff();
    return Response.json({ counts: overviewCounts(), settings: getSettings(), recent: listAudit(10) });
  });
}
