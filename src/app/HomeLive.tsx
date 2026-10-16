"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RequestCard from "@/components/RequestCard";
import { BLOOD_GROUPS } from "@/lib/blood";
import { bn } from "@/lib/format";
import type { RequestResult, Stats } from "@/lib/types";

/** Live numbers and the most urgent open requests, fetched from the API. */
export default function HomeLive() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [requests, setRequests] = useState<RequestResult[] | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => undefined);
    fetch("/api/requests").then((r) => r.json()).then((d) => setRequests(d.requests ?? [])).catch(() => setRequests([]));
  }, []);

  const tiles = [
    { label: "নিবন্ধিত ডোনার", value: stats?.totalDonors },
    { label: "এখন প্রস্তুত", value: stats?.eligibleDonors },
    { label: "চলমান অনুরোধ", value: stats?.openRequests },
    { label: "মোট রক্তদান", value: stats?.totalDonations },
  ];
  const maxGroup = stats ? Math.max(...BLOOD_GROUPS.map((g) => stats.byGroup[g].total), 1) : 1;

  return (
    <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-600">{t.value === undefined ? "—" : bn(t.value)}</div>
            <div className="text-sm text-stone-500">{t.label}</div>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">🚨 জরুরি রক্ত লাগবে</h2>
          <Link href="/requests" className="text-sm font-medium text-red-600">
            সব দেখুন →
          </Link>
        </div>
        {requests === null ? (
          <p className="text-sm text-stone-500">লোড হচ্ছে…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-stone-500">এই মুহূর্তে কোনো জরুরি অনুরোধ নেই।</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {requests.slice(0, 4).map((r) => (
              <RequestCard key={r.id} request={r} compact />
            ))}
          </div>
        )}
      </section>

      {stats && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">গ্রুপভিত্তিক ডোনার</h2>
          <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
            {BLOOD_GROUPS.map((g) => {
              const { total, eligible } = stats.byGroup[g];
              return (
                <Link
                  key={g}
                  href={`/find?${new URLSearchParams({ group: g, radius: "0" })}`}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="w-9 font-bold text-red-600">{g}</span>
                  <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-red-200" style={{ width: `${(total / maxGroup) * 100}%` }} />
                    <span className="absolute inset-y-0 left-0 rounded-full bg-red-600" style={{ width: `${(eligible / maxGroup) * 100}%` }} />
                  </span>
                  <span className="w-20 text-right text-stone-600">
                    {bn(eligible)}/{bn(total)}
                  </span>
                </Link>
              );
            })}
            <p className="pt-1 text-xs text-stone-500">গাঢ় লাল: এখন রক্ত দিতে প্রস্তুত · হালকা: মোট নিবন্ধিত</p>
          </div>
        </section>
      )}
    </>
  );
}
