"use client";

import Link from "next/link";
import { useState } from "react";
import BloodGroupPicker from "@/components/BloodGroupPicker";
import LocationField from "@/components/LocationField";
import { Field, inputClass } from "@/components/ui";
import { donatesTo, MAX_AGE, MIN_AGE, MIN_WEIGHT_KG, type BloodGroup } from "@/lib/blood";
import { bn, formatDate } from "@/lib/format";
import { CITIES } from "@/lib/geo";
import { api } from "@/lib/client";
import type { DonorDetail, Gender, LatLng } from "@/lib/types";

export default function RegisterForm() {
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | "">("");
  const [gender, setGender] = useState<Gender | "">("");
  const [point, setPoint] = useState<LatLng | null>(null);
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [available, setAvailable] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<DonorDetail | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (form.get("pin") !== form.get("pin2")) {
      setErrors({ pin2: "দুটি পিন মেলেনি।" });
      return;
    }
    setSubmitting(true);
    const res = await api<{ donor: DonorDetail }>("/api/donors", {
      body: {
        ...Object.fromEntries(form),
        bloodGroup,
        gender,
        area,
        city,
        available,
        lat: point?.lat,
        lng: point?.lng,
      },
    });
    setSubmitting(false);
    if (res.ok) {
      setCreated(res.data.donor);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors(Object.keys(res.errors).length ? res.errors : { form: res.error });
  }

  if (created) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4 text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-bold">ধন্যবাদ, {created.name}!</h1>
        {created.status === "pending" ? (
          <p className="rounded-2xl bg-amber-50 p-4 text-amber-900">
            আপনার নিবন্ধন জমা হয়েছে। একজন মডারেটর তথ্য যাচাই করে অনুমোদন দিলেই আপনি ডোনার তালিকায় দেখাবেন। অবস্থা দেখতে পারবেন “আমার প্রোফাইল”-এ।
          </p>
        ) : (
          <p className="text-stone-600">
            আপনি এখন <b className="text-red-600">{created.bloodGroup}</b> রক্তদাতা হিসেবে তালিকায় আছেন। {created.area}-এর কাছে কারো রক্ত লাগলে
            তারা আপনাকে খুঁজে পাবেন।
          </p>
        )}
        <div className="rounded-2xl bg-red-50 p-4 text-left text-sm text-red-900">
          <p>
            আপনার রক্ত নিতে পারবেন: <b>{donatesTo(created.bloodGroup).join(", ")}</b>
          </p>
          {created.nextEligibleDate && <p className="mt-1">পরবর্তী রক্তদান: {formatDate(created.nextEligibleDate)} থেকে</p>}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/me" className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white">
            আমার প্রোফাইল
          </Link>
          <Link href="/requests" className="rounded-xl border border-stone-200 px-5 py-3 font-semibold">
            জরুরি অনুরোধগুলো দেখুন
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-xl font-bold">রক্তদাতা হিসেবে নিবন্ধন করুন</h1>
      <p className="mb-4 text-sm text-stone-500">
        আপনার এক ব্যাগ রক্ত তিনজন মানুষের জীবন বাঁচাতে পারে। শর্ত: বয়স {bn(MIN_AGE)}–{bn(MAX_AGE)} বছর, ওজন কমপক্ষে{" "}
        {bn(MIN_WEIGHT_KG)} কেজি।{" "}
        <Link href="/eligibility" className="text-red-600 underline">
          যোগ্যতা যাচাই করুন
        </Link>
        {" · "}আগে নিবন্ধন করেছেন?{" "}
        <Link href="/me" className="text-red-600 underline">
          লগইন
        </Link>
      </p>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm" noValidate>
        <Field label="পূর্ণ নাম" error={errors.name}>
          <input name="name" className={inputClass} autoComplete="name" aria-invalid={!!errors.name} />
        </Field>
        <Field label="মোবাইল নম্বর" error={errors.phone} hint="রোগীর স্বজনরা এই নম্বরে যোগাযোগ করবেন">
          <input name="phone" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" className={inputClass} autoComplete="tel" aria-invalid={!!errors.phone} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="পিন (৪–৬ সংখ্যা)" error={errors.pin} hint="প্রোফাইলে লগইনের জন্য">
            <input name="pin" type="password" inputMode="numeric" maxLength={6} autoComplete="new-password" className={inputClass} aria-invalid={!!errors.pin} />
          </Field>
          <Field label="পিন আবার দিন" error={errors.pin2}>
            <input name="pin2" type="password" inputMode="numeric" maxLength={6} autoComplete="new-password" className={inputClass} aria-invalid={!!errors.pin2} />
          </Field>
        </div>

        <Field label="রক্তের গ্রুপ" error={errors.bloodGroup}>
          <BloodGroupPicker value={bloodGroup} onChange={setBloodGroup} size="lg" />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="লিঙ্গ" error={errors.gender}>
            <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={inputClass} aria-invalid={!!errors.gender}>
              <option value="">—</option>
              <option value="male">পুরুষ</option>
              <option value="female">নারী</option>
            </select>
          </Field>
          <Field label="বয়স" error={errors.age}>
            <input name="age" type="number" inputMode="numeric" min={MIN_AGE} max={MAX_AGE} className={inputClass} aria-invalid={!!errors.age} />
          </Field>
          <Field label="ওজন (কেজি)" error={errors.weight}>
            <input name="weight" type="number" inputMode="numeric" min={MIN_WEIGHT_KG} className={inputClass} aria-invalid={!!errors.weight} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="শেষ রক্তদানের তারিখ" error={errors.lastDonation} hint="কখনো না দিলে খালি রাখুন">
            <input name="lastDonation" type="date" className={inputClass} />
          </Field>
          <Field label="মোট কতবার দিয়েছেন">
            <input name="totalDonations" type="number" min={0} defaultValue={0} className={inputClass} />
          </Field>
        </div>

        <div className="space-y-1">
          <span className="text-sm font-medium text-stone-700">আপনার লোকেশন</span>
          <LocationField
            value={point}
            onChange={setPoint}
            onArea={(a) => {
              setArea(a.name);
              setCity(a.city);
            }}
            error={errors.location}
          />
          <p className="text-xs text-stone-500">শুধু আশেপাশের দূরত্ব দেখানোর জন্য। চাইলে বাসার বদলে কাছের পরিচিত স্থান বেছে নিন।</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="এলাকা" error={errors.area}>
            <input value={area} onChange={(e) => setArea(e.target.value)} className={inputClass} placeholder="যেমন: মিরপুর ১০" aria-invalid={!!errors.area} />
          </Field>
          <Field label="শহর" error={errors.city}>
            <input value={city} onChange={(e) => setCity(e.target.value)} list="cities" className={inputClass} aria-invalid={!!errors.city} />
            <datalist id="cities">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>

        <label className="flex items-start gap-3 rounded-xl bg-stone-50 p-3">
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="mt-1 size-4 accent-red-600" />
          <span className="text-sm">
            <b>এখন যোগাযোগের জন্য প্রস্তুত</b>
            <span className="block text-stone-500">বন্ধ রাখলে আপনি তালিকায় থাকবেন, কিন্তু “এখন দিতে পারবেন” ফিল্টারে আসবেন না।</span>
          </span>
        </label>

        {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
        {Object.keys(errors).length > 0 && !errors.form && <p className="text-sm text-red-600">লাল চিহ্নিত ঘরগুলো ঠিক করুন।</p>}

        <button type="submit" disabled={submitting} className="w-full rounded-xl bg-red-600 py-3 text-lg font-semibold text-white disabled:opacity-60">
          {submitting ? "নিবন্ধন হচ্ছে…" : "🩸 নিবন্ধন করুন"}
        </button>
      </form>
    </div>
  );
}
