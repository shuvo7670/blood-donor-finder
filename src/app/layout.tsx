import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const bangla = Hind_Siliguri({
  variable: "--font-bangla",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "রক্তবন্ধু — কাছের রক্তদাতা খুঁজুন", template: "%s · রক্তবন্ধু" },
  description: "লোকেশন অনুযায়ী ম্যাপে কাছের রক্তদাতা খুঁজুন, জরুরি রক্তের অনুরোধ দিন, রক্তদাতা হিসেবে নিবন্ধন করুন।",
  applicationName: "রক্তবন্ধু",
};

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className={`${bangla.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Nav />
        <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
      </body>
    </html>
  );
}
