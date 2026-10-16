"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ContactButtons } from "@/components/DonorCard";
import { findDonorsHref, REQUEST_STATUS, URGENCY } from "@/components/RequestCard";
import { api } from "@/lib/client";
import { bn, relativeTime } from "@/lib/format";
import type { RequestResponse, RequestResult, RequestStatus } from "@/lib/types";

type Data = { request: RequestResult; responses: RequestResponse[] };

export default function ManageRequest() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const token = params.get("token") ?? "";
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stale = false;
    api<Data>(`/api/requests/manage?${new URLSearchParams({ id, token })}`).then((res) => {
      if (stale) return;
      if (res.ok) setData(res.data);
      else setError(res.error);
    });
    return () => {
      stale = true;
    };
  }, [id, token, version]);

  async function setStatus(status: RequestStatus) {
    setBusy(true);
    const res = await api("/api/requests/manage", { method: "PATCH", body: { id, token, status } });
    setBusy(false);
    if (res.ok) setVersion((v) => v + 1);
    else setError(res.error);
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <p className="rounded-2xl bg-red-50 p-4 text-red-800">{error}</p>
        <Link href="/requests" className="mt-4 inline-block text-red-600 underline">
          সব অনুরোধ দেখুন
        </Link>
      </div>
    );
  }
  if (!data) return <p className="p-6 text-center text-stone-500">লোড হচ্ছে…</p>;

  const { request, responses } = data;
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div>
        <p className="text-sm text-stone-500">আপনার অনুরোধ</p>
        <h1 className="text-xl font-bold">
          {request.bloodGroup} · {bn(request.bags)} ব্যাগ — {request.hospital}
        </h1>
        <div className="mt-1 flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-semibold ${REQUEST_STATUS[request.status].className}`}>
            {REQUEST_STATUS[request.status].label}
          </span>
          <span className={`rounded-full px-2 py-0.5 font-semibold ${URGENCY[request.urgency].className}`}>{URGENCY[request.urgency].label}</span>
          <span className="text-stone-500">⏰ {relativeTime(request.neededBy)} লাগবে</span>
        </div>
      </div>

      {request.status === "pending" && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          মডারেটর অনুরোধটি যাচাই করছেন। অনুমোদনের পর এটি সবাই দেখতে পাবেন। এর মধ্যে নিজেই কাছের ডোনার খুঁজে যোগাযোগ করতে পারেন।
        </p>
      )}
      {request.status === "rejected" && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-900">
          অনুরোধটি প্রকাশ করা হয়নি{request.statusReason ? `: ${request.statusReason}` : "।"}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <Link href={findDonorsHref(request)} className="rounded-xl bg-red-600 py-3 text-center text-sm font-semibold text-white">
          🔍 কাছের ডোনার খুঁজুন
        </Link>
        {request.status === "open" && (
          <>
            <button disabled={busy} onClick={() => setStatus("fulfilled")} className="rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-60">
              ✓ রক্ত পেয়েছি
            </button>
            <button disabled={busy} onClick={() => setStatus("closed")} className="rounded-xl border border-stone-200 bg-white py-3 text-sm font-semibold disabled:opacity-60">
              আর লাগবে না
            </button>
          </>
        )}
        {(request.status === "fulfilled" || request.status === "closed") && (
          <button disabled={busy} onClick={() => setStatus("open")} className="rounded-xl border border-stone-200 bg-white py-3 text-sm font-semibold disabled:opacity-60">
            আবার চালু করুন
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">যারা সাড়া দিয়েছেন ({bn(responses.length)})</h2>
        {responses.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-600">
            এখনো কেউ সাড়া দেননি। পাশাপাশি কাছের ডোনারদের সরাসরি কল করুন।
          </p>
        ) : (
          <ul className="space-y-3">
            {responses.map((r) => (
              <li key={r.id} className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {r.name} {r.bloodGroup && <span className="text-red-600">({r.bloodGroup})</span>}
                    </p>
                    <p className="text-xs text-stone-500">
                      {r.donorId ? "নিবন্ধিত ডোনার" : "অতিথি"} · {relativeTime(r.createdAt)}
                    </p>
                  </div>
                  <span className="font-mono text-sm">{r.phone}</span>
                </div>
                {r.message && <p className="rounded-xl bg-stone-50 p-2 text-sm">“{r.message}”</p>}
                <ContactButtons phone={r.phone} name={r.name} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-xs text-stone-400">এই পেজের লিংক যার কাছে থাকবে সে-ই অনুরোধটি পরিচালনা করতে পারবে — কাউকে শেয়ার করবেন না।</p>
    </div>
  );
}
