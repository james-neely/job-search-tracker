export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "phone_screen",
  "interview_1",
  "interview_2",
  "interview_3",
  "interview_4",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  phone_screen: "Phone Screen",
  interview_1: "Interview 1",
  interview_2: "Interview 2",
  interview_3: "Interview 3",
  interview_4: "Interview 4",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: "#9e9e9e",
  applied: "#2196f3",
  phone_screen: "#ff9800",
  interview_1: "#ff9800",
  interview_2: "#ff9800",
  interview_3: "#ff9800",
  interview_4: "#ff9800",
  offer: "#4caf50",
  accepted: "#388e3c",
  rejected: "#f44336",
  withdrawn: "#757575",
};

export const XAI_API_URL = "https://api.x.ai/v1";
export const XAI_DEFAULT_MODEL = "grok-3-mini";
