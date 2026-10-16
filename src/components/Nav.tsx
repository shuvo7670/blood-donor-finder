"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "হোম", icon: "🏠", mobile: true },
  { href: "/find", label: "ডোনার খুঁজুন", icon: "🔍", mobile: true },
  { href: "/requests", label: "জরুরি অনুরোধ", icon: "🚨", mobile: true },
  { href: "/blood-banks", label: "ব্লাড ব্যাংক", icon: "🏥", mobile: true },
  { href: "/eligibility", label: "যোগ্যতা", icon: "✅", mobile: false },
  { href: "/me", label: "আমার প্রোফাইল", icon: "👤", mobile: true },
];

export default function Nav() {
  const pathname = usePathname();
  // The admin panel has its own navigation.
  if (pathname.startsWith("/admin")) return null;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-red-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold text-red-600">
            <span aria-hidden className="text-2xl">🩸</span> রক্তবন্ধু
          </Link>
          <nav className="hidden gap-1 lg:flex">
            {LINKS.slice(1).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  isActive(l.href) ? "bg-red-600 text-white" : "text-stone-700 hover:bg-red-50"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/register" className="hidden rounded-full border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 sm:block">
              ডোনার হোন
            </Link>
            <Link href="/requests?new=1" className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
              রক্ত লাগবে
            </Link>
          </div>
        </div>
      </header>

      {/* Bottom tab bar on phones and tablets */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="grid grid-cols-5">
          {LINKS.filter((l) => l.mobile).map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive(l.href) ? "text-red-600" : "text-stone-500"}`}
              >
                <span aria-hidden className="text-lg leading-none">{l.icon}</span>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
