"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import { inputClass } from "@/components/ui";
import { api } from "@/lib/client";
import type { Report, ReportReason } from "@/lib/types";

export const REPORT_REASONS: Record<ReportReason, string> = {
  wrong_number: "ভুল নম্বর",
  not_responding: "সাড়া দেন না",
  fake: "ভুয়া তথ্য",
  asked_money: "টাকা চেয়েছেন",
  other: "অন্যান্য",
};

export default function ReportButton({ targetType, targetId }: { targetType: Report["targetType"]; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!reason) return setError("কারণ বেছে নিন।");
    setState("sending");
    const res = await api("/api/reports", { body: { targetType, targetId, reason, details } });
    if (res.ok) setState("sent");
    else {
      setState("idle");
      setError(res.error);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-stone-400 underline-offset-2 hover:text-red-600 hover:underline">
        ⚑ রিপোর্ট
      </button>
      {open && (
        <Sheet title="সমস্যা রিপোর্ট করুন" onClose={() => setOpen(false)}>
          {state === "sent" ? (
            <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">ধন্যবাদ! মডারেটররা বিষয়টি দেখবেন।</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(REPORT_REASONS) as ReportReason[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`rounded-xl border py-2 text-sm ${reason === r ? "border-red-600 bg-red-600 text-white" : "border-stone-200"}`}
                  >
                    {REPORT_REASONS[r]}
                  </button>
                ))}
              </div>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="বিস্তারিত (ঐচ্ছিক)"
                className={inputClass}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                onClick={send}
                disabled={state === "sending"}
                className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white disabled:opacity-60"
              >
                {state === "sending" ? "পাঠানো হচ্ছে…" : "রিপোর্ট পাঠান"}
              </button>
            </div>
          )}
        </Sheet>
      )}
    </>
  );
}
