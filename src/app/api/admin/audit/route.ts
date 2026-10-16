import { listAudit } from "@/lib/server/audit";
import { requireStaff } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";

export async function GET() {
  return handle(async () => {
    await requireStaff("admin");
    return Response.json({ entries: listAudit(500) });
  });
}
