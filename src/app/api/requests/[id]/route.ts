import type { NextRequest } from "next/server";
import { updateDb } from "@/lib/db";

/** PATCH /api/requests/:id with { status: "open" | "fulfilled" } */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/requests/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (status !== "open" && status !== "fulfilled") {
    return Response.json({ error: 'status must be "open" or "fulfilled"' }, { status: 400 });
  }

  const updated = await updateDb((db) => {
    const item = db.requests.find((r) => r.id === id);
    if (item) item.status = status;
    return item ?? null;
  });
  if (!updated) return Response.json({ error: "Request not found" }, { status: 404 });
  return Response.json({ request: updated });
}
