import { BLOOD_GROUPS } from "@/lib/blood";
import { listBanks } from "@/lib/server/admin";
import { searchDonors } from "@/lib/server/donors";
import { handle } from "@/lib/server/http";
import { getSettings } from "@/lib/server/settings";
import { get } from "@/lib/server/sqlite";
import type { Stats } from "@/lib/types";

export async function GET() {
  return handle(() => {
    const donors = searchDonors({ origin: null, radiusKm: 0, group: null, compatible: false, eligibleOnly: false, q: "" });
    const byGroup = Object.fromEntries(BLOOD_GROUPS.map((g) => [g, { total: 0, eligible: 0 }])) as Stats["byGroup"];
    for (const d of donors) {
      byGroup[d.bloodGroup].total++;
      if (d.eligible) byGroup[d.bloodGroup].eligible++;
    }
    const count = (status: string) => get<{ n: number }>("SELECT COUNT(*) AS n FROM requests WHERE status = ?", [status])!.n;

    const stats: Stats = {
      totalDonors: donors.length,
      eligibleDonors: donors.filter((d) => d.eligible).length,
      openRequests: count("open"),
      fulfilledRequests: count("fulfilled"),
      cities: new Set(donors.map((d) => d.city)).size,
      totalDonations: donors.reduce((sum, d) => sum + d.totalDonations, 0),
      bloodBanks: listBanks().length,
      byGroup,
      announcement: getSettings().announcement,
    };
    return Response.json(stats);
  });
}
