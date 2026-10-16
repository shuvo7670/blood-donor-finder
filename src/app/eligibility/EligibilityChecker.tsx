"use client";

import Link from "next/link";
import { useState } from "react";
import { inputClass } from "@/components/ui";
import { DONATION_GAP_DAYS, donationStatus, MAX_AGE, MIN_AGE, MIN_WEIGHT_KG } from "@/lib/blood";
import { bn, formatDate } from "@/lib/format";

const HEALTH_QUESTIONS = [
  { id: "fever", text: "গত ৭ দিনে জ্বর, সর্দি-কাশি বা ডায়রিয়া হয়েছে?" },
  { id: "antibiotic", text: "এখন অ্যান্টিবায়োটিক খাচ্ছেন?" },
  { id: "pregnant", text: "গর্ভবতী, বা গত ৬ মাসে সন্তান জন্ম দিয়েছেন / বুকের দুধ খাওয়াচ্ছেন?" },
  { id: "tattoo", text: "গত ৬ মাসে ট্যাটু, কান ফোঁড়ানো বা বড় অপারেশন হয়েছে?" },
  { id: "chronic", text: "হেপাটাইটিস বি/সি, এইচআইভি, হৃদরোগ বা নিয়ন্ত্রণহীন ডায়াবেটিস আছে?" },
  { id: "dengue", text: "গত ৬ মাসে ডেঙ্গু বা ম্যালেরিয়া হয়েছে?" },
];

export default function EligibilityChecker() {
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [lastDonation, setLastDonation] = useState("");
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState(false);

  const problems: string[] = [];
  const a = Number(age);
  const w = Number(weight);
  if (!age || a < MIN_AGE || a > MAX_AGE) problems.push(`বয়স ${bn(MIN_AGE)}–${bn(MAX_AGE)} বছরের মধ্যে হতে হবে।`);
  if (!weight || w < MIN_WEIGHT_KG) problems.push(`ওজন কমপক্ষে ${bn(MIN_WEIGHT_KG)} কেজি হতে হবে।`);
  if (lastDonation) {
    const s = donationStatus(lastDonation);
    if (!s.ready && s.nextEligibleDate)
      problems.push(`শেষ রক্তদানের পর ${bn(DONATION_GAP_DAYS)} দিন পার হয়নি — ${formatDate(s.nextEligibleDate)} থেকে দিতে পারবেন।`);
  }
  for (const q of HEALTH_QUESTIONS) if (answers[q.id]) problems.push(q.text.replace("?", " — এখন রক্ত না দেওয়াই ভালো।"));

  return (
    <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-3 gap-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium">বয়স</span>
          <input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} className={inputClass} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">ওজন (কেজি)</span>
          <input type="number" inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">শেষ রক্তদান</span>
          <input type="date" value={lastDonation} onChange={(e) => setLastDonation(e.target.value)} className={inputClass} />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">স্বাস্থ্য সংক্রান্ত প্রশ্ন</legend>
        {HEALTH_QUESTIONS.map((q) => (
          <div key={q.id} className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 p-3 text-sm">
            <span>{q.text}</span>
            <div className="flex shrink-0 overflow-hidden rounded-lg border border-stone-200">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [q.id]: v })}
                  className={`px-3 py-1.5 ${answers[q.id] === v ? (v ? "bg-red-600 text-white" : "bg-emerald-600 text-white") : "bg-white"}`}
                >
                  {v ? "হ্যাঁ" : "না"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      <button onClick={() => setChecked(true)} className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white">
        যাচাই করুন
      </button>

      {checked &&
        (problems.length === 0 ? (
          <div className="rounded-xl bg-emerald-50 p-4 text-emerald-900" role="status">
            <p className="font-semibold">✅ আপনি সম্ভবত রক্ত দিতে পারবেন!</p>
            <p className="mt-1 text-sm">রক্তদানের আগে ব্লাড ব্যাংক হিমোগ্লোবিন ও রক্তচাপ পরীক্ষা করবে।</p>
            <Link href="/register" className="mt-3 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              ডোনার হিসেবে নিবন্ধন করুন →
            </Link>
          </div>
        ) : (
          <div className="rounded-xl bg-amber-50 p-4 text-amber-900" role="status">
            <p className="font-semibold">⚠️ এই মুহূর্তে রক্ত না দেওয়াই ভালো</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      <p className="text-xs text-stone-400">এটি শুধু প্রাথমিক নির্দেশনা, চিকিৎসকের পরামর্শের বিকল্প নয়।</p>
    </section>
  );
}
