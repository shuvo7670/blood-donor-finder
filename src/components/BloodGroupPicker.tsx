"use client";

import { BLOOD_GROUPS, type BloodGroup } from "@/lib/blood";

export default function BloodGroupPicker({
  value,
  onChange,
  allowAny = false,
  size = "md",
}: {
  value: BloodGroup | "";
  onChange: (group: BloodGroup | "") => void;
  allowAny?: boolean;
  size?: "md" | "lg";
}) {
  const options: (BloodGroup | "")[] = allowAny ? ["", ...BLOOD_GROUPS] : [...BLOOD_GROUPS];
  return (
    <div role="radiogroup" className={`grid gap-2 ${allowAny ? "grid-cols-5 sm:grid-cols-9" : "grid-cols-4"}`}>
      {options.map((g) => {
        const active = value === g;
        return (
          <button
            key={g || "any"}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(g)}
            className={`rounded-xl border font-bold transition ${size === "lg" ? "py-3 text-lg" : "py-2 text-sm"} ${
              active
                ? "border-red-600 bg-red-600 text-white shadow"
                : "border-stone-200 bg-white text-stone-800 hover:border-red-300 hover:bg-red-50"
            }`}
          >
            {g || "সব"}
          </button>
        );
      })}
    </div>
  );
}
