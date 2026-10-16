"use client";

import { useEffect, useState } from "react";
import { inputClass } from "@/components/ui";
import { api } from "@/lib/client";
import type { Settings } from "@/lib/types";
import { useAdmin } from "../AdminShell";
import { PageTitle } from "../ui";

export default function AdminSettings() {
  const { staff } = useAdmin();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ settings: Settings }>("/api/admin/settings").then((res) => res.ok && setSettings(res.data.settings));
  }, []);

  async function save(patch: Partial<Settings>) {
    setSaved(false);
    setError(null);
    const res = await api<{ settings: Settings }>("/api/admin/settings", { method: "PUT", body: patch });
    if (res.ok) {
      setSettings(res.data.settings);
      setSaved(true);
    } else setError(res.error);
  }

  if (staff.role !== "admin") return <p>শুধু অ্যাডমিন এই পেজ দেখতে পারেন।</p>;
  if (!settings) return <p className="text-stone-500">লোড হচ্ছে…</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <PageTitle title="সেটিংস" />
      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">অনুমোদন</h2>
        <Toggle
          label="নতুন ডোনার স্বয়ংক্রিয়ভাবে অনুমোদন"
          hint="বন্ধ থাকলে প্রতিটি নিবন্ধন মডারেটর যাচাই করবেন, তারপর সার্চে দেখাবে।"
          checked={settings.autoApproveDonors}
          onChange={(v) => save({ autoApproveDonors: v })}
        />
        <Toggle
          label="নতুন রক্তের অনুরোধ স্বয়ংক্রিয়ভাবে প্রকাশ"
          hint="বন্ধ থাকলে অনুরোধ মডারেটর অনুমোদনের পর প্রকাশ হবে। লগইন করা অনুমোদিত ডোনারদের অনুরোধ সবসময় সাথে সাথে প্রকাশ হয়।"
          checked={settings.autoApproveRequests}
          onChange={(v) => save({ autoApproveRequests: v })}
        />
      </section>
      <section className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">হোম পেজের ঘোষণা</h2>
        <p className="text-sm text-stone-500">যেমন রক্তদান ক্যাম্পের খবর। খালি রাখলে কিছু দেখাবে না।</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save({ announcement: String(new FormData(e.currentTarget).get("announcement") ?? "") });
          }}
          className="space-y-2"
        >
          <textarea name="announcement" defaultValue={settings.announcement} rows={3} maxLength={300} className={inputClass} />
          <button className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white">সংরক্ষণ</button>
        </form>
      </section>
      {saved && <p className="text-sm text-emerald-700">✓ সংরক্ষিত হয়েছে</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-stone-500">{hint}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${checked ? "bg-emerald-500" : "bg-stone-300"}`}
      >
        <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${checked ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );
}
