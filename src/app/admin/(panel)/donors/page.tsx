"use client";

import { useEffect, useState } from "react";
import { inputClass } from "@/components/ui";
import { api } from "@/lib/client";
import { bn } from "@/lib/format";
import type { DonorDetail, DonorStatus } from "@/lib/types";
import { useAdmin } from "../AdminShell";
import { DonorActions, DonorDetailSheet } from "../DonorPanels";
import { DONOR_STATUS } from "../labels";
import { Badge, Btn, Empty, formatDateTime, PageTitle, Tabs } from "../ui";
export default function AdminDonors() {
  const { queue, refreshQueue } = useAdmin();
  const [status, setStatus] = useState<DonorStatus | "all">("pending");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [donors, setDonors] = useState<DonorDetail[] | null>(null);
  const [version, setVersion] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let stale = false;
    api<{ donors: DonorDetail[] }>(`/api/admin/donors?${new URLSearchParams({ status, q: query })}`).then(
      (res) => !stale && setDonors(res.ok ? res.data.donors : []),
    );
    return () => {
      stale = true;
    };
  }, [status, query, version]);

  const changed = () => {
    setVersion((v) => v + 1);
    refreshQueue();
  };

  return (
    <div>
      <PageTitle title="ডোনার ব্যবস্থাপনা" subtitle="নতুন নিবন্ধন যাচাই, অনুমোদন, স্থগিত ও যাচাইকৃত ব্যাজ" />
      <Tabs
        value={status}
        onChange={(v) => {
          setStatus(v);
          setDonors(null);
        }}
        options={[
          { value: "pending", label: "অপেক্ষমাণ", count: queue.pendingDonors },
          { value: "approved", label: "অনুমোদিত" },
          { value: "suspended", label: "স্থগিত" },
          { value: "rejected", label: "বাতিল" },
          { value: "all", label: "সব" },
        ]}
      />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="নাম, ফোন, এলাকা বা গ্রুপ দিয়ে খুঁজুন…"
        className={`${inputClass} mb-4`}
      />

      {donors === null ? (
        <p className="text-stone-500">লোড হচ্ছে…</p>
      ) : donors.length === 0 ? (
        <Empty>{status === "pending" ? "অনুমোদনের অপেক্ষায় কোনো ডোনার নেই ✓" : "কোনো ডোনার পাওয়া যায়নি।"}</Empty>
      ) : (
        <ul className="space-y-2">
          {donors.map((d) => (
            <li key={d.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-red-600 font-bold text-white">{d.bloodGroup}</div>
                <button className="min-w-0 flex-1 text-left" onClick={() => setOpenId(d.id)}>
                  <p className="font-semibold">
                    {d.name} {d.verified && <span className="text-sky-600">✓</span>}
                  </p>
                  <p className="text-sm text-stone-500">
                    {d.phone} · {d.area}, {d.city} · {d.gender === "male" ? "পুরুষ" : "নারী"}, {bn(d.age)} বছর, {bn(d.weight)} কেজি
                  </p>
                  <p className="text-xs text-stone-400">
                    নিবন্ধন {formatDateTime(d.createdAt)} · {bn(d.totalDonations)} বার রক্তদান
                    {d.statusReason && <span className="text-red-600"> · কারণ: {d.statusReason}</span>}
                  </p>
                </button>
                <Badge className={DONOR_STATUS[d.status].className}>{DONOR_STATUS[d.status].label}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <DonorActions donor={d} onChanged={changed} />
                <Btn onClick={() => setOpenId(d.id)}>বিস্তারিত</Btn>
              </div>
            </li>
          ))}
        </ul>
      )}

      {openId && <DonorDetailSheet id={openId} onClose={() => setOpenId(null)} onChanged={changed} />}
    </div>
  );
}

