import type { Metadata } from "next";
import { Suspense } from "react";
import RequestsBoard from "./RequestsBoard";

export const metadata: Metadata = { title: "জরুরি রক্তের অনুরোধ" };

export default function RequestsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-stone-500">লোড হচ্ছে…</p>}>
      <RequestsBoard />
    </Suspense>
  );
}
