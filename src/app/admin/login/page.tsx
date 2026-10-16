import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLogin from "./AdminLogin";

export const metadata: Metadata = { title: "অ্যাডমিন লগইন", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLogin />
    </Suspense>
  );
}
