import type { TalentApplicationStatus } from "@/server/services/applications";

/** Colour of each status chip (planche talent-2 `.st`). */
export const statusChip: Record<TalentApplicationStatus | "draft", string> = {
  draft: "t-env",
  sent: "t-env",
  viewed: "t-en",
  shortlisted: "t-pre",
  test: "t-en",
  interview: "t-ent",
  offer: "t-ent",
  hired: "t-pre",
  notSelected: "t-nr",
  withdrawn: "t-ret",
  jobClosed: "t-ret",
};
