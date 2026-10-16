import type { ReactNode } from "react";

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
      {error ? <span className="block text-xs text-red-600">{error}</span> : hint && <span className="block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-base outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 aria-[invalid=true]:border-red-400";
