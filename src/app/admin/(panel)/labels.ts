import type { DonorStatus } from "@/lib/types";

export const ACTION_LABELS: Record<string, string> = {
  login: "লগইন করেছেন",
  "password.change": "পাসওয়ার্ড বদলেছেন",
  "donor.approve": "ডোনার অনুমোদন",
  "donor.reject": "ডোনার বাতিল",
  "donor.suspend": "ডোনার স্থগিত",
  "donor.reinstate": "ডোনার পুনর্বহাল",
  "donor.verify": "ডোনার যাচাইকৃত",
  "donor.unverify": "যাচাই প্রত্যাহার",
  "donor.delete": "ডোনার মুছে ফেলা",
  "donor.reset_pin": "ডোনারের পিন রিসেট",
  "request.approve": "অনুরোধ অনুমোদন",
  "request.reject": "অনুরোধ বাতিল",
  "request.fulfil": "অনুরোধ সম্পন্ন",
  "request.close": "অনুরোধ বন্ধ",
  "request.reopen": "অনুরোধ পুনরায় চালু",
  "request.delete": "অনুরোধ মুছে ফেলা",
  "report.resolve": "রিপোর্ট সমাধান",
  "report.dismiss": "রিপোর্ট খারিজ",
  "bank.create": "ব্লাড ব্যাংক যোগ",
  "bank.update": "ব্লাড ব্যাংক এডিট",
  "bank.delete": "ব্লাড ব্যাংক মুছে ফেলা",
  "staff.create": "স্টাফ যোগ",
  "staff.update": "স্টাফ পরিবর্তন",
  "settings.update": "সেটিংস পরিবর্তন",
};

export const DONOR_STATUS: Record<DonorStatus, { label: string; className: string }> = {
  pending: { label: "অপেক্ষমাণ", className: "bg-amber-100 text-amber-800" },
  approved: { label: "অনুমোদিত", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "বাতিল", className: "bg-red-100 text-red-800" },
  suspended: { label: "স্থগিত", className: "bg-stone-200 text-stone-700" },
};
