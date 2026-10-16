import type { Metadata } from "next";
import { Suspense } from "react";
import ManageRequest from "./ManageRequest";

export const metadata: Metadata = { title: "অনুরোধ পরিচালনা", robots: { index: false } };

export default function ManageRequestPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-stone-500">লোড হচ্ছে…</p>}>
      <ManageRequest />
    </Suspense>
  );
}
