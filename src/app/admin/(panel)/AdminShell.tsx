"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Field, inputClass } from "@/components/ui";
import { api } from "@/lib/client";
import { bn } from "@/lib/format";
import type { Staff } from "@/lib/types";

type Queue = { pendingDonors: number; pendingRequests: number; openReports: number };
type Ctx = { staff: Staff; queue: Queue; refreshQueue: () => void };

const AdminContext = createContext<Ctx | null>(null);

export function useAdmin(): Ctx {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin outside AdminShell");
  return ctx;
}

const NAV: { href: string; label: string; icon: string; badge?: keyof Queue; adminOnly?: boolean }[] = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: "📊" },
  { href: "/admin/donors", label: "ডোনার", icon: "🩸", badge: "pendingDonors" },
  { href: "/admin/requests", label: "অনুরোধ", icon: "🚨", badge: "pendingRequests" },
  { href: "/admin/reports", label: "রিপোর্ট", icon: "⚑", badge: "openReports" },
  { href: "/admin/blood-banks", label: "ব্লাড ব্যাংক", icon: "🏥" },
  { href: "/admin/staff", label: "স্টাফ", icon: "👥", adminOnly: true },
  { href: "/admin/settings", label: "সেটিংস", icon: "⚙️", adminOnly: true },
  { href: "/admin/audit", label: "কার্যক্রম লগ", icon: "📜", adminOnly: true },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<{ staff: Staff; queue: Queue } | null>(null);
  const [version, setVersion] = useState(0);
  const refreshQueue = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    api<{ staff: Staff; queue: Queue }>("/api/admin/session").then((res) => {
      if (res.ok) setSession(res.data);
      else router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    });
  }, [version, router, pathname]);

  async function logout() {
    await api("/api/admin/session", { method: "DELETE" });
    router.replace("/admin/login");
  }

  if (!session) return <p className="p-8 text-center text-stone-500">লোড হচ্ছে…</p>;
  const { staff, queue } = session;
  if (staff.mustChangePassword) return <ForcePasswordChange onDone={refreshQueue} />;

  const links = NAV.filter((n) => !n.adminOnly || staff.role === "admin");
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <AdminContext.Provider value={{ staff, queue, refreshQueue }}>
      <div className="min-h-dvh bg-stone-100 lg:grid lg:grid-cols-[230px_1fr]">
        <aside className="sticky top-0 z-40 border-b border-stone-200 bg-stone-900 text-stone-200 lg:h-dvh lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-4 py-3 lg:py-5">
            <Link href="/admin" className="font-bold text-white">
              🩸 রক্তবন্ধু <span className="text-xs font-normal text-stone-400">অ্যাডমিন</span>
            </Link>
            <Link href="/" className="text-xs text-stone-400 lg:hidden">
              সাইট ↗
            </Link>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:overflow-visible">
            {links.map((n) => {
              const count = n.badge ? queue[n.badge] : 0;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                    isActive(n.href) ? "bg-white text-stone-900" : "hover:bg-stone-800"
                  }`}
                >
                  <span aria-hidden>{n.icon}</span>
                  <span className="whitespace-nowrap">{n.label}</span>
                  {count > 0 && <span className="ml-auto rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">{bn(count)}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="hidden px-4 py-4 text-sm lg:absolute lg:bottom-0 lg:block lg:w-full">
            <p className="font-medium text-white">{staff.name}</p>
            <p className="text-xs text-stone-400">
              {staff.role === "admin" ? "অ্যাডমিন" : "মডারেটর"} · @{staff.username}
            </p>
            <div className="mt-2 flex gap-3 text-xs">
              <Link href="/" className="text-stone-400 hover:text-white">
                সাইট দেখুন ↗
              </Link>
              <button onClick={logout} className="text-stone-400 hover:text-white">
                লগআউট
              </button>
            </div>
          </div>
        </aside>
        <main className="min-w-0 p-4 lg:p-6">
          {children}
          <div className="mt-8 flex justify-between text-xs text-stone-500 lg:hidden">
            <span>
              {staff.name} ({staff.role === "admin" ? "অ্যাডমিন" : "মডারেটর"})
            </span>
            <button onClick={logout} className="underline">
              লগআউট
            </button>
          </div>
        </main>
      </div>
    </AdminContext.Provider>
  );
}

function ForcePasswordChange({ onDone }: { onDone: () => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (form.get("next") !== form.get("next2")) return setErrors({ next2: "দুটি পাসওয়ার্ড মেলেনি।" });
    const res = await api("/api/admin/password", { body: { current: form.get("current"), next: form.get("next") } });
    if (res.ok) onDone();
    else setErrors(Object.keys(res.errors).length ? res.errors : { form: res.error });
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-stone-100 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-lg font-bold">নতুন পাসওয়ার্ড দিন</h1>
        <p className="text-sm text-stone-600">নিরাপত্তার জন্য প্রথম লগইনে (বা পাসওয়ার্ড রিসেটের পর) পাসওয়ার্ড বদলাতে হবে।</p>
        <Field label="বর্তমান পাসওয়ার্ড" error={errors.current}>
          <input name="current" type="password" autoComplete="current-password" className={inputClass} />
        </Field>
        <Field label="নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)" error={errors.next}>
          <input name="next" type="password" autoComplete="new-password" className={inputClass} />
        </Field>
        <Field label="নতুন পাসওয়ার্ড আবার" error={errors.next2}>
          <input name="next2" type="password" autoComplete="new-password" className={inputClass} />
        </Field>
        {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
        <button className="w-full rounded-xl bg-stone-900 py-3 font-semibold text-white">সংরক্ষণ করুন</button>
      </form>
    </div>
  );
}
