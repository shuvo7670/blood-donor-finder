"use client";

import { useEffect, useState } from "react";
import Sheet from "@/components/Sheet";
import { Field, inputClass } from "@/components/ui";
import { api } from "@/lib/client";
import type { Staff } from "@/lib/types";
import { useAdmin } from "../AdminShell";
import { Badge, Btn, formatDateTime, PageTitle } from "../ui";

export default function AdminStaff() {
  const { staff: me } = useAdmin();
  const [list, setList] = useState<Staff[] | null>(null);
  const [version, setVersion] = useState(0);
  const [adding, setAdding] = useState(false);
  const [resetFor, setResetFor] = useState<Staff | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ staff: Staff[] }>("/api/admin/staff").then((res) => setList(res.ok ? res.data.staff : []));
  }, [version]);

  async function update(id: string, patch: Record<string, unknown>) {
    setError(null);
    const res = await api(`/api/admin/staff/${id}`, { method: "PATCH", body: patch });
    if (res.ok) setVersion((v) => v + 1);
    else setError(res.error);
  }

  if (me.role !== "admin") return <p>শুধু অ্যাডমিন এই পেজ দেখতে পারেন।</p>;

  return (
    <div>
      <PageTitle
        title="স্টাফ"
        subtitle="মডারেটর: ডোনার, অনুরোধ, রিপোর্ট ও ব্লাড ব্যাংক সামলান। অ্যাডমিন: এর সাথে মুছে ফেলা, স্টাফ ও সেটিংস।"
        action={
          <Btn tone="danger" onClick={() => setAdding(true)}>
            + নতুন স্টাফ
          </Btn>
        }
      />
      {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {list === null ? (
        <p className="text-stone-500">লোড হচ্ছে…</p>
      ) : (
        <ul className="space-y-2">
          {list.map((s) => (
            <li key={s.id} className={`flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ${s.active ? "" : "opacity-60"}`}>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {s.name} <span className="text-sm font-normal text-stone-500">@{s.username}</span>
                  {s.id === me.id && <span className="text-xs text-stone-500"> (আপনি)</span>}
                </p>
                <p className="text-xs text-stone-400">
                  শেষ লগইন: {s.lastLoginAt ? formatDateTime(s.lastLoginAt) : "কখনো না"}
                  {s.mustChangePassword && " · পাসওয়ার্ড বদলাতে হবে"}
                </p>
              </div>
              <Badge className={s.role === "admin" ? "bg-stone-900 text-white" : "bg-sky-100 text-sky-800"}>
                {s.role === "admin" ? "অ্যাডমিন" : "মডারেটর"}
              </Badge>
              {!s.active && <Badge className="bg-stone-200 text-stone-700">নিষ্ক্রিয়</Badge>}
              {s.id !== me.id && (
                <div className="flex flex-wrap gap-2">
                  <Btn onClick={() => update(s.id, { role: s.role === "admin" ? "moderator" : "admin" })}>
                    {s.role === "admin" ? "মডারেটর করুন" : "অ্যাডমিন করুন"}
                  </Btn>
                  <Btn onClick={() => update(s.id, { active: !s.active })}>{s.active ? "নিষ্ক্রিয়" : "সক্রিয়"}</Btn>
                  <Btn onClick={() => setResetFor(s)}>পাসওয়ার্ড রিসেট</Btn>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {adding && (
        <AddStaff
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            setVersion((v) => v + 1);
          }}
        />
      )}
      {resetFor && (
        <ResetPassword
          staff={resetFor}
          onClose={() => setResetFor(null)}
          onSaved={() => {
            setResetFor(null);
            setVersion((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}

function AddStaff({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await api("/api/admin/staff", { body: Object.fromEntries(new FormData(e.currentTarget)) });
    if (res.ok) onSaved();
    else setErrors(Object.keys(res.errors).length ? res.errors : { form: res.error });
  }
  return (
    <Sheet title="নতুন স্টাফ" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="নাম" error={errors.name}>
          <input name="name" className={inputClass} />
        </Field>
        <Field label="ইউজারনেম" error={errors.username}>
          <input name="username" autoCapitalize="none" className={inputClass} />
        </Field>
        <Field label="ভূমিকা">
          <select name="role" className={inputClass} defaultValue="moderator">
            <option value="moderator">মডারেটর</option>
            <option value="admin">অ্যাডমিন</option>
          </select>
        </Field>
        <Field label="অস্থায়ী পাসওয়ার্ড" error={errors.password} hint="প্রথম লগইনে বদলাতে হবে">
          <input name="password" type="text" className={inputClass} autoComplete="off" />
        </Field>
        {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
        <button className="w-full rounded-xl bg-stone-900 py-3 font-semibold text-white">যোগ করুন</button>
      </form>
    </Sheet>
  );
}

function ResetPassword({ staff, onClose, onSaved }: { staff: Staff; onClose: () => void; onSaved: () => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = new FormData(e.currentTarget).get("password");
    const res = await api(`/api/admin/staff/${staff.id}`, { method: "PATCH", body: { password } });
    if (res.ok) onSaved();
    else setErrors(Object.keys(res.errors).length ? res.errors : { form: res.error });
  }
  return (
    <Sheet title={`${staff.name}-এর পাসওয়ার্ড রিসেট`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="নতুন অস্থায়ী পাসওয়ার্ড" error={errors.password} hint="তাকে লগআউট করা হবে, পরের লগইনে বদলাতে হবে">
          <input name="password" type="text" className={inputClass} autoComplete="off" />
        </Field>
        {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
        <button className="w-full rounded-xl bg-stone-900 py-3 font-semibold text-white">রিসেট করুন</button>
      </form>
    </Sheet>
  );
}
