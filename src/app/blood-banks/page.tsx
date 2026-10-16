import type { Metadata } from "next";
import BloodBanks from "./BloodBanks";

export const metadata: Metadata = { title: "ব্লাড ব্যাংক ও সংগঠন" };

export default function BloodBanksPage() {
  return <BloodBanks />;
}
