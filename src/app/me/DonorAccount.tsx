"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LocationField from "@/components/LocationField";
import RequestCard from "@/components/RequestCard";
import Sheet from "@/components/Sheet";
import { Field, inputClass } from "@/components/ui";
import { api } from "@/lib/client";
import { DONATION_GAP_DAYS, donatesTo } from "@/lib/blood";
import { bn, formatDate } from "@/lib/format";
import type { Donation, DonorDetail, DonorStatus, LatLng, RequestResult } from "@/lib/types";

type MeData = {
  donor: DonorDetail;
  donations: Donation[];
  nearbyRequests: RequestResult[];
  respondedRequestIds: string[];
};

const STATUS: Record<DonorStatus, { label: string; className: string }> = {
  pending: { label: "অনুমোদনের অপেক্ষায়", className: "bg-amber-100 text-amber-800" },
  approved: { label: "অনুমোদিত", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "বাতিল", className: "bg-red-100 text-red-800" },
  suspended: { label: "স্থগিত", className: "bg-red-100 text-red-800" },
};

export default function DonorAccount() {
  // undefined: loading; null: signed out.
  const [data, setData] = useState<MeData | null | undefined>(undefined);
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    let stale = false;
    api<MeData>("/api/me").then((res) => !stale && setData(res.ok ? res.data : null));
    return () => {
      stale = true;
    };
  }, [version]);

  if (data === undefined) return <p className="p-6 text-center text-stone-500">লোড হচ্ছে…</p>;
  if (data === null) return <LoginForm onLoggedIn={reload} />;
  return <Dashboard data={data} setData={setData} reload={reload} />;
}

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const res = await api("/api/me/login", { body: { phone: form.get("phone"), pin: form.get("pin") } });
    setBusy(false);
    if (res.ok) onLoggedIn();
    else setError(res.error);
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 p-4 pt-8">
      <div className="text-center">
        <div className="text-5xl">🩸</div>
        <h1 className="mt-2 text-xl font-bold">ডোনার লগইন</h1>
        <p className="text-sm text-stone-500">প্রাপ্যতা আপডেট, রক্তদানের হিসাব আর কাছের অনুরোধ দেখুন</p>
      </div>
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <Field label="মোবাইল নম্বর">
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" className={inputClass} required />
        </Field>
        <Field label="পিন">
          <input name="pin" type="password" inputMode="numeric" autoComplete="current-password" maxLength={6} className={inputClass} required />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white disabled:opacity-60">
          {busy ? "…" : "লগইন"}
        </button>
      </form>
      <p className="text-center text-sm text-stone-600">
        নতুন?{" "}
        <Link href="/register" className="font-semibold text-red-600">
          ডোনার হিসেবে নিবন্ধন করুন
        </Link>
      </p>
      <p className="text-center text-xs text-stone-400">পিন ভুলে গেলে অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
    </div>
  );
}

