import type { BloodGroup } from "./blood";

export type LatLng = { lat: number; lng: number };
export type Gender = "male" | "female";
export type Urgency = "critical" | "urgent" | "normal";
export type DonorStatus = "pending" | "approved" | "rejected" | "suspended";
export type RequestStatus = "pending" | "open" | "fulfilled" | "closed" | "rejected";
export type StaffRole = "admin" | "moderator";

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
  status: DonorStatus;
  /** Why a donor was rejected or suspended, shown to them. */
  statusReason: string | null;
  contactViews: number;
  createdAt: string;
  updatedAt: string;
}

interface DonationState {
  /** Available AND past the minimum gap since the last donation. */
  eligible: boolean;
  daysSinceDonation: number | null;
  nextEligibleDate: string | null;
}

/** What anyone can see: no phone number (see /api/donors/:id/contact) and no moderation fields. */
export interface PublicDonor
  extends Omit<Donor, "phone" | "status" | "statusReason" | "contactViews" | "updatedAt">,
    DonationState {
  phoneMasked: string;
  distanceKm: number | null;
}

/** The full record, for the donor themself and for staff. */
export interface DonorDetail extends Donor, DonationState {}

export interface Donation {
  id: string;
  donorId: string;
  date: string;
  place: string;
  note: string;
  createdAt: string;
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
  status: RequestStatus;
  statusReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequestResult extends BloodRequest {
  distanceKm: number | null;
  responseCount: number;
}

export interface RequestResponse {
  id: string;
  requestId: string;
  donorId: string | null;
  name: string;
  phone: string;
  bloodGroup: BloodGroup | null;
  message: string;
  createdAt: string;
}

export type ReportReason = "wrong_number" | "not_responding" | "fake" | "asked_money" | "other";

export interface Report {
  id: string;
  targetType: "donor" | "request";
  targetId: string;
  /** Name of the reported donor / request's hospital, joined in for the admin list. */
  targetLabel?: string;
  reason: ReportReason;
  details: string;
  reporterPhone: string;
  status: "open" | "resolved" | "dismissed";
  resolutionNote: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface BloodBank {
  id: string;
  name: string;
  kind: "blood_bank" | "hospital" | "organization";
  area: string;
  city: string;
  lat: number;
  lng: number;
  phone: string;
  hours: string;
  note: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BloodBankResult extends BloodBank {
  distanceKm: number | null;
}

export interface Staff {
  id: string;
  name: string;
  username: string;
  role: StaffRole;
  active: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuditEntry {
  id: number;
  actorId: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  createdAt: string;
}

export interface Settings {
  autoApproveDonors: boolean;
  autoApproveRequests: boolean;
  /** Shown as a banner on the home page when non-empty. */
  announcement: string;
}

export interface Stats {
  totalDonors: number;
  eligibleDonors: number;
  openRequests: number;
  fulfilledRequests: number;
  cities: number;
  totalDonations: number;
  bloodBanks: number;
  byGroup: Record<BloodGroup, { total: number; eligible: number }>;
  announcement: string;
}
