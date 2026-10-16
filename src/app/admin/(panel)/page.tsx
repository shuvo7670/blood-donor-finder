"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { bn } from "@/lib/format";
import type { AuditEntry, Settings } from "@/lib/types";
import { useAdmin } from "./AdminShell";
import { ACTION_LABELS } from "./labels";
import { formatDateTime, PageTitle } from "./ui";

type Overview = {
  counts: {
    pendingDonors: number;
    pendingRequests: number;
    openReports: number;
    approvedDonors: number;
    suspendedDonors: number;
    openRequests: number;
    fulfilledRequests: number;
    responses: number;
    donationsLast30: number;
    newDonorsLast7: number;
    contactViews: number;
  };
  settings: Settings;
  recent: AuditEntry[];
};

export default function AdminDashboard() {
  const { staff } = useAdmin();
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    api<Overview>("/api/admin/overview").then((res) => res.ok && setData(res.data));
  }, []);

  if (!data) return <p className="text-stone-500">লোড হচ্ছে…</p>;
  const c = data.counts;

  const queues = [
    { href: "/admin/donors", label: "অনুমোদনের অপেক্ষায় ডোনার", value: c.pendingDonors, icon: "🩸" },
    { href: "/admin/requests", label: "অনুমোদনের অপেক্ষায় অনুরোধ", value: c.pendingRequests, icon: "🚨" },
    { href: "/admin/reports", label: "খোলা রিপোর্ট", value: c.openReports, icon: "⚑" },
  ];
  const stats = [
    { label: "অনুমোদিত ডোনার", value: c.approvedDonors },
    { label: "নতুন ডোনার (৭ দিন)", value: c.newDonorsLast7 },
    { label: "স্থগিত ডোনার", value: c.suspendedDonors },
    { label: "চলমান অনুরোধ", value: c.openRequests },
    { label: "পূরণ হওয়া অনুরোধ", value: c.fulfilledRequests },
    { label: "ডোনারদের সাড়া", value: c.responses },
    { label: "রক্তদান (৩০ দিন)", value: c.donationsLast30 },
    { label: "নম্বর দেখা হয়েছে", value: c.contactViews },
  ];

  return (
    <div className="space-y-6">
      <PageTitle title={`স্বাগতম, ${staff.name}`} subtitle="আজকের কাজের তালিকা" />

      <section className="grid gap-3 sm:grid-cols-3">
        {queues.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className={`rounded-2xl p-4 shadow-sm transition hover:shadow ${q.value ? "bg-red-600 text-white" : "bg-white text-stone-700"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{q.icon}</span>
              <span className="text-3xl font-bold">{bn(q.value)}</span>
            </div>
            <p className={`mt-2 text-sm ${q.value ? "text-red-100" : "text-stone-500"}`}>{q.label}</p>
            <p className="text-xs font-semibold">{q.value ? "এখনই দেখুন →" : "সব কাজ শেষ ✓"}</p>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold">{bn(s.value)}</div>
            <div className="text-xs text-stone-500">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">অনুমোদন নীতি</h2>
          <ul className="space-y-1 text-sm">
            <li>নতুন ডোনার: {data.settings.autoApproveDonors ? "✅ স্বয়ংক্রিয় অনুমোদন" : "🕒 মডারেটর অনুমোদন লাগবে"}</li>
            <li>নতুন অনুরোধ: {data.settings.autoApproveRequests ? "✅ স্বয়ংক্রিয় অনুমোদন" : "🕒 মডারেটর অনুমোদন লাগবে (নিবন্ধিত ডোনারদের অনুরোধ বাদে)"}</li>
            <li>ঘোষণা: {data.settings.announcement || "—"}</li>
          </ul>
          {staff.role === "admin" && (
            <Link href="/admin/settings" className="mt-2 inline-block text-sm font-semibold text-red-600">
              সেটিংস পরিবর্তন →
            </Link>
          )}
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">সাম্প্রতিক কার্যক্রম</h2>
          {data.recent.length === 0 ? (
            <p className="text-sm text-stone-500">এখনো কিছু হয়নি।</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.recent.map((a) => (
                <li key={a.id} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate">
                    <b>{a.actorName}</b> · {ACTION_LABELS[a.action] ?? a.action}
                    {a.detail && <span className="text-stone-500"> — {a.detail}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-stone-400">{formatDateTime(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
