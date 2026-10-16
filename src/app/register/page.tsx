import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "রক্তদাতা হিসেবে নিবন্ধন" };

export default function RegisterPage() {
  return <RegisterForm />;
}
