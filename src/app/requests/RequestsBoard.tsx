"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import BloodGroupPicker from "@/components/BloodGroupPicker";
import LocationField from "@/components/LocationField";
import RequestCard, { URGENCY } from "@/components/RequestCard";
import { Field, inputClass } from "@/components/ui";
import type { BloodGroup } from "@/lib/blood";
import type { LatLng, RequestResult, Urgency } from "@/lib/types";

function defaultNeededBy() {
  const d = new Date(Date.now() + 6 * 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function toIso(local: string) {
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export default function RequestsBoard() {
  const params = useSearchParams();
  // The header's "রক্ত লাগবে" link opens the form via ?new=1 until the user closes it.
  const [formToggle, setShowForm] = useState<boolean | null>(null);
  const showForm = formToggle ?? params.get("new") === "1";
  const [group, setGroup] = useState<BloodGroup | "">("");
  const [status, setStatus] = useState<"open" | "all">("open");
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ key: string; requests: RequestResult[] } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const key = `${status}|${group}|${version}`;
  useEffect(() => {
    const query = new URLSearchParams({ status });
    if (group) query.set("group", group);
    let stale = false;
    fetch(`/api/requests?${query}`)
      .then((r) => r.json())
      .then((data) => !stale && setResult({ key, requests: data.requests ?? [] }))
      .catch(() => !stale && setResult({ key, requests: [] }));
    return () => {
      stale = true;
    };
  }, [key, status, group]);

  const load = () => setVersion((v) => v + 1);
  const loading = result?.key !== key;
  const requests = result?.requests ?? [];

  async function markFulfilled(id: string) {
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "fulfilled" }),
    });
    if (res.ok) {
      setNotice("ধন্যবাদ! অনুরোধটি সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে।");
      load();
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">জরুরি রক্তের অনুরোধ</h1>
          <p className="text-sm text-stone-500">কারো রক্ত লাগলে এখানে পোস্ট করুন, ডোনাররা সরাসরি যোগাযোগ করবেন</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="shrink-0 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow"
          >
            + নতুন অনুরোধ
          </button>
        )}
      </div>

      {notice && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
          {notice}
        </p>
      )}

      {showForm && (
        <RequestForm
          onCancel={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            setNotice("অনুরোধ পোস্ট করা হয়েছে। নিচের ‘কাছের ডোনার খুঁজুন’ চাপলে আশেপাশের ডোনারদের তালিকা পাবেন।");
            setStatus("open");
            setGroup("");
            load();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      <div className="space-y-2">
        <BloodGroupPicker value={group} onChange={setGroup} allowAny />
        <div className="flex gap-2 text-sm">
          {(["open", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 ${status === s ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-700"}`}
            >
              {s === "open" ? "চলমান" : "সব (সম্পন্নসহ)"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-stone-500">লোড হচ্ছে…</p>
      ) : requests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-600">
          এই মুহূর্তে কোনো অনুরোধ নেই।
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <RequestCard key={r.id} request={r} onFulfilled={markFulfilled} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | "">("");
  const [urgency, setUrgency] = useState<Urgency>("urgent");
  const [point, setPoint] = useState<LatLng | null>(null);
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...Object.fromEntries(form),
        bags: Number(form.get("bags")),
        neededBy: toIso(String(form.get("neededBy"))),
        bloodGroup,
        urgency,
        area,
        city,
        lat: point?.lat,
        lng: point?.lng,
      }),
    });
    setSubmitting(false);
    if (res.ok) return onCreated();
    const data = await res.json().catch(() => ({}));
    setErrors(data.errors ?? { form: "পোস্ট করা যায়নি, আবার চেষ্টা করুন।" });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-red-100 bg-white p-4 shadow-sm" noValidate>
      <h2 className="text-lg font-semibold">নতুন রক্তের অনুরোধ</h2>

      <Field label="রক্তের গ্রুপ" error={errors.bloodGroup}>
        <BloodGroupPicker value={bloodGroup} onChange={setBloodGroup} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="কত ব্যাগ" error={errors.bags}>
          <input name="bags" type="number" min={1} max={10} defaultValue={1} className={inputClass} />
        </Field>
        <Field label="কখন লাগবে" error={errors.neededBy}>
          <input name="neededBy" type="datetime-local" defaultValue={defaultNeededBy()} className={inputClass} />
        </Field>
      </div>

      <Field label="জরুরিতা" error={errors.urgency}>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(URGENCY) as Urgency[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUrgency(u)}
              className={`rounded-xl border py-2 text-sm font-medium ${
                urgency === u ? "border-red-600 bg-red-600 text-white" : "border-stone-200"
              }`}
            >
              {URGENCY[u].label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="রোগীর নাম" error={errors.patientName}>
        <input name="patientName" className={inputClass} autoComplete="off" />
      </Field>
      <Field label="হাসপাতাল" error={errors.hospital}>
        <input name="hospital" className={inputClass} placeholder="যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল" />
      </Field>

      <div className="space-y-1">
        <span className="text-sm font-medium text-stone-700">হাসপাতালের লোকেশন</span>
        <LocationField
          value={point}
          onChange={setPoint}
          onArea={(a) => {
            setArea(a.name);
            setCity(a.city);
          }}
          error={errors.location}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="এলাকা" error={errors.area}>
          <input value={area} onChange={(e) => setArea(e.target.value)} className={inputClass} />
        </Field>
        <Field label="শহর">
          <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="যোগাযোগকারীর নাম" error={errors.contactName}>
          <input name="contactName" className={inputClass} autoComplete="name" />
        </Field>
        <Field label="মোবাইল নম্বর" error={errors.phone}>
          <input name="phone" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" className={inputClass} autoComplete="tel" />
        </Field>
      </div>
      <Field label="অতিরিক্ত তথ্য (ঐচ্ছিক)">
        <textarea name="note" rows={2} maxLength={300} className={inputClass} placeholder="রোগের ধরন, ওয়ার্ড/বেড নম্বর ইত্যাদি" />
      </Field>

      {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
      {Object.keys(errors).length > 0 && !errors.form && (
        <p className="text-sm text-red-600">লাল চিহ্নিত ঘরগুলো ঠিক করুন।</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-red-600 py-3 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "পোস্ট হচ্ছে…" : "অনুরোধ পোস্ট করুন"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-stone-200 px-4">
          বাতিল
        </button>
      </div>
    </form>
  );
}
