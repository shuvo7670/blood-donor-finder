import type { Metadata } from "next";
import DonorAccount from "./DonorAccount";

export const metadata: Metadata = { title: "আমার প্রোফাইল", robots: { index: false } };

export default function MePage() {
  return <DonorAccount />;
}
