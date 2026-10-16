import type { NextRequest } from "next/server";
import { readDb, toDonorResult } from "@/lib/db";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/donors/[id]">) {
  const { id } = await ctx.params;
  const { donors } = await readDb();
  const donor = donors.find((d) => d.id === id);
  if (!donor) return Response.json({ error: "Donor not found" }, { status: 404 });
  return Response.json({ donor: toDonorResult(donor, null) });
}
