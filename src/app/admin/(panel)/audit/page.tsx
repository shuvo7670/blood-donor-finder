"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { AuditEntry } from "@/lib/types";
import { useAdmin } from "../AdminShell";
import { ACTION_LABELS } from "../labels";
import { Empty, formatDateTime, PageTitle } from "../ui";

export default function AdminAudit() {
  const { staff } = useAdmin();
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    api<{ entries: AuditEntry[] }>("/api/admin/audit").then((res) => setEntries(res.ok ? res.data.entries : []));
  }, []);

  if (staff.role !== "admin") return <p>শুধু অ্যাডমিন এই পেজ দেখতে পারেন।</p>;
  const shown = (entries ?? []).filter((e) => !filter || e.action.startsWith(filter));

  return (
    <div>
      <PageTitle title="কার্যক্রম লগ" subtitle="কে কখন কী অনুমোদন, বাতিল বা পরিবর্তন করেছেন (সর্বশেষ ৫০০)" />
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-4 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
        <option value="">সব</option>
        <option value="donor.">ডোনার</option>
        <option value="request.">অনুরোধ</option>
        <option value="report.">রিপোর্ট</option>
        <option value="bank.">ব্লাড ব্যাংক</option>
        <option value="staff.">স্টাফ</option>
        <option value="settings.">সেটিংস</option>
        <option value="login">লগইন</option>
      </select>
      {entries === null ? (
        <p className="text-stone-500">লোড হচ্ছে…</p>
      ) : shown.length === 0 ? (
        <Empty>কিছু নেই।</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="p-3">সময়</th>
                <th className="p-3">কে</th>
                <th className="p-3">কাজ</th>
                <th className="p-3">বিস্তারিত</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => (
                <tr key={e.id} className="border-t border-stone-100">
                  <td className="whitespace-nowrap p-3 text-stone-500">{formatDateTime(e.createdAt)}</td>
                  <td className="p-3 font-medium">{e.actorName}</td>
                  <td className="p-3">{ACTION_LABELS[e.action] ?? e.action}</td>
                  <td className="p-3 text-stone-600">{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
