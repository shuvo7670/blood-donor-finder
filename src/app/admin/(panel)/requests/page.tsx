"use client";

import { useEffect, useState } from "react";
import { REQUEST_STATUS, URGENCY } from "@/components/RequestCard";
import { api } from "@/lib/client";
import { bn, relativeTime } from "@/lib/format";
import type { RequestResult, RequestStatus } from "@/lib/types";
import { useAdmin } from "../AdminShell";
import { RequestDetail } from "../RequestPanels";
import { Badge, Btn, Empty, formatDateTime, PageTitle, ReasonButton, Tabs } from "../ui";

export default function AdminRequests() {
  const { queue, refreshQueue, staff } = useAdmin();
  const [status, setStatus] = useState<RequestStatus | "all">("pending");
  const [requests, setRequests] = useState<RequestResult[] | null>(null);
  const [version, setVersion] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    api<{ requests: RequestResult[] }>(`/api/admin/requests?status=${status}`).then(
      (res) => !stale && setRequests(res.ok ? res.data.requests : []),
    );
    return () => {
      stale = true;
    };
  }, [status, version]);

  const changed = () => {
    setVersion((v) => v + 1);
    refreshQueue();
  };

  async function act(id: string, action: string, reason = ""): Promise<string | null> {
    const res = await api(`/api/admin/requests/${id}`, { method: "PATCH", body: { action, reason } });
    if (!res.ok) return res.errors.reason ?? res.error;
    changed();
    return null;
  }

  async function remove(id: string) {
    const res = await api(`/api/admin/requests/${id}`, { method: "DELETE" });
    if (res.ok) changed();
  }

  return (
    <div>
      <PageTitle title="রক্তের অনুরোধ" subtitle="অনুরোধ যাচাই করে প্রকাশ করুন, পুরনো অনুরোধ বন্ধ করুন" />
      <Tabs
        value={status}
        onChange={(v) => {
          setStatus(v);
          setRequests(null);
        }}
        options={[
          { value: "pending", label: "অপেক্ষমাণ", count: queue.pendingRequests },
          { value: "open", label: "চলমান" },
          { value: "fulfilled", label: "পূরণ হয়েছে" },
          { value: "closed", label: "বন্ধ" },
          { value: "rejected", label: "বাতিল" },
          { value: "all", label: "সব" },
        ]}
      />

      {requests === null ? (
        <p className="text-stone-500">লোড হচ্ছে…</p>
      ) : requests.length === 0 ? (
        <Empty>{status === "pending" ? "অনুমোদনের অপেক্ষায় কোনো অনুরোধ নেই ✓" : "কোনো অনুরোধ নেই।"}</Empty>
      ) : (
        <ul className="space-y-2">
          {requests.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-red-50 text-center leading-tight">
                  <span className="font-bold text-red-600">{r.bloodGroup}</span>
                  <span className="text-[10px] text-red-700">{bn(r.bags)} ব্যাগ</span>
                </div>
                <button className="min-w-0 flex-1 text-left" onClick={() => setOpenId(r.id)}>
                  <p className="font-semibold">{r.hospital}</p>
                  <p className="text-sm text-stone-500">
                    {r.area}
                    {r.city && `, ${r.city}`} · রোগী: {r.patientName} · {r.contactName} ({r.phone})
                  </p>
                  <p className="text-xs text-stone-400">
                    পোস্ট {formatDateTime(r.createdAt)} · লাগবে {relativeTime(r.neededBy)} · {bn(r.responseCount)} সাড়া
                    {r.note && ` · “${r.note}”`}
                  </p>
                </button>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={REQUEST_STATUS[r.status].className}>{REQUEST_STATUS[r.status].label}</Badge>
                  <Badge className={URGENCY[r.urgency].className}>{URGENCY[r.urgency].label}</Badge>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === "pending" && (
                  <>
                    <Btn tone="primary" onClick={() => act(r.id, "approve")}>
                      ✓ অনুমোদন ও প্রকাশ
                    </Btn>
                    <ReasonButton label="✕ বাতিল" title="অনুরোধ বাতিল" onConfirm={(reason) => act(r.id, "reject", reason)} />
                  </>
                )}
                {r.status === "open" && (
                  <>
                    <Btn onClick={() => act(r.id, "fulfil")}>পূরণ হয়েছে</Btn>
                    <ReasonButton label="বন্ধ করুন" title="অনুরোধ বন্ধ" tone="ghost" required={false} onConfirm={(reason) => act(r.id, "close", reason)} />
                  </>
                )}
                {(r.status === "fulfilled" || r.status === "closed" || r.status === "rejected") && (
                  <Btn onClick={() => act(r.id, "reopen")}>আবার চালু</Btn>
                )}
                <Btn onClick={() => setOpenId(r.id)}>সাড়া ও বিস্তারিত</Btn>
                {staff.role === "admin" && (
                  <ReasonButton
                    label="মুছুন"
                    title="অনুরোধ স্থায়ীভাবে মুছবেন?"
                    tone="ghost"
                    required={false}
                    placeholder="নোট (ঐচ্ছিক)"
                    confirmLabel="হ্যাঁ, স্থায়ীভাবে মুছুন"
                    onConfirm={async () => {
                      await remove(r.id);
                      return null;
                    }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {openId && <RequestDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
