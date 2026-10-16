import type { BloodGroup } from "./blood";
import { AREAS } from "./geo";
import type { BloodRequest, Donor, Gender, Urgency } from "./types";

export type SeedDonor = Omit<Donor, "status" | "statusReason" | "contactViews" | "updatedAt">;
export type SeedRequest = Omit<BloodRequest, "statusReason" | "updatedAt">;

// Deterministic PRNG so every fresh database holds the same demo donors.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MALE = ["রাকিব", "তানভীর", "সাকিব", "ফাহিম", "আরিফ", "নাঈম", "শুভ", "মেহেদী", "রাফি", "সজীব", "ইমরান", "জুবায়ের", "হাসান", "রিয়াদ", "তৌহিদ", "আসিফ"];
const FEMALE = ["নুসরাত", "তাসনিম", "ফারিহা", "সুমাইয়া", "রুমানা", "জান্নাত", "মিথিলা", "সাদিয়া", "আফসানা", "লামিয়া", "তানজিলা", "ইশরাত"];
const SURNAMES = ["হোসেন", "রহমান", "আহমেদ", "ইসলাম", "চৌধুরী", "খান", "সরকার", "মিয়া", "উদ্দিন", "কবির", "হক", "আলম"];
const HOSPITALS: { name: string; area: string; city: string; lat: number; lng: number }[] = [
  { name: "ঢাকা মেডিকেল কলেজ হাসপাতাল", area: "শাহবাগ", city: "ঢাকা", lat: 23.7257, lng: 90.3976 },
  { name: "বঙ্গবন্ধু শেখ মুজিব মেডিকেল বিশ্ববিদ্যালয়", area: "শাহবাগ", city: "ঢাকা", lat: 23.7389, lng: 90.3952 },
  { name: "স্কয়ার হাসপাতাল", area: "পান্থপথ", city: "ঢাকা", lat: 23.7529, lng: 90.3814 },
  { name: "ইউনাইটেড হাসপাতাল", area: "গুলশান", city: "ঢাকা", lat: 23.8045, lng: 90.4157 },
  { name: "চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল", area: "পাঁচলাইশ", city: "চট্টগ্রাম", lat: 22.3594, lng: 91.8306 },
  { name: "সিলেট এম এ জি ওসমানী মেডিকেল কলেজ হাসপাতাল", area: "কাজলশাহ", city: "সিলেট", lat: 24.9003, lng: 91.8517 },
];

// Roughly Bangladesh's ABO/Rh mix: negatives are rare.
const GROUP_WEIGHTS: [BloodGroup, number][] = [
  ["B+", 30], ["O+", 29], ["A+", 24], ["AB+", 8], ["B-", 2.5], ["O-", 2.5], ["A-", 2.5], ["AB-", 1.5],
];

export function createSeed(now = Date.now()): { donors: SeedDonor[]; requests: SeedRequest[] } {
  const rand = mulberry32(2026);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const between = (min: number, max: number) => Math.floor(min + rand() * (max - min + 1));
  const weightedGroup = () => {
    const total = GROUP_WEIGHTS.reduce((s, [, w]) => s + w, 0);
    let r = rand() * total;
    for (const [g, w] of GROUP_WEIGHTS) if ((r -= w) <= 0) return g;
    return "O+";
  };
  const day = 24 * 60 * 60 * 1000;

  const donors: SeedDonor[] = [];
  // Dhaka areas get more donors, like the real distribution of volunteers.
  const slots = AREAS.flatMap((area) => Array(area.city === "ঢাকা" ? 9 : 5).fill(area));
  slots.forEach((area, i) => {
    const gender: Gender = rand() < 0.68 ? "male" : "female";
    const first = gender === "male" ? pick(MALE) : pick(FEMALE);
    const neverDonated = rand() < 0.15;
    const total = neverDonated ? 0 : between(1, 25);
    donors.push({
      id: `d${String(i + 1).padStart(3, "0")}`,
      name: `${first} ${pick(SURNAMES)}`,
      bloodGroup: weightedGroup(),
      phone: `01${pick(["3", "5", "6", "7", "8", "9"])}${String(between(10000000, 99999999))}`,
      gender,
      age: between(19, 52),
      weight: between(gender === "male" ? 55 : 50, gender === "male" ? 88 : 72),
      area: area.name,
      city: area.city,
      // Scatter within ~2.5 km of the area centre.
      lat: +(area.lat + (rand() - 0.5) * 0.045).toFixed(5),
      lng: +(area.lng + (rand() - 0.5) * 0.045).toFixed(5),
      lastDonation: neverDonated ? null : new Date(now - between(12, 420) * day).toISOString().slice(0, 10),
      totalDonations: total,
      available: rand() < 0.88,
      verified: rand() < 0.6,
      createdAt: new Date(now - between(30, 700) * day).toISOString(),
    });
  });

  const hour = 60 * 60 * 1000;
  const requestSeeds: [number, BloodGroup, number, Urgency, number, string][] = [
    [0, "O-", 2, "critical", 3, "সিজারিয়ান অপারেশন, রোগী আইসিইউতে আছেন।"],
    [2, "B+", 1, "urgent", 10, "থ্যালাসেমিয়া রোগী, নিয়মিত রক্ত লাগে।"],
    [3, "A+", 3, "urgent", 20, "বাইপাস সার্জারি।"],
    [1, "AB-", 1, "critical", 5, "সড়ক দুর্ঘটনায় আহত।"],
    [4, "O+", 2, "normal", 48, "পরিকল্পিত অপারেশন।"],
    [5, "B-", 1, "urgent", 16, "ডেঙ্গু রোগী, প্লাটিলেট কমে গেছে।"],
  ];
  const requests: SeedRequest[] = requestSeeds.map(([h, group, bags, urgency, inHours, note], i) => {
    const hospital = HOSPITALS[h];
    return {
      id: `r${String(i + 1).padStart(3, "0")}`,
      patientName: `${pick([...MALE, ...FEMALE])} ${pick(SURNAMES)}`,
      bloodGroup: group,
      bags,
      hospital: hospital.name,
      area: hospital.area,
      city: hospital.city,
      lat: hospital.lat,
      lng: hospital.lng,
      neededBy: new Date(now + inHours * hour).toISOString(),
      urgency,
      contactName: `${pick(MALE)} ${pick(SURNAMES)}`,
      phone: `01${pick(["3", "7", "8", "9"])}${String(between(10000000, 99999999))}`,
      note,
      status: "open",
      createdAt: new Date(now - between(1, 20) * hour).toISOString(),
    };
  });

  return { donors, requests };
}

