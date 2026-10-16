"use client";

import Link from "next/link";
import ReportButton from "@/components/ReportButton";
import RespondButton from "@/components/RespondButton";
import { bn, directionsUrl, formatDistance, isPast, relativeTime } from "@/lib/format";
import type { RequestResult, RequestStatus, Urgency } from "@/lib/types";

export const URGENCY: Record<Urgency, { label: string; className: string }> = {
  critical: { label: "অতি জরুরি", className: "bg-red-600 text-white" },
  urgent: { label: "জরুরি", className: "bg-amber-100 text-amber-800" },
  normal: { label: "সাধারণ", className: "bg-stone-100 text-stone-700" },
};

export const REQUEST_STATUS: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: "অনুমোদনের অপেক্ষায়", className: "bg-amber-100 text-amber-800" },
  open: { label: "চলমান", className: "bg-sky-100 text-sky-800" },
  fulfilled: { label: "✓ রক্ত পাওয়া গেছে", className: "bg-emerald-100 text-emerald-800" },
  closed: { label: "বন্ধ", className: "bg-stone-200 text-stone-700" },
  rejected: { label: "বাতিল", className: "bg-red-100 text-red-800" },
};

export function findDonorsHref(request: Pick<RequestResult, "bloodGroup" | "lat" | "lng" | "hospital">) {
  return `/find?${new URLSearchParams({
    group: request.bloodGroup,
    compatible: "1",
    lat: String(request.lat),
    lng: String(request.lng),
    radius: "10",
    label: request.hospital,
  })}`;
}

export default function RequestCard({
  request,
  compact = false,
  responded = false,
  onResponded,
}: {
  request: RequestResult;
  compact?: boolean;
  /** The signed-in donor already answered this one. */
  responded?: boolean;
  onResponded?: () => void;
}) {
  const open = request.status === "open";
  const overdue = open && isPast(request.neededBy);

  return (
    <article className={`rounded-2xl border bg-white p-4 shadow-sm ${open ? "border-red-100" : "border-stone-200 opacity-75"}`}>
      <div className="flex items-start gap-3">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-red-50 text-center">
          <span className="text-lg font-bold leading-none text-red-600">{request.bloodGroup}</span>
          <span className="text-[11px] text-red-700">{bn(request.bags)} ব্যাগ</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                open ? URGENCY[request.urgency].className : REQUEST_STATUS[request.status].className
              }`}
            >
              {open ? URGENCY[request.urgency].label : REQUEST_STATUS[request.status].label}
            </span>
            <span className={`text-xs ${overdue ? "text-red-600" : "text-stone-500"}`}>⏰ {relativeTime(request.neededBy)} লাগবে</span>
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
                {request.responseCount > 0 && <span className="text-emerald-700"> · {bn(request.responseCount)} জন সাড়া দিয়েছেন</span>}
              </p>
            </>
          )}
        </div>
      </div>

      {open && !compact && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            {responded ? (
              <span className="flex-1 rounded-xl bg-emerald-50 py-2 text-center text-sm font-semibold text-emerald-700">✓ আপনি সাড়া দিয়েছেন</span>
            ) : (
              <RespondButton request={request} onDone={onResponded} />
            )}
            <a href={`tel:${request.phone}`} className="rounded-xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800">
              📞 কল
            </a>
            <a href={directionsUrl(request.lat, request.lng)} target="_blank" rel="noreferrer" className="rounded-xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800">
              🧭
            </a>
          </div>
          <div className="flex items-center justify-between">
            <Link href={findDonorsHref(request)} className="text-sm font-semibold text-red-700">
              🔍 কাছের ডোনার খুঁজুন →
            </Link>
            <ReportButton targetType="request" targetId={request.id} />
          </div>
        </div>
      )}
      {compact && open && (
        <Link href={findDonorsHref(request)} className="mt-3 block rounded-xl bg-red-50 py-2 text-center text-sm font-semibold text-red-700">
          কাছের ডোনার খুঁজুন →
        </Link>
      )}
    </article>
  );
}
