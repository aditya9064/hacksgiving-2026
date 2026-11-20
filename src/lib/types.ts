export const STATUSES = ["new", "claimed", "in_progress", "delivered", "verified"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  new: "New",
  claimed: "Claimed",
  in_progress: "In progress",
  delivered: "Delivered",
  verified: "Verified",
};

export const NEEDS = [
  "food",
  "rent",
  "utilities",
  "housing",
  "mediation",
  "safety",
  "health",
  "transport",
  "youth",
  "legal",
  "other",
] as const;
export type Need = (typeof NEEDS)[number];

export const NEED_LABEL: Record<Need, string> = {
  food: "Food",
  rent: "Rent",
  utilities: "Utilities",
  housing: "Housing",
  mediation: "Mediation",
  safety: "Safety",
  health: "Health",
  transport: "Transport",
  youth: "Youth",
  legal: "Legal",
  other: "Other",
};

export const URGENCIES = ["low", "normal", "high", "critical"] as const;
export type Urgency = (typeof URGENCIES)[number];

export const CHANNELS = ["sms", "web", "voice", "partner"] as const;
export type Channel = (typeof CHANNELS)[number];

export const NEIGHBORHOODS = [
  "Sherman Park",
  "Harambee",
  "Metcalfe Park",
  "Amani",
  "Lindsay Heights",
  "Riverwest",
  "Clarke Square",
  "Walker's Point",
  "Washington Park",
  "Garden Homes",
  "Bay View",
  "Historic Mitchell St",
  "Concordia",
  "Silver City",
  "Midtown",
] as const;

export interface Partner {
  id: string;
  name: string;
  needs: Need[];
  neighborhoods: string[];
  capacity: number; // open slots this week
  phone?: string;
  hours?: string;
  verifiedAt?: string;
}

export type ActivityType =
  | "created"
  | "structured"
  | "claimed"
  | "note"
  | "status"
  | "delivered"
  | "verify_sent"
  | "verified"
  | "partial"
  | "reopened"
  | "reassigned"
  | "sms_out"
  | "sms_in"
  | "call";

export interface ActivityEvent {
  id: string;
  requestId: string;
  at: string;
  actor: string; // display name, "resident", "system" or "ai"
  type: ActivityType;
  text: string;
}

export interface HelpRequest {
  id: string;
  shortCode: string; // e.g. R-4F2K, used in SMS
  createdAt: string;
  updatedAt: string;
  status: Status;
  channel: Channel;
  /** Raw message after PII redaction. The original never leaves the intake boundary. */
  redactedText: string;
  summary: string;
  needs: Need[];
  urgency: Urgency;
  neighborhood: string;
  householdSize?: number;
  language?: string;
  consentToShare: boolean;
  ownerName?: string;
  ownerOrg?: string;
  partnerId?: string;
  deliveredAt?: string;
  verifiedAt?: string;
  residentFeedback?: "yes" | "no" | "partial";
  /** ComForce-tier only. Never sent to the AI or shown on the board. */
  contactRef?: string;
  /** Phone-call intake (ElevenLabs agent). Transcript is redacted before storage. */
  call?: CallRecord;
}

export interface CallTurn {
  role: "agent" | "caller";
  text: string;
  /** seconds into the call */
  t: number;
}

export interface CallRecord {
  conversationId: string;
  durationSec?: number;
  /** Written by the second LLM after the call: 2-3 sentence, name-free summary */
  summary?: string;
  transcript: CallTurn[];
  endedAt?: string;
}

export interface Playbook {
  id: string;
  title: string;
  tags: Need[];
  body: string;
  updatedAt: string;
}

export interface StructuredIntake {
  redactedText: string;
  summary: string;
  needs: Need[];
  urgency: Urgency;
  neighborhood: string;
  householdSize?: number;
  language?: string;
  redactions: { kind: "name" | "phone" | "address" | "email" | "other"; placeholder: string }[];
  /** Whether the LLM produced these fields or the keyword rules did */
  source?: "llm" | "rules";
}

export interface Snapshot {
  requests: HelpRequest[];
  partners: Partner[];
  activity: ActivityEvent[];
  generatedAt: string;
}
