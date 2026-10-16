"use client";

import { useEffect, useState } from "react";
import { REPORT_REASONS } from "@/components/ReportButton";
import Sheet from "@/components/Sheet";
import { api } from "@/lib/client";
import { bn, formatDate, internationalPhone } from "@/lib/format";
import type { AuditEntry, Donation, DonorDetail, Report } from "@/lib/types";
import { useAdmin } from "./AdminShell";
import { ACTION_LABELS, DONOR_STATUS } from "./labels";
import { Badge, Btn, formatDateTime, ReasonButton } from "./ui";

type Detail = { donor: DonorDetail; donations: Donation[]; reports: Report[]; history: AuditEntry[] };

export function DonorActions({ donor, onChanged }: { donor: DonorDetail; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);

  async function act(action: string, reason = ""): Promise<string | null> {
    setBusy(true);
    const res = await api(`/api/admin/donors/${donor.id}`, { method: "PATCH", body: { action, reason } });
    setBusy(false);
    if (!res.ok) return res.errors.reason ?? res.error;
    onChanged();
    return null;
  }

  return (
    <>
      {(donor.status === "pending" || donor.status === "rejected") && (
        <Btn tone="primary" disabled={busy} onClick={() => act("approve")}>
          ✓ অনুমোদন
        </Btn>
      )}
      {donor.status === "pending" && (
        <ReasonButton label="✕ বাতিল" title={`${donor.name}-এর নিবন্ধন বাতিল`} onConfirm={(r) => act("reject", r)} />
      )}
      {donor.status === "approved" && (
        <>
          <Btn disabled={busy} onClick={() => act(donor.verified ? "unverify" : "verify")}>
            {donor.verified ? "যাচাই প্রত্যাহার" : "✓ যাচাইকৃত করুন"}
          </Btn>
          <ReasonButton label="স্থগিত" title={`${donor.name}-কে স্থগিত করুন`} onConfirm={(r) => act("suspend", r)} />
        </>
      )}
      {donor.status === "suspended" && (
        <Btn tone="primary" disabled={busy} onClick={() => act("reinstate")}>
          পুনর্বহাল
        </Btn>
      )}
      <a href={`https://wa.me/${internationalPhone(donor.phone)}`} target="_blank" rel="noreferrer" className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700">
        WhatsApp
      </a>
    </>
  );
}

