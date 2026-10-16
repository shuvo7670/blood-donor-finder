"use client";

import { useEffect, useState } from "react";
import { REPORT_REASONS } from "@/components/ReportButton";
import { api } from "@/lib/client";
import type { Report } from "@/lib/types";
import { useAdmin } from "../AdminShell";
import { DonorDetailSheet } from "../DonorPanels";
import { RequestDetail } from "../RequestPanels";
import { Badge, Btn, Empty, formatDateTime, PageTitle, ReasonButton, Tabs } from "../ui";

const REPORT_STATUS: Record<Report["status"], { label: string; className: string }> = {
  open: { label: "খোলা", className: "bg-red-100 text-red-800" },
  resolved: { label: "সমাধান হয়েছে", className: "bg-emerald-100 text-emerald-800" },
  dismissed: { label: "খারিজ", className: "bg-stone-200 text-stone-700" },
};

export default function AdminReports() {
  const { queue, refreshQueue } = useAdmin();
  const [status, setStatus] = useState<Report["status"] | "all">("open");
  const [reports, setReports] = useState<Report[] | null>(null);
  const [version, setVersion] = useState(0);
  const [target, setTarget] = useState<{ type: Report["targetType"]; id: string } | null>(null);

  useEffect(() => {
    let stale = false;
    api<{ reports: Report[] }>(`/api/admin/reports?status=${status}`).then((res) => !stale && setReports(res.ok ? res.data.reports : []));
    return () => {
      stale = true;
    };
  }, [status, version]);

  async function act(id: string, action: "resolve" | "dismiss", note: string): Promise<string | null> {
    const res = await api(`/api/admin/reports/${id}`, { method: "PATCH", body: { action, note } });
    if (!res.ok) return res.error;
    setVersion((v) => v + 1);
    refreshQueue();
    return null;
  }

  return (
    <div>
      <PageTitle
        title="রিপোর্ট"
        subtitle="ব্যবহারকারীদের অভিযোগ। ভুয়া ডোনার স্থগিত করুন ডোনার পেজ থেকে, তারপর রিপোর্টটি সমাধান করুন।"
      />
      <Tabs
        value={status}
        onChange={(v) => {
          setStatus(v);
          setReports(null);
        }}
        options={[
          { value: "open", label: "খোলা", count: queue.openReports },
          { value: "resolved", label: "সমাধান" },
          { value: "dismissed", label: "খারিজ" },
          { value: "all", label: "সব" },
        ]}
      />
      {reports === null ? (
        <p className="text-stone-500">লোড হচ্ছে…</p>
      ) : reports.length === 0 ? (
        <Empty>{status === "open" ? "কোনো খোলা রিপোর্ট নেই ✓" : "কিছু নেই।"}</Empty>
      ) : (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {REPORT_REASONS[r.reason]} — {r.targetType === "donor" ? "ডোনার" : "অনুরোধ"}: {r.targetLabel ?? "(মুছে ফেলা হয়েছে)"}
                  </p>
                  {r.details && <p className="text-sm text-stone-600">“{r.details}”</p>}
                  <p className="text-xs text-stone-400">
                    {formatDateTime(r.createdAt)}
                    {r.reporterPhone && ` · রিপোর্টকারী: ${r.reporterPhone}`}
                    {r.resolvedBy && ` · ${r.resolvedBy}${r.resolutionNote ? `: ${r.resolutionNote}` : ""}`}
                  </p>
                </div>
                <Badge className={REPORT_STATUS[r.status].className}>{REPORT_STATUS[r.status].label}</Badge>
              </div>
              {r.status === "open" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.targetLabel && (
                    <Btn onClick={() => setTarget({ type: r.targetType, id: r.targetId })}>
                      {r.targetType === "donor" ? "ডোনার দেখুন ও ব্যবস্থা নিন" : "অনুরোধ দেখুন"}
                    </Btn>
                  )}
                  <ReasonButton
                    label="✓ সমাধান"
                    title="রিপোর্ট সমাধান"
                    tone="primary"
                    required={false}
                    placeholder="কী ব্যবস্থা নেওয়া হলো (ঐচ্ছিক)"
                    onConfirm={(note) => act(r.id, "resolve", note)}
                  />
                  <ReasonButton
                    label="খারিজ"
                    title="রিপোর্ট খারিজ"
                    tone="ghost"
                    required={false}
                    placeholder="কেন খারিজ (ঐচ্ছিক)"
                    onConfirm={(note) => act(r.id, "dismiss", note)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {target?.type === "donor" && <DonorDetailSheet id={target.id} onClose={() => setTarget(null)} onChanged={refreshQueue} />}
      {target?.type === "request" && <RequestDetail id={target.id} onClose={() => setTarget(null)} />}
    </div>
  );
}
