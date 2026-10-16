import type { Metadata } from "next";
import AdminShell from "./AdminShell";

export const metadata: Metadata = { title: { default: "অ্যাডমিন", template: "%s · অ্যাডমিন" }, robots: { index: false } };

// The panel renders only after the client-side session check, so there is no static shell to
// validate for instant navigation.
export const instant = false;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
