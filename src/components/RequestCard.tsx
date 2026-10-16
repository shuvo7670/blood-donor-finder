"use client";

import Link from "next/link";
import { ContactButtons } from "@/components/DonorCard";
import { bn, formatDistance, isPast, relativeTime } from "@/lib/format";
import type { RequestResult, Urgency } from "@/lib/types";

export const URGENCY: Record<Urgency, { label: string; className: string }> = {
  critical: { label: "অতি জরুরি", className: "bg-red-600 text-white" },
  urgent: { label: "জরুরি", className: "bg-amber-100 text-amber-800" },
  normal: { label: "সাধারণ", className: "bg-stone-100 text-stone-700" },
};

export default function RequestCard({
  request,
  onFulfilled,
  compact = false,
}: {
  request: RequestResult;
  onFulfilled?: (id: string) => void;
  compact?: boolean;
}) {
  const done = request.status === "fulfilled";
  const overdue = !done && isPast(request.neededBy);
  const findHref = `/find?${new URLSearchParams({
    group: request.bloodGroup,
    compatible: "1",
    lat: String(request.lat),
    lng: String(request.lng),
    radius: "10",
    label: request.hospital,
  })}`;

  return (
    <article className={`rounded-2xl border bg-white p-4 shadow-sm ${done ? "border-stone-200 opacity-70" : "border-red-100"}`}>
      <div className="flex items-start gap-3">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-red-50 text-center">
          <span className="text-lg font-bold leading-none text-red-600">{request.bloodGroup}</span>
          <span className="text-[11px] text-red-700">{bn(request.bags)} ব্যাগ</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${done ? "bg-emerald-100 text-emerald-800" : URGENCY[request.urgency].className}`}>
              {done ? "✓ রক্ত পাওয়া গেছে" : URGENCY[request.urgency].label}
            </span>
            <span className={`text-xs ${overdue ? "text-red-600" : "text-stone-500"}`}>
              ⏰ {relativeTime(request.neededBy)} লাগবে
            </span>
          </div>
          <h3 className="mt-1 font-semibold">{request.hospital}</h3>
          <p className="text-sm text-stone-500">
            📍 {request.area}
            {request.city && `, ${request.city}`}
            {request.distanceKm !== null && ` · ${formatDistance(request.distanceKm)} দূরে`}
          </p>
          {!compact && (
            <>
              <p className="mt-1 text-sm text-stone-700">
                রোগী: {request.patientName}
                {request.note && <span className="text-stone-500"> — {request.note}</span>}
              </p>
              <p className="text-xs text-stone-400">
                যোগাযোগ: {request.contactName} · পোস্ট {relativeTime(request.createdAt)}
              </p>
            </>
          )}
        </div>
      </div>

      {!done && !compact && (
        <div className="mt-3 space-y-2">
          <ContactButtons phone={request.phone} name={request.contactName} lat={request.lat} lng={request.lng} />
          <div className="flex gap-2">
            <Link href={findHref} className="flex-1 rounded-xl border border-red-200 py-2 text-center text-sm font-semibold text-red-700">
              🔍 কাছের ডোনার খুঁজুন
            </Link>
            {onFulfilled && (
              <button
                type="button"
                onClick={() => onFulfilled(request.id)}
                className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-600"
              >
                ✓ পাওয়া গেছে
              </button>
            )}
          </div>
        </div>
      )}
      {compact && !done && (
        <Link href={findHref} className="mt-3 block rounded-xl bg-red-50 py-2 text-center text-sm font-semibold text-red-700">
          কাছের ডোনার খুঁজুন →
        </Link>
      )}
    </article>
  );
}
