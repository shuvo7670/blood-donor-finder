import type { BloodGroup } from "./blood";

export type LatLng = { lat: number; lng: number };
export type Gender = "male" | "female";
export type Urgency = "critical" | "urgent" | "normal";

export interface Donor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  phone: string;
  gender: Gender;
  age: number;
  weight: number;
  area: string;
  city: string;
  lat: number;
  lng: number;
  lastDonation: string | null;
  totalDonations: number;
  /** The donor's own switch: willing to be contacted right now. */
  available: boolean;
  verified: boolean;
  createdAt: string;
}

/** A donor as the API returns it, with the computed fields the UI needs. */
export interface DonorResult extends Donor {
  distanceKm: number | null;
  /** Available AND past the minimum gap since the last donation. */
  eligible: boolean;
  daysSinceDonation: number | null;
  nextEligibleDate: string | null;
}

export interface BloodRequest {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  bags: number;
  hospital: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  neededBy: string;
  urgency: Urgency;
  contactName: string;
  phone: string;
  note: string;
  status: "open" | "fulfilled";
  createdAt: string;
}

export interface RequestResult extends BloodRequest {
  distanceKm: number | null;
}

export interface Stats {
  totalDonors: number;
  eligibleDonors: number;
  openRequests: number;
  cities: number;
  totalDonations: number;
  byGroup: Record<BloodGroup, { total: number; eligible: number }>;
}
