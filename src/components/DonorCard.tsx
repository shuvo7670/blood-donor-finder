"use client";

import { forwardRef, useState } from "react";
import ReportButton from "@/components/ReportButton";
import { api } from "@/lib/client";
import { bn, directionsUrl, formatDate, formatDistance, internationalPhone } from "@/lib/format";
import type { PublicDonor } from "@/lib/types";

export function ContactButtons({ phone, name, lat, lng }: { phone: string; name: string; lat?: number; lng?: number }) {
  const btn = "flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-sm font-semibold";
  return (
    <div className="flex gap-2">
      <a href={`tel:${phone}`} className={`${btn} bg-red-600 text-white`} aria-label={`${name}-কে কল করুন`}>
        📞 কল
      </a>
      <a href={`https://wa.me/${internationalPhone(phone)}`} target="_blank" rel="noreferrer" className={`${btn} bg-emerald-600 text-white`}>
        💬 WhatsApp
      </a>
      {lat !== undefined && lng !== undefined && (
        <a href={directionsUrl(lat, lng)} target="_blank" rel="noreferrer" className={`${btn} bg-stone-100 text-stone-800`}>
          🧭 পথ
        </a>
      )}
    </div>
  );
}

/** Numbers are masked in lists; one tap fetches the real one (rate limited server-side). */
function RevealContact({ donor }: { donor: PublicDonor }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reveal() {
    setLoading(true);
    const res = await api<{ phone: string }>(`/api/donors/${donor.id}/contact`, { method: "POST" });
    setLoading(false);
    if (res.ok) setPhone(res.data.phone);
    else setError(res.error);
  }

  if (phone) {
    return (
      <div className="space-y-2">
        <p className="text-center font-mono text-lg font-semibold tracking-wide">{phone}</p>
        <ContactButtons phone={phone} name={donor.name} lat={donor.lat} lng={donor.lng} />
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={reveal}
        disabled={loading}
        className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "…" : `📞 নম্বর দেখুন (${donor.phoneMasked})`}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

type Props = {
  donor: PublicDonor;
  selected?: boolean;
  onSelect?: () => void;
};

const DonorCard = forwardRef<HTMLLIElement, Props>(function DonorCard({ donor, selected, onSelect }, ref) {
  return (
    <li
      ref={ref}
      onClick={onSelect}
      className={`cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition ${
        selected ? "border-red-500 ring-2 ring-red-200" : "border-stone-200 hover:border-red-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid size-12 shrink-0 place-items-center rounded-full text-base font-bold text-white ${
            donor.eligible ? "bg-red-600" : "bg-stone-400"
          }`}
        >
          {donor.bloodGroup}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <h3 className="truncate font-semibold">{donor.name}</h3>
            {donor.verified && <span className="rounded-full bg-sky-50 px-2 text-xs font-medium text-sky-700">✓ যাচাইকৃত</span>}
          </div>
          <p className="text-sm text-stone-500">
            📍 {donor.area}, {donor.city}
            {donor.distanceKm !== null && <span className="font-medium text-stone-700"> · {formatDistance(donor.distanceKm)} দূরে</span>}
          </p>
          <p className="mt-1 text-xs">
            {donor.eligible ? (
              <span className="font-medium text-emerald-700">● এখন রক্ত দিতে পারবেন</span>
            ) : !donor.available ? (
              <span className="text-stone-500">● এখন সাড়া দিচ্ছেন না</span>
            ) : (
              <span className="text-amber-700">
                ● {donor.nextEligibleDate ? `${formatDate(donor.nextEligibleDate)} থেকে দিতে পারবেন` : "বিশ্রামে আছেন"}
              </span>
            )}
            <span className="text-stone-400">
              {" · "}
              {donor.totalDonations > 0 ? `${bn(donor.totalDonations)} বার দিয়েছেন` : "নতুন ডোনার"}
            </span>
          </p>
        </div>
      </div>
      {selected && (
        <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between text-sm text-stone-600">
            <span>
              {donor.lastDonation ? `শেষ রক্তদান: ${formatDate(donor.lastDonation)}` : "আগে কখনো রক্ত দেননি"}
              {" · "}বয়স {bn(donor.age)}
            </span>
            <ReportButton targetType="donor" targetId={donor.id} />
          </div>
          <RevealContact donor={donor} />
        </div>
      )}
    </li>
  );
});

export default DonorCard;
