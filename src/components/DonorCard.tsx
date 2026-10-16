"use client";

import { forwardRef } from "react";
import { directionsUrl, formatDate, formatDistance, internationalPhone, bn } from "@/lib/format";
import type { DonorResult } from "@/lib/types";

export function ContactButtons({ phone, name, lat, lng }: { phone: string; name: string; lat?: number; lng?: number }) {
  const btn = "flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-sm font-semibold";
  return (
    <div className="flex gap-2">
      <a href={`tel:${phone}`} className={`${btn} bg-red-600 text-white`} aria-label={`${name}-কে কল করুন`}>
        📞 কল
      </a>
      <a
        href={`https://wa.me/${internationalPhone(phone)}`}
        target="_blank"
        rel="noreferrer"
        className={`${btn} bg-emerald-600 text-white`}
      >
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

type Props = {
  donor: DonorResult;
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
            {donor.verified && (
              <span className="rounded-full bg-sky-50 px-2 text-xs font-medium text-sky-700">✓ যাচাইকৃত</span>
            )}
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
          <p className="text-sm text-stone-600">
            {donor.lastDonation ? `শেষ রক্তদান: ${formatDate(donor.lastDonation)}` : "আগে কখনো রক্ত দেননি"}
            {" · "}বয়স {bn(donor.age)}
          </p>
          <ContactButtons phone={donor.phone} name={donor.name} lat={donor.lat} lng={donor.lng} />
        </div>
      )}
    </li>
  );
});

export default DonorCard;
