"use client";

import { useEffect, useState } from "react";
import LocationField from "@/components/LocationField";
import Sheet from "@/components/Sheet";
import { Field, inputClass } from "@/components/ui";
import { api } from "@/lib/client";
import type { BloodBank, LatLng } from "@/lib/types";
import { useAdmin } from "../AdminShell";
import { Badge, Btn, Empty, PageTitle } from "../ui";

const KIND: Record<BloodBank["kind"], string> = { blood_bank: "ব্লাড ব্যাংক", hospital: "হাসপাতাল", organization: "সংগঠন" };

export default function AdminBloodBanks() {
  const { staff } = useAdmin();
  const [banks, setBanks] = useState<BloodBank[] | null>(null);
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState<BloodBank | "new" | null>(null);

  useEffect(() => {
    api<{ banks: BloodBank[] }>("/api/admin/banks").then((res) => setBanks(res.ok ? res.data.banks : []));
  }, [version]);

  async function remove(id: string) {
    const res = await api(`/api/admin/banks/${id}`, { method: "DELETE" });
    if (res.ok) setVersion((v) => v + 1);
  }

  return (
    <div>
      <PageTitle
        title="ব্লাড ব্যাংক ও সংগঠন"
        subtitle="পাবলিক ‘ব্লাড ব্যাংক’ পেজে যা দেখায়"
        action={
          <Btn tone="danger" onClick={() => setEditing("new")}>
            + নতুন যোগ করুন
          </Btn>
        }
      />
      {banks === null ? (
        <p className="text-stone-500">লোড হচ্ছে…</p>
      ) : banks.length === 0 ? (
        <Empty>এখনো কিছু যোগ করা হয়নি।</Empty>
      ) : (
        <ul className="space-y-2">
          {banks.map((b) => (
            <li key={b.id} className={`flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ${b.active ? "" : "opacity-60"}`}>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {b.name} {!b.active && <span className="text-xs text-stone-500">(লুকানো)</span>}
                </p>
                <p className="text-sm text-stone-500">
                  {b.area}, {b.city} {b.phone && `· ${b.phone}`} {b.hours && `· ${b.hours}`}
                </p>
              </div>
              <Badge className="bg-violet-50 text-violet-700">{KIND[b.kind]}</Badge>
              <Btn onClick={() => setEditing(b)}>এডিট</Btn>
              {staff.role === "admin" && <Btn onClick={() => remove(b.id)}>মুছুন</Btn>}
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <BankForm
          bank={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setVersion((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}

function BankForm({ bank, onClose, onSaved }: { bank: BloodBank | null; onClose: () => void; onSaved: () => void }) {
  const [point, setPoint] = useState<LatLng | null>(bank ? { lat: bank.lat, lng: bank.lng } : null);
  const [area, setArea] = useState(bank?.area ?? "");
  const [city, setCity] = useState(bank?.city ?? "");
  const [active, setActive] = useState(bank?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(form), area, city, active, lat: point?.lat, lng: point?.lng };
    const res = bank ? await api(`/api/admin/banks/${bank.id}`, { method: "PUT", body }) : await api("/api/admin/banks", { body });
    if (res.ok) onSaved();
    else setErrors(Object.keys(res.errors).length ? res.errors : { form: res.error });
  }

  return (
    <Sheet title={bank ? "এডিট করুন" : "নতুন ব্লাড ব্যাংক / সংগঠন"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="নাম" error={errors.name}>
          <input name="name" defaultValue={bank?.name} className={inputClass} />
        </Field>
        <Field label="ধরন" error={errors.kind}>
          <select name="kind" defaultValue={bank?.kind ?? "blood_bank"} className={inputClass}>
            {Object.entries(KIND).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="ফোন" error={errors.phone}>
            <input name="phone" defaultValue={bank?.phone} type="tel" className={inputClass} />
          </Field>
          <Field label="সময়">
            <input name="hours" defaultValue={bank?.hours} placeholder="যেমন: ২৪ ঘণ্টা" className={inputClass} />
          </Field>
        </div>
        <Field label="নোট">
          <input name="note" defaultValue={bank?.note} className={inputClass} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-red-600" />
          পাবলিক পেজে দেখান
        </label>
        {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
        <button className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white">সংরক্ষণ করুন</button>
      </form>
    </Sheet>
  );
}
