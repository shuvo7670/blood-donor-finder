"use client";

import { useEffect, useState } from "react";
import Sheet from "@/components/Sheet";
import { api } from "@/lib/client";
import { bn } from "@/lib/format";
import type { RequestResponse, RequestResult } from "@/lib/types";

export function RequestDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const [data, setData] = useState<{ request: RequestResult; responses: RequestResponse[] } | null>(null);

  useEffect(() => {
    api<{ request: RequestResult; responses: RequestResponse[] }>(`/api/admin/requests/${id}`).then((res) => res.ok && setData(res.data));
  }, [id]);

  return (
    <Sheet title="অনুরোধের বিস্তারিত" onClose={onClose}>
      {!data ? (
        <p className="text-stone-500">লোড হচ্ছে…</p>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-lg font-semibold">
            {data.request.bloodGroup} · {data.request.hospital}
          </p>
          {data.request.statusReason && <p className="rounded-xl bg-stone-50 p-2">কারণ: {data.request.statusReason}</p>}
          <a
            className="text-red-600 underline"
            target="_blank"
            rel="noreferrer"
            href={`https://www.google.com/maps?q=${data.request.lat},${data.request.lng}`}
          >
            ম্যাপে লোকেশন দেখুন
          </a>
          <h3 className="font-semibold">সাড়া ({bn(data.responses.length)})</h3>
          {data.responses.length === 0 ? (
            <p className="text-stone-500">এখনো কেউ সাড়া দেননি।</p>
          ) : (
            <ul className="space-y-2">
              {data.responses.map((r) => (
                <li key={r.id} className="rounded-xl bg-stone-50 p-2">
                  <b>{r.name}</b> {r.bloodGroup && `(${r.bloodGroup})`} · {r.phone} · {r.donorId ? "ডোনার" : "অতিথি"}
                  {r.message && <p className="text-stone-600">“{r.message}”</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Sheet>
  );
}
