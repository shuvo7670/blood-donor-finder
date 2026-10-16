import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import { createSeed } from "@/lib/seed";
import { hashSecret, randomToken, sha256 } from "./crypto";

export const DEMO_DONOR_PIN = "1234";

const BLOOD_BANKS = [
  { name: "সন্ধানী, ঢাকা মেডিকেল কলেজ ইউনিট", kind: "organization", area: "বকশীবাজার", city: "ঢাকা", lat: 23.7257, lng: 90.3976, hours: "সকাল ৯টা – রাত ৯টা" },
  { name: "বাঁধন, ঢাকা বিশ্ববিদ্যালয় জোন", kind: "organization", area: "টিএসসি", city: "ঢাকা", lat: 23.7337, lng: 90.3925, hours: "সকাল ১০টা – সন্ধ্যা ৬টা" },
  { name: "কোয়ান্টাম ল্যাব ব্লাড ব্যাংক", kind: "blood_bank", area: "শান্তিনগর", city: "ঢাকা", lat: 23.739, lng: 90.414, hours: "২৪ ঘণ্টা" },
  { name: "বাংলাদেশ রেড ক্রিসেন্ট ব্লাড সেন্টার", kind: "blood_bank", area: "মোহাম্মদপুর", city: "ঢাকা", lat: 23.759, lng: 90.365, hours: "২৪ ঘণ্টা" },
  { name: "বিএসএমএমইউ ট্রান্সফিউশন মেডিসিন বিভাগ", kind: "hospital", area: "শাহবাগ", city: "ঢাকা", lat: 23.7389, lng: 90.3952, hours: "২৪ ঘণ্টা" },
  { name: "চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল ব্লাড ব্যাংক", kind: "hospital", area: "পাঁচলাইশ", city: "চট্টগ্রাম", lat: 22.3594, lng: 91.8306, hours: "২৪ ঘণ্টা" },
  { name: "সিলেট এম এ জি ওসমানী মেডিকেল ব্লাড ব্যাংক", kind: "hospital", area: "কাজলশাহ", city: "সিলেট", lat: 24.9003, lng: 91.8517, hours: "২৪ ঘণ্টা" },
  { name: "রাজশাহী মেডিকেল কলেজ হাসপাতাল ব্লাড ব্যাংক", kind: "hospital", area: "লক্ষ্মীপুর", city: "রাজশাহী", lat: 24.372, lng: 88.587, hours: "২৪ ঘণ্টা" },
];

function insertRow(conn: DatabaseSync, table: string, row: Record<string, SQLInputValue>) {
  const keys = Object.keys(row);
  conn.prepare(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys.map((k) => `:${k}`).join(", ")})`).run(row);
}

/** Fills an empty database with demo data and the first admin account. */
export function seedDatabase(conn: DatabaseSync) {
  const now = new Date().toISOString();
  const { donors, requests } = createSeed();
  const pinHash = hashSecret(DEMO_DONOR_PIN);

  conn.exec("BEGIN");
  try {
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    insertRow(conn, "staff", {
      id: "s001",
      name: "প্রধান অ্যাডমিন",
      username,
      passwordHash: hashSecret(password),
      role: "admin",
      active: 1,
      // Someone using the built-in default password is asked to change it.
      mustChangePassword: process.env.ADMIN_PASSWORD ? 0 : 1,
      createdAt: now,
    });

    donors.forEach((d, i) => {
      // The last few registrations wait in the approval queue.
      const pending = i >= donors.length - 6;
      insertRow(conn, "donors", {
        ...d,
        available: d.available ? 1 : 0,
        verified: !pending && d.verified ? 1 : 0,
        status: pending ? "pending" : "approved",
        statusReason: null,
        pinHash,
        contactViews: 0,
        createdAt: pending ? new Date(Date.now() - (i % 5) * 3600_000).toISOString() : d.createdAt,
        updatedAt: now,
      });
      if (d.lastDonation) {
        insertRow(conn, "donations", {
          id: `dn${d.id}`,
          donorId: d.id,
          date: d.lastDonation,
          place: "",
          note: "",
          createdAt: now,
        });
      }
    });

    requests.forEach((r, i) => {
      insertRow(conn, "requests", {
        ...r,
        // Two requests wait for approval so the admin queue isn't empty.
        status: i >= requests.length - 2 ? "pending" : "open",
        statusReason: null,
        manageTokenHash: sha256(randomToken()),
        updatedAt: now,
      });
    });

    insertRow(conn, "responses", {
      id: "rs001",
      requestId: requests[0].id,
      donorId: donors[0].id,
      name: donors[0].name,
      phone: donors[0].phone,
      bloodGroup: donors[0].bloodGroup,
      message: "আমি ৩০ মিনিটের মধ্যে আসতে পারব।",
      createdAt: now,
    });

    const reports = [
      { targetType: "donor", targetId: donors[3].id, reason: "wrong_number", details: "নম্বরে কল দিলে অন্য একজন ধরেন।" },
      { targetType: "donor", targetId: donors[11].id, reason: "asked_money", details: "রক্ত দেওয়ার জন্য টাকা চেয়েছেন।" },
    ];
    reports.forEach((r, i) =>
      insertRow(conn, "reports", { id: `rp00${i + 1}`, ...r, reporterPhone: "", status: "open", createdAt: now }),
    );

    BLOOD_BANKS.forEach((b, i) =>
      insertRow(conn, "bloodBanks", { id: `bb00${i + 1}`, ...b, phone: "", note: "", active: 1, createdAt: now, updatedAt: now }),
    );

    for (const [key, value] of Object.entries({ autoApproveDonors: "0", autoApproveRequests: "0", announcement: "" })) {
      insertRow(conn, "settings", { key, value });
    }
    conn.exec("COMMIT");
  } catch (error) {
    conn.exec("ROLLBACK");
    throw error;
  }
}
