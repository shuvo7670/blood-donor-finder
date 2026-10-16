import { promises as fs } from "node:fs";
import path from "node:path";
import { donationStatus } from "./blood";
import { distanceKm } from "./geo";
import { createSeed } from "./seed";
import type { BloodRequest, Donor, DonorResult, LatLng, RequestResult } from "./types";

/**
 * A small JSON-file store. data/db.json is created from the seed on first use; delete it
 * (npm run db:reset) to start over. Swap this module for a real database in production.
 */
export interface DbShape {
  donors: Donor[];
  requests: BloodRequest[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

export async function readDb(): Promise<DbShape> {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as DbShape;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const seed = createSeed();
    await writeFile(seed);
    return seed;
  }
}

async function writeFile(db: DbShape) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DB_FILE);
}

// Writes run one at a time so concurrent requests can't overwrite each other.
let queue: Promise<unknown> = Promise.resolve();

export function updateDb<T>(change: (db: DbShape) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDb();
    const result = change(db);
    await writeFile(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export function toDonorResult(donor: Donor, origin: LatLng | null): DonorResult {
  const status = donationStatus(donor.lastDonation);
  return {
    ...donor,
    distanceKm: origin ? distanceKm(origin, donor) : null,
    eligible: donor.available && status.ready,
    daysSinceDonation: status.daysSince,
    nextEligibleDate: status.nextEligibleDate,
  };
}

export function toRequestResult(request: BloodRequest, origin: LatLng | null): RequestResult {
  return { ...request, distanceKm: origin ? distanceKm(origin, request) : null };
}
