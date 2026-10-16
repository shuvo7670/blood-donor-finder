import Link from "next/link";
import HomeSearch from "./HomeSearch";
import HomeLive from "./HomeLive";

const STEPS = [
  { icon: "🩸", title: "গ্রুপ বেছে নিন", text: "রোগীর রক্তের গ্রুপ বেছে নিন, চাইলে সামঞ্জস্যপূর্ণ সব গ্রুপ দেখুন।" },
  { icon: "📍", title: "কাছের ডোনার দেখুন", text: "আপনার লোকেশন বা এলাকা থেকে ম্যাপে আশেপাশের ডোনার দূরত্বসহ দেখুন।" },
  { icon: "📞", title: "সরাসরি যোগাযোগ", text: "কল বা WhatsApp-এ সরাসরি ডোনারের সাথে কথা বলুন, পথ দেখুন ম্যাপে।" },
];

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-red-600 to-red-700 px-4 pb-10 pt-8 text-white">
        <div className="mx-auto max-w-3xl space-y-5">
          <div>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">রক্ত লাগবে? কাছের রক্তদাতা খুঁজুন মিনিটেই</h1>
            <p className="mt-2 text-red-100">লোকেশন অনুযায়ী ম্যাপে আশেপাশের স্বেচ্ছায় রক্তদাতাদের দেখুন এবং সরাসরি যোগাযোগ করুন।</p>
          </div>
          <HomeSearch />
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-6">
        <HomeLive />

        <section>
          <h2 className="mb-3 text-lg font-semibold">কীভাবে কাজ করে</h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-3xl">{s.icon}</div>
                <h3 className="mt-2 font-semibold">
                  {i + 1}. {s.title}
                </h3>
                <p className="text-sm text-stone-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-red-900">আপনিও হতে পারেন কারো জীবনের নায়ক</h2>
            <p className="text-sm text-red-800">প্রতি ৪ মাসে একবার রক্ত দিন — এক ব্যাগ রক্ত তিনটি জীবন বাঁচাতে পারে।</p>
          </div>
          <Link href="/register" className="shrink-0 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white">
            ডোনার হিসেবে যোগ দিন
          </Link>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Link href="/blood-banks" className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-2xl">🏥</div>
            <p className="mt-1 font-semibold">ব্লাড ব্যাংক</p>
            <p className="text-xs text-stone-500">কাছের ব্লাড ব্যাংক ও সংগঠন</p>
          </Link>
          <Link href="/eligibility" className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-2xl">✅</div>
            <p className="mt-1 font-semibold">যোগ্যতা যাচাই</p>
            <p className="text-xs text-stone-500">আমি কি রক্ত দিতে পারব?</p>
          </Link>
        </section>

        <p className="text-center text-xs text-stone-400">
          ডেমো সংস্করণ: তালিকার ডোনার ও নম্বরগুলো কাল্পনিক।
        </p>
      </div>
    </div>
  );
}
