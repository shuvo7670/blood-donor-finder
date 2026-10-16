"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AreaSelect } from "@/components/LocationControls";
import { BLOOD_GROUPS, type BloodGroup } from "@/lib/blood";

export default function HomeSearch() {
  const router = useRouter();
  const [group, setGroup] = useState<BloodGroup | "">("");

  const go = (extra: Record<string, string>) => {
    const query = new URLSearchParams(extra);
    if (group) {
      query.set("group", group);
      query.set("compatible", "1");
    }
    router.push(`/find?${query}`);
  };

  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 text-stone-900 shadow-lg">
      <p className="text-sm font-medium text-stone-600">রোগীর রক্তের গ্রুপ</p>
      <div className="grid grid-cols-4 gap-2">
        {BLOOD_GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(group === g ? "" : g)}
            aria-pressed={group === g}
            className={`rounded-xl border py-3 text-lg font-bold transition ${
              group === g ? "border-red-600 bg-red-600 text-white" : "border-stone-200 hover:bg-red-50"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => go({ near: "me" })}
        className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white shadow"
      >
        📍 আমার আশেপাশে ডোনার খুঁজুন
      </button>
      <div className="flex items-center gap-2 text-xs text-stone-400">
        <span className="h-px flex-1 bg-stone-200" /> অথবা এলাকা বেছে নিন <span className="h-px flex-1 bg-stone-200" />
      </div>
      <AreaSelect
        value=""
        className="w-full"
        onChange={(a) => go({ lat: String(a.lat), lng: String(a.lng), label: `${a.name}, ${a.city}` })}
      />
    </div>
  );
}
