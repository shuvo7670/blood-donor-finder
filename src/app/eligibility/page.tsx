import type { Metadata } from "next";
import { BLOOD_GROUPS, donatesTo, RECEIVES_FROM } from "@/lib/blood";
import EligibilityChecker from "./EligibilityChecker";

export const metadata: Metadata = { title: "রক্তদানের যোগ্যতা ও গ্রুপ মিল" };

const TIPS = [
  "রক্তদানের আগের রাতে ভালো ঘুমান এবং ভরপেট খেয়ে আসুন।",
  "আগে-পরে প্রচুর পানি ও তরল পান করুন।",
  "রক্তদানের পর ১০–১৫ মিনিট বিশ্রাম নিন, সেদিন ভারী কাজ এড়িয়ে চলুন।",
  "শুধু স্বীকৃত ব্লাড ব্যাংক বা হাসপাতালে নতুন, জীবাণুমুক্ত সুঁইয়ে রক্ত দিন।",
  "রক্ত দেওয়ার বিনিময়ে টাকা নেওয়া বা দেওয়া অনুচিত — রক্তদান স্বেচ্ছায়।",
];

export default function EligibilityPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div>
        <h1 className="text-xl font-bold">আমি কি রক্ত দিতে পারব?</h1>
        <p className="text-sm text-stone-500">কয়েকটি প্রশ্নের উত্তর দিয়ে দ্রুত যাচাই করুন</p>
      </div>

      <EligibilityChecker />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">রক্তের গ্রুপ মিলের চার্ট</h2>
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-red-50 text-left text-red-900">
              <tr>
                <th className="p-3">গ্রুপ</th>
                <th className="p-3">যাদের দিতে পারবেন</th>
                <th className="p-3">যাদের থেকে নিতে পারবেন</th>
              </tr>
            </thead>
            <tbody>
              {BLOOD_GROUPS.map((g) => (
                <tr key={g} className="border-t border-stone-100">
                  <td className="p-3 text-base font-bold text-red-600">{g}</td>
                  <td className="p-3">{donatesTo(g).join(", ")}</td>
                  <td className="p-3">{RECEIVES_FROM[g].join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-stone-500">
          O− সর্বজনীন দাতা, AB+ সর্বজনীন গ্রহীতা (লোহিত কণিকার ক্ষেত্রে)। চূড়ান্ত মিল সবসময় ক্রস-ম্যাচ পরীক্ষায় নিশ্চিত করতে হয়।
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">রক্তদানের আগে-পরে</h2>
        <ul className="space-y-2">
          {TIPS.map((t) => (
            <li key={t} className="flex gap-2 rounded-xl bg-white p-3 text-sm shadow-sm">
              <span aria-hidden>💡</span>
              {t}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
