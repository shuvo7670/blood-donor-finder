"use client";

import { useState, type ReactNode } from "react";
import Sheet from "@/components/Sheet";
import { inputClass } from "@/components/ui";
import { bn } from "@/lib/format";

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-sm">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium ${
            value === o.value ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          {o.label}
          {o.count ? <span className="rounded-full bg-red-600 px-1.5 text-xs text-white">{bn(o.count)}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Badge({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>{children}</span>;
}

const BTN = {
  primary: "bg-emerald-600 text-white",
  danger: "bg-red-600 text-white",
  ghost: "border border-stone-200 bg-white text-stone-700",
};

export function Btn({
  tone = "ghost",
  children,
  ...props
}: { tone?: keyof typeof BTN } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`rounded-xl px-3 py-1.5 text-sm font-semibold disabled:opacity-50 ${BTN[tone]} ${props.className ?? ""}`}>
      {children}
    </button>
  );
}

/** A button that asks for a reason (and confirmation) before running `onConfirm(reason)`. */
export function ReasonButton({
  label,
  title,
  tone = "danger",
  required = true,
  placeholder,
  confirmLabel,
  onConfirm,
}: {
  label: string;
  title: string;
  tone?: keyof typeof BTN;
  required?: boolean;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (reason: string) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (required && !reason.trim()) return setError("কারণ লিখুন।");
    setBusy(true);
    const err = await onConfirm(reason.trim());
    setBusy(false);
    if (err) setError(err);
    else {
      setOpen(false);
      setReason("");
    }
  }

  return (
    <>
      <Btn tone={tone} onClick={() => setOpen(true)}>
        {label}
      </Btn>
      {open && (
        <Sheet title={title} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder={placeholder ?? (required ? "কারণ (ব্যবহারকারী দেখতে পাবেন)" : "নোট (ঐচ্ছিক)")}
              className={inputClass}
              autoFocus
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={confirm}
              disabled={busy}
              className={`w-full rounded-xl py-3 font-semibold disabled:opacity-60 ${BTN[tone === "ghost" ? "danger" : tone]}`}
            >
              {confirmLabel ?? label}
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">{children}</p>;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("bn-BD", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
