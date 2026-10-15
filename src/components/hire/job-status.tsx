import { useTranslations } from "next-intl";
import { Badge, type BadgeTone } from "@/components/ui";
import type { JobStatus } from "@/generated/prisma/client";

const keys = {
  draft: "draft",
  pending_review: "pendingReview",
  published: "published",
  closed: "closed",
  rejected: "rejected",
  changes_requested: "changesRequested",
  archived: "closed",
} as const satisfies Record<JobStatus, string>;

const tones: Record<JobStatus, BadgeTone> = {
  draft: "neutral",
  pending_review: "warning",
  published: "success",
  closed: "neutral",
  rejected: "error",
  changes_requested: "warning",
  archived: "neutral",
};

/** Status of a job in Hire (texts `hire.jobs.status.*`). */
export function JobStatusBadge({ status }: { status: JobStatus }) {
  const t = useTranslations("hire.jobs.status");
  return <Badge tone={tones[status]}>{t(keys[status])}</Badge>;
}
