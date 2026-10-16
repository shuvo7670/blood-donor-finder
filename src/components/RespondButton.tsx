"use client";

import Link from "next/link";
import { useState } from "react";
import Sheet from "@/components/Sheet";
import { Field, inputClass } from "@/components/ui";
import { api } from "@/lib/client";
import { RECEIVES_FROM } from "@/lib/blood";
import type { RequestResult } from "@/lib/types";

/** "আমি দিতে পারব": tells the requester (on their manage page) that this person can donate. */
export default function RespondButton({ request, onDone }: { request: RequestResult; onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  // undefined while checking, null for a guest.
  const [me, setMe] = useState<{ name: string; status: string } | null | undefined>(undefined);

  async function openSheet() {
    setOpen(true);
    const res = await api<{ donor: { name: string; status: string } }>("/api/me");
    setMe(res.ok ? res.data.donor : null);
  }

  async function send(asDonor: boolean) {
    setState("sending");
    setError(null);
    const res = await api(`/api/requests/${request.id}/respond`, { body: asDonor ? { message } : { name, phone, message } });
    if (res.ok) {
      setState("sent");
      onDone?.();
      return;
    }
    setState("idle");
    setErrors(res.errors);
    if (!Object.keys(res.errors).length) setError(res.error);
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="flex-1 rounded-xl bg-red-600 py-2 text-center text-sm font-semibold text-white"
      >
        🙋 আমি দিতে পারব
      </button>
      {open && (
        <Sheet title={`${request.bloodGroup} রক্ত — ${request.hospital}`} onClose={() => setOpen(false)}>
          {state === "sent" ? (
            <div className="space-y-3">
              <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                ধন্যবাদ! রোগীর স্বজন আপনার সাড়া দেখতে পাবেন। দেরি না করে তাদের সাথে যোগাযোগ করুন:
              </p>
              <a href={`tel:${request.phone}`} className="block rounded-xl bg-red-600 py-3 text-center font-semibold text-white">
                📞 {request.contactName}-কে কল করুন
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-900">
                এই রোগী রক্ত নিতে পারবেন: <b>{RECEIVES_FROM[request.bloodGroup].join(", ")}</b>
              </p>
              <Field label="বার্তা (ঐচ্ছিক)">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="যেমন: আমি ১ ঘণ্টার মধ্যে আসতে পারব"
                  className={inputClass}
                />
              </Field>
              {me === undefined ? (
                <p className="text-center text-sm text-stone-500">…</p>
              ) : me ? (
                me.status === "approved" ? (
                  <button
                    onClick={() => send(true)}
                    disabled={state === "sending"}
                    className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    {me.name} হিসেবে সাড়া দিন
                  </button>
                ) : (
                  <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">আপনার ডোনার প্রোফাইল অনুমোদনের পর সাড়া দিতে পারবেন।</p>
                )
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="আপনার নাম" error={errors.name}>
                      <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="name" />
                    </Field>
                    <Field label="মোবাইল" error={errors.phone}>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" className={inputClass} autoComplete="tel" />
                    </Field>
                  </div>
                  <button
                    onClick={() => send(false)}
                    disabled={state === "sending"}
                    className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white disabled:opacity-60"
                  >
                    সাড়া দিন
                  </button>
                  <p className="text-center text-xs text-stone-500">
                    নিবন্ধিত ডোনার?{" "}
                    <Link href="/me" className="text-red-600 underline">
                      লগইন করুন
                    </Link>
                  </p>
                </>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}
        </Sheet>
      )}
    </>
  );
}
