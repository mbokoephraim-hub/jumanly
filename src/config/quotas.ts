/**
 * Limits shown as gauges in « Mon abonnement » (textes `billing.quotas.*`), in display order.
 * Periodic quotas count usage per rolling month; capacities count what exists now.
 */
export const quotaRows = [
  { key: "ai.credits.monthly", label: "ai", kind: "quota" },
  { key: "career.interview.text.monthly", label: "interviewText", kind: "quota" },
  { key: "career.interview.voice.monthly", label: "interviewVoice", kind: "quota" },
  { key: "hire.talent_search.monthly", label: "talentSearch", kind: "quota" },
  { key: "hire.contact_requests.monthly", label: "contactRequests", kind: "quota" },
  { key: "jobs.active.max", label: "activeJobs", kind: "capacity" },
  { key: "org.seats", label: "seats", kind: "capacity" },
] as const;

export type QuotaRow = (typeof quotaRows)[number];
