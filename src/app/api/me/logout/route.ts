import { endSession } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";

export async function POST() {
  return handle(async () => {
    await endSession("donor");
    return Response.json({ ok: true });
  });
}