function Dashboard({
  data,
  setData,
  reload,
}: {
  data: MeData;
  setData: (d: MeData | null) => void;
  reload: () => void;
}) {
  const { donor, donations, nearbyRequests, respondedRequestIds } = data;
  const [sheet, setSheet] = useState<"donation" | "profile" | "pin" | "delete" | null>(null);
  const [toggling, setToggling] = useState(false);

  async function toggleAvailable() {
    setToggling(true);
    const res = await api<{ donor: DonorDetail }>("/api/me", { method: "PATCH", body: { available: !donor.available } });
    setToggling(false);
    if (res.ok) setData({ ...data, donor: res.data.donor });
  }

  async function logout() {
    await api("/api/me/logout", { method: "POST" });
    setData(null);
  }

  async function removeDonation(id: string) {
    const res = await api<Pick<MeData, "donor" | "donations">>(`/api/me/donations/${id}`, { method: "DELETE" });
    if (res.ok) setData({ ...data, ...res.data });
  }

  const status = STATUS[donor.status];

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4">
      <section className="rounded-3xl bg-gradient-to-br from-red-600 to-red-700 p-5 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white text-2xl font-bold text-red-600">{donor.bloodGroup}</div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold">{donor.name}</h1>
            <p className="text-sm text-red-100">
              📍 {donor.area}, {donor.city}
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>
              {donor.verified && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">✓ যাচাইকৃত</span>}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/15 p-2">
            <div className="text-xl font-bold">{bn(donor.totalDonations)}</div>
            <div className="text-xs text-red-100">বার রক্তদান</div>
          </div>
          <div className="rounded-2xl bg-white/15 p-2">
            <div className="text-xl font-bold">{bn(donor.totalDonations * 3)}</div>
            <div className="text-xs text-red-100">জীবন বাঁচাতে সাহায্য</div>
          </div>
          <div className="rounded-2xl bg-white/15 p-2">
            <div className="text-xl font-bold">{bn(donor.contactViews)}</div>
            <div className="text-xs text-red-100">বার নম্বর দেখা হয়েছে</div>
          </div>
        </div>
      </section>

      {donor.status !== "approved" && (
        <p className={`rounded-xl p-3 text-sm ${donor.status === "pending" ? "bg-amber-50 text-amber-900" : "bg-red-50 text-red-900"}`}>
          {donor.status === "pending"
            ? "আপনার প্রোফাইল একজন মডারেটর যাচাই করছেন। অনুমোদনের পর আপনি সার্চে দেখাবেন।"
            : `আপনার প্রোফাইল ${status.label} করা হয়েছে${donor.statusReason ? `: ${donor.statusReason}` : "।"} প্রশ্ন থাকলে অ্যাডমিনের সাথে যোগাযোগ করুন।`}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">যোগাযোগের জন্য প্রস্তুত</p>
              <p className="text-xs text-stone-500">বন্ধ করলে “এখন দিতে পারবেন” তালিকায় আসবেন না</p>
            </div>
            <button
              role="switch"
              aria-checked={donor.available}
              disabled={toggling}
              onClick={toggleAvailable}
              className={`relative h-8 w-14 shrink-0 rounded-full transition ${donor.available ? "bg-emerald-500" : "bg-stone-300"}`}
            >
              <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${donor.available ? "left-7" : "left-1"}`} />
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          {donor.eligible ? (
            <p className="font-semibold text-emerald-700">✅ আপনি এখন রক্ত দিতে পারবেন</p>
          ) : donor.nextEligibleDate ? (
            <>
              <p className="font-semibold text-amber-700">⏳ বিশ্রামের সময় চলছে</p>
              <p className="text-sm text-stone-600">
                {formatDate(donor.nextEligibleDate)} থেকে আবার দিতে পারবেন (প্রতি {bn(DONATION_GAP_DAYS)} দিনে একবার)
              </p>
            </>
          ) : (
            <p className="font-semibold text-stone-600">প্রাপ্যতা বন্ধ আছে</p>
          )}
          <p className="mt-1 text-xs text-stone-500">আপনার রক্ত নিতে পারবেন: {donatesTo(donor.bloodGroup).join(", ")}</p>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">রক্তদানের ইতিহাস</h2>
          <button onClick={() => setSheet("donation")} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white">
            + রক্ত দিয়েছি
          </button>
        </div>
        {donations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 p-5 text-center text-sm text-stone-600">এখনো কোনো রক্তদান যোগ করা হয়নি।</p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-2xl bg-white shadow-sm">
            {donations.map((d) => (
              <li key={d.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="text-xl">🩸</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{formatDate(d.date)}</p>
                  {(d.place || d.note) && <p className="truncate text-stone-500">{[d.place, d.note].filter(Boolean).join(" · ")}</p>}
                </div>
                <button onClick={() => removeDonation(d.id)} className="text-xs text-stone-400 hover:text-red-600" aria-label="মুছুন">
                  মুছুন
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {donor.status === "approved" && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">আপনার কাছে রক্ত লাগবে ({bn(nearbyRequests.length)})</h2>
          <p className="text-sm text-stone-500">৩০ কিমির মধ্যে খোলা অনুরোধ, যেগুলোতে আপনার গ্রুপের রক্ত দেওয়া যায়</p>
          {nearbyRequests.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 p-5 text-center text-sm text-stone-600">এই মুহূর্তে কাছে কোনো অনুরোধ নেই।</p>
          ) : (
            <div className="space-y-3">
              {nearbyRequests.map((r) => (
                <RequestCard key={r.id} request={r} responded={respondedRequestIds.includes(r.id)} onResponded={reload} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <button onClick={() => setSheet("profile")} className="rounded-xl border border-stone-200 bg-white py-3 font-medium">
          ✏️ প্রোফাইল এডিট
        </button>
        <button onClick={() => setSheet("pin")} className="rounded-xl border border-stone-200 bg-white py-3 font-medium">
          🔑 পিন পরিবর্তন
        </button>
        <button onClick={logout} className="rounded-xl border border-stone-200 bg-white py-3 font-medium">
          ↩ লগআউট
        </button>
        <button onClick={() => setSheet("delete")} className="rounded-xl border border-red-200 bg-white py-3 font-medium text-red-700">
          🗑 একাউন্ট মুছুন
        </button>
      </section>

      {sheet === "donation" && (
        <DonationSheet
          onClose={() => setSheet(null)}
          onSaved={(next) => {
            setData({ ...data, ...next });
            setSheet(null);
          }}
        />
      )}
      {sheet === "profile" && (
        <ProfileSheet
          donor={donor}
          onClose={() => setSheet(null)}
          onSaved={(d) => {
            setData({ ...data, donor: d });
            setSheet(null);
          }}
        />
      )}
      {sheet === "pin" && <PinSheet onClose={() => setSheet(null)} />}
      {sheet === "delete" && <DeleteSheet onClose={() => setSheet(null)} onDeleted={() => setData(null)} />}
    </div>
  );
}

function localToday() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function DonationSheet({ onClose, onSaved }: { onClose: () => void; onSaved: (d: Pick<MeData, "donor" | "donations">) => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [today] = useState(localToday);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const res = await api<Pick<MeData, "donor" | "donations">>("/api/me/donations", { body: Object.fromEntries(form) });
    setBusy(false);
    if (res.ok) onSaved(res.data);
    else setErrors(Object.keys(res.errors).length ? res.errors : { form: res.error });
  }

  return (
    <Sheet title="রক্তদান যোগ করুন" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="তারিখ" error={errors.date}>
          <input name="date" type="date" defaultValue={today} max={today} className={inputClass} required />
        </Field>
        <Field label="কোথায় (ঐচ্ছিক)">
          <input name="place" className={inputClass} placeholder="হাসপাতাল / ব্লাড ব্যাংক" />
        </Field>
        <Field label="নোট (ঐচ্ছিক)">
          <input name="note" className={inputClass} />
        </Field>
        {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white disabled:opacity-60">
          সংরক্ষণ করুন
        </button>
        <p className="text-xs text-stone-500">শেষ রক্তদানের তারিখ আর পরবর্তী যোগ্যতার তারিখ নিজে থেকেই আপডেট হবে।</p>
      </form>
    </Sheet>
  );
}

function ProfileSheet({ donor, onClose, onSaved }: { donor: DonorDetail; onClose: () => void; onSaved: (d: DonorDetail) => void }) {
  const [point, setPoint] = useState<LatLng | null>({ lat: donor.lat, lng: donor.lng });
  const [area, setArea] = useState(donor.area);
  const [city, setCity] = useState(donor.city);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const res = await api<{ donor: DonorDetail }>("/api/me", {
      method: "PATCH",
      body: { ...Object.fromEntries(form), area, city, lat: point?.lat, lng: point?.lng },
    });
    setBusy(false);
    if (res.ok) onSaved(res.data.donor);
    else setErrors(Object.keys(res.errors).length ? res.errors : { form: res.error });
  }

  return (
    <Sheet title="প্রোফাইল এডিট" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="নাম" error={errors.name}>
          <input name="name" defaultValue={donor.name} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="বয়স" error={errors.age}>
            <input name="age" type="number" defaultValue={donor.age} className={inputClass} />
          </Field>
          <Field label="ওজন (কেজি)" error={errors.weight}>
            <input name="weight" type="number" defaultValue={donor.weight} className={inputClass} />
          </Field>
        </div>
        <LocationField
          value={point}
          onChange={setPoint}
          onArea={(a) => {
            setArea(a.name);
            setCity(a.city);
          }}
          error={errors.location}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="এলাকা" error={errors.area}>
            <input value={area} onChange={(e) => setArea(e.target.value)} className={inputClass} />
          </Field>
          <Field label="শহর" error={errors.city}>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <p className="text-xs text-stone-500">রক্তের গ্রুপ বা মোবাইল নম্বর বদলাতে অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
        {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white disabled:opacity-60">
          সংরক্ষণ করুন
        </button>
      </form>
    </Sheet>
  );
}

function PinSheet({ onClose }: { onClose: () => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await api("/api/me/pin", { body: { current: form.get("current"), next: form.get("next") } });
    if (res.ok) setDone(true);
    else setErrors(Object.keys(res.errors).length ? res.errors : { form: res.error });
  }

  return (
    <Sheet title="পিন পরিবর্তন" onClose={onClose}>
      {done ? (
        <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">✓ পিন পরিবর্তন হয়েছে।</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <Field label="বর্তমান পিন" error={errors.current}>
            <input name="current" type="password" inputMode="numeric" maxLength={6} className={inputClass} />
          </Field>
          <Field label="নতুন পিন (৪–৬ সংখ্যা)" error={errors.next}>
            <input name="next" type="password" inputMode="numeric" maxLength={6} className={inputClass} />
          </Field>
          {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
          <button className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white">পরিবর্তন করুন</button>
        </form>
      )}
    </Sheet>
  );
}

function DeleteSheet({ onClose, onDeleted }: { onClose: () => void; onDeleted: () => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await api("/api/me", { method: "DELETE", body: { pin: form.get("pin") } });
    if (res.ok) onDeleted();
    else setErrors(Object.keys(res.errors).length ? res.errors : { form: res.error });
  }

  return (
    <Sheet title="একাউন্ট মুছে ফেলুন" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-900">
          আপনার প্রোফাইল ও রক্তদানের ইতিহাস স্থায়ীভাবে মুছে যাবে। এটি ফেরানো যাবে না। সাময়িক বিরতির জন্য শুধু “যোগাযোগের জন্য প্রস্তুত” বন্ধ রাখতে পারেন।
        </p>
        <Field label="নিশ্চিত করতে পিন দিন" error={errors.pin}>
          <input name="pin" type="password" inputMode="numeric" maxLength={6} className={inputClass} />
        </Field>
        {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
        <button className="w-full rounded-xl bg-red-700 py-3 font-semibold text-white">স্থায়ীভাবে মুছুন</button>
      </form>
    </Sheet>
  );
}
