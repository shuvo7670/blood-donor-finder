import type { Metadata } from "next";
import { Suspense } from "react";
import FindDonors from "./FindDonors";

export const metadata: Metadata = { title: "ডোনার খুঁজুন" };

export default function FindPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-stone-500">লোড হচ্ছে…</p>}>
      <FindDonors />
    </Suspense>
  );
}
