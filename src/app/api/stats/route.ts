import { connection } from "next/server";
import { BLOOD_GROUPS } from "@/lib/blood";
import { readDb, toDonorResult } from "@/lib/db";
import type { Stats } from "@/lib/types";

export async function GET() {
  await connection(); // always read the live data, never a build-time snapshot
  const { donors, requests } = await readDb();
  const results = donors.map((d) => toDonorResult(d, null));

  const byGroup = Object.fromEntries(BLOOD_GROUPS.map((g) => [g, { total: 0, eligible: 0 }])) as Stats["byGroup"];
  for (const d of results) {
    byGroup[d.bloodGroup].total++;
    if (d.eligible) byGroup[d.bloodGroup].eligible++;
  }

  const stats: Stats = {
    totalDonors: results.length,
    eligibleDonors: results.filter((d) => d.eligible).length,
    openRequests: requests.filter((r) => r.status === "open").length,
    cities: new Set(donors.map((d) => d.city)).size,
    totalDonations: donors.reduce((sum, d) => sum + d.totalDonations, 0),
    byGroup,
  };
  return Response.json(stats);
}
