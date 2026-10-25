/**
 * One line per event of an application's history (« Historique des décisions »), shared by the
 * candidate page and its CSV export.
 */
import "server-only";
import type { getTranslations } from "next-intl/server";
import { reasonLabel } from "@/server/hire-report-export";

type HireT = Awaited<ReturnType<typeof getTranslations<"hire">>>;

export const payloadText = (payload: unknown, key: string) =>
  payload && typeof payload === "object" && key in payload
    ? String((payload as Record<string, unknown>)[key] ?? "")
    : "";

export function describeEvent(
  t: HireT,
  name: string,
  event: { type: string; payload: unknown; createdAt: Date },
) {
  const text = payloadText;
  switch (event.type) {
    case "submitted":
      return t("history.event.applied");
    case "viewed":
      return t("history.event.viewed", { memberName: name });
    case "stage_changed":
      return t("history.event.moved", {
        memberName: name,
        from: text(event.payload, "from"),
        to: text(event.payload, "to"),
      });
    case "decision":
      return text(event.payload, "toKind") === "hired"
        ? t("history.event.hired", { memberName: name })
        : t("history.event.rejected", {
            memberName: name,
            reason: reasonLabel(t, text(event.payload, "reason")),
          });
    case "note":
      return t("history.event.noted", { memberName: name });
    case "document_requested":
      return t("history.event.documentRequested", {
        memberName: name,
        documentName: text(event.payload, "name"),
      });
    case "message":
      return t("history.event.message", { memberName: name });
    case "withdrawn":
      // Recruiter lot 3: the team records that the candidate withdrew (« Retrait »).
      return text(event.payload, "by") === "team"
        ? t("history.event.withdrawnByTeam", { memberName: name })
        : t("history.event.withdrawn");
    case "orbi_analysis":
      return t("history.event.orbiAnalysis", { memberName: name });
    case "decision_undone":
      return t("history.event.decisionUndone", { memberName: name, to: text(event.payload, "to") });
    case "rated":
      return t("history.event.rated", { memberName: name });
    case "interview_scheduled":
      return t("history.event.interviewScheduled", {
        memberName: name,
        date: new Date(text(event.payload, "date") || event.createdAt),
      });
    case "assigned":
      return t("history.event.assigned", { memberName: name, to: text(event.payload, "toName") });
    case "job_proposal":
      return t("history.event.proposal", { memberName: name });
    default:
      return null;
  }
}
