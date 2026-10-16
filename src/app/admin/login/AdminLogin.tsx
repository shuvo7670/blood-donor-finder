"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Field, inputClass } from "@/components/ui";
import { api } from "@/lib/client";

export default function AdminLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const res = await api("/api/admin/session", { body: { username: form.get("username"), password: form.get("password") } });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    const next = params.get("next");
    router.replace(next?.startsWith("/admin") ? next : "/admin");
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-stone-100 p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="text-4xl">🩸</div>
          <h1 className="mt-1 text-xl font-bold">রক্তবন্ধু অ্যাডমিন</h1>
          <p className="text-sm text-stone-500">অ্যাডমিন ও মডারেটরদের জন্য</p>
        </div>
        <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <Field label="ইউজারনেম">
            <input name="username" autoComplete="username" autoCapitalize="none" className={inputClass} required />
          </Field>
          <Field label="পাসওয়ার্ড">
            <input name="password" type="password" autoComplete="current-password" className={inputClass} required />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-stone-900 py-3 font-semibold text-white disabled:opacity-60">
            {busy ? "…" : "লগইন"}
          </button>
        </form>
        <Link href="/" className="block text-center text-sm text-stone-500">
          ← মূল সাইটে ফিরুন
        </Link>
      </div>
    </div>
  );
}