export function DonorDetailSheet({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { staff } = useAdmin();
  const [data, setData] = useState<Detail | null>(null);
  const [version, setVersion] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api<Detail>(`/api/admin/donors/${id}`).then((res) => res.ok && setData(res.data));
  }, [id, version]);

  async function remove() {
    const res = await api(`/api/admin/donors/${id}`, { method: "DELETE" });
    if (res.ok) {
      onChanged();
      onClose();
    }
  }

  return (
    <Sheet title="ডোনারের বিস্তারিত" onClose={onClose}>
      {!data ? (
        <p className="text-stone-500">লোড হচ্ছে…</p>
      ) : (
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-lg font-semibold">
              {data.donor.name} <span className="text-red-600">({data.donor.bloodGroup})</span>
            </p>
            <Badge className={DONOR_STATUS[data.donor.status].className}>{DONOR_STATUS[data.donor.status].label}</Badge>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
            <dt className="text-stone-500">ফোন</dt>
            <dd className="font-mono">{data.donor.phone}</dd>
            <dt className="text-stone-500">লোকেশন</dt>
            <dd>
              {data.donor.area}, {data.donor.city}{" "}
              <a className="text-red-600 underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${data.donor.lat},${data.donor.lng}`}>
                ম্যাপ
              </a>
            </dd>
            <dt className="text-stone-500">বয়স / ওজন</dt>
            <dd>
              {bn(data.donor.age)} বছর / {bn(data.donor.weight)} কেজি
            </dd>
            <dt className="text-stone-500">শেষ রক্তদান</dt>
            <dd>{data.donor.lastDonation ? formatDate(data.donor.lastDonation) : "—"}</dd>
            <dt className="text-stone-500">প্রাপ্যতা</dt>
            <dd>{data.donor.available ? "প্রস্তুত" : "বন্ধ"}</dd>
            <dt className="text-stone-500">নম্বর দেখা</dt>
            <dd>{bn(data.donor.contactViews)} বার</dd>
          </dl>

          <div className="flex flex-wrap gap-2">
            <DonorActions
              donor={data.donor}
              onChanged={() => {
                setVersion((v) => v + 1);
                onChanged();
              }}
            />
          </div>

          <section>
            <h3 className="mb-1 font-semibold">রিপোর্ট ({bn(data.reports.length)})</h3>
            {data.reports.length === 0 ? (
              <p className="text-stone-500">কোনো রিপোর্ট নেই।</p>
            ) : (
              <ul className="space-y-1">
                {data.reports.map((r) => (
                  <li key={r.id} className="rounded-xl bg-stone-50 p-2">
                    <b>{REPORT_REASONS[r.reason]}</b> {r.details && `— ${r.details}`}{" "}
                    <span className="text-xs text-stone-500">({r.status === "open" ? "খোলা" : r.status === "resolved" ? "সমাধান" : "খারিজ"})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-1 font-semibold">রক্তদান ({bn(data.donations.length)})</h3>
            <p className="text-stone-600">{data.donations.map((d) => formatDate(d.date)).join(", ") || "—"}</p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold">মডারেশন ইতিহাস</h3>
            {data.history.length === 0 ? (
              <p className="text-stone-500">—</p>
            ) : (
              <ul className="space-y-1">
                {data.history.map((h) => (
                  <li key={h.id} className="text-stone-600">
                    {formatDateTime(h.createdAt)} · <b>{h.actorName}</b> · {ACTION_LABELS[h.action] ?? h.action}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <ResetPin donorId={id} />

          {staff.role === "admin" &&
            (confirmDelete ? (
              <div className="space-y-2 rounded-xl bg-red-50 p-3">
                <p className="text-red-900">ডোনার ও তার সব তথ্য স্থায়ীভাবে মুছে যাবে। নিশ্চিত?</p>
                <div className="flex gap-2">
                  <Btn tone="danger" onClick={remove}>
                    হ্যাঁ, মুছুন
                  </Btn>
                  <Btn onClick={() => setConfirmDelete(false)}>না</Btn>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-sm text-red-600 underline">
                ডোনার স্থায়ীভাবে মুছুন
              </button>
            ))}
        </div>
      )}
    </Sheet>
  );
}

function ResetPin({ donorId }: { donorId: string }) {
  const [pin, setPin] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function reset() {
    const res = await api<{ pin: string }>(`/api/admin/donors/${donorId}`, { method: "PATCH", body: { action: "reset_pin" } });
    if (res.ok) setPin(res.data.pin);
    setConfirming(false);
  }

  if (pin) {
    return (
      <p className="rounded-xl bg-emerald-50 p-3 text-emerald-900">
        নতুন পিন: <b className="font-mono text-lg">{pin}</b> — ডোনারকে জানিয়ে দিন এবং লগইনের পর পিন বদলাতে বলুন। এটি আর দেখানো হবে না।
      </p>
    );
  }
  return confirming ? (
    <div className="space-y-2 rounded-xl bg-amber-50 p-3">
      <p className="text-amber-900">ফোনে ডোনারের পরিচয় নিশ্চিত করেছেন? নতুন পিন তৈরি হবে এবং পুরনো পিন কাজ করবে না।</p>
      <div className="flex gap-2">
        <Btn tone="danger" onClick={reset}>
          হ্যাঁ, রিসেট করুন
        </Btn>
        <Btn onClick={() => setConfirming(false)}>না</Btn>
      </div>
    </div>
  ) : (
    <button onClick={() => setConfirming(true)} className="block text-sm text-stone-600 underline">
      🔑 পিন রিসেট (ডোনার পিন ভুলে গেলে)
    </button>
  );
}
